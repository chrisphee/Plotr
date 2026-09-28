use crate::commands::assets::{store_bytes, AttachmentMeta};
use crate::error::{AppError, AppResult};
use rand::Rng;
use serde::Serialize;
use serde_json::Value;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::PathBuf;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;

const REDIRECT_URI: &str = "http://localhost:8585/callback";
const REDIRECT_URI_ENC: &str = "http%3A%2F%2Flocalhost%3A8585%2Fcallback";
const SCOPES_ENC: &str = "boards%3Aread%2Cpins%3Aread";
const TOKEN_URL: &str = "https://api.pinterest.com/v5/oauth/token";
const API: &str = "https://api.pinterest.com/v5";

#[derive(Serialize, serde::Deserialize, Default, Clone)]
struct PinterestConfig {
    app_id: String,
    app_secret: String,
    access_token: Option<String>,
    refresh_token: Option<String>,
    expires_at: Option<u64>,
    username: Option<String>,
}

#[derive(Serialize)]
pub struct ConnectorStatus {
    pub configured: bool,
    pub connected: bool,
    pub username: Option<String>,
}

#[derive(Serialize)]
pub struct PinterestBoard {
    pub id: String,
    pub name: String,
    pub pin_count: u64,
}

#[derive(Serialize)]
pub struct PinterestPin {
    pub id: String,
    pub title: String,
    pub thumb_url: String,
    pub image_url: String,
}

#[derive(Serialize)]
pub struct PinPage {
    pub items: Vec<PinterestPin>,
    pub bookmark: Option<String>,
}

fn config_path(app: &tauri::AppHandle) -> AppResult<PathBuf> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| AppError::Msg(e.to_string()))?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join("pinterest.json"))
}

fn load_config(app: &tauri::AppHandle) -> AppResult<PinterestConfig> {
    let path = config_path(app)?;
    if !path.exists() {
        return Ok(PinterestConfig::default());
    }
    let raw = std::fs::read_to_string(path)?;
    Ok(serde_json::from_str(&raw).unwrap_or_default())
}

fn save_config(app: &tauri::AppHandle, cfg: &PinterestConfig) -> AppResult<()> {
    let path = config_path(app)?;
    std::fs::write(path, serde_json::to_string_pretty(cfg)?.as_bytes())?;
    Ok(())
}

fn now_secs() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()
}

fn api_err(context: &str, status: reqwest::StatusCode, body: &str) -> AppError {
    AppError::Msg(format!("Pinterest {context} failed ({status}): {}", &body[..body.len().min(300)]))
}

async fn apply_token_response(
    app: &tauri::AppHandle,
    cfg: &mut PinterestConfig,
    resp: reqwest::Response,
    context: &str,
) -> AppResult<()> {
    let status = resp.status();
    let body = resp.text().await.unwrap_or_default();
    if !status.is_success() {
        return Err(api_err(context, status, &body));
    }
    let v: Value = serde_json::from_str(&body).map_err(|e| AppError::Msg(e.to_string()))?;
    cfg.access_token = v["access_token"].as_str().map(String::from);
    if let Some(rt) = v["refresh_token"].as_str() {
        cfg.refresh_token = Some(rt.to_string());
    }
    let expires_in = v["expires_in"].as_u64().unwrap_or(3600);
    cfg.expires_at = Some(now_secs() + expires_in);
    if cfg.access_token.is_none() {
        return Err(AppError::Msg(format!("Pinterest {context}: no access_token in response")));
    }
    save_config(app, cfg)
}

/// Valid access token, refreshed when close to expiry.
async fn access_token(app: &tauri::AppHandle) -> AppResult<String> {
    let mut cfg = load_config(app)?;
    let token = cfg
        .access_token
        .clone()
        .ok_or_else(|| AppError::Msg("Pinterest is not connected.".into()))?;
    if cfg.expires_at.unwrap_or(0) > now_secs() + 60 {
        return Ok(token);
    }
    let refresh = cfg
        .refresh_token
        .clone()
        .ok_or_else(|| AppError::Msg("Pinterest session expired. Connect again.".into()))?;
    let client = reqwest::Client::new();
    let resp = client
        .post(TOKEN_URL)
        .basic_auth(&cfg.app_id, Some(&cfg.app_secret))
        .form(&[("grant_type", "refresh_token"), ("refresh_token", refresh.as_str())])
        .send()
        .await
        .map_err(|e| AppError::Msg(e.to_string()))?;
    apply_token_response(app, &mut cfg, resp, "token refresh").await?;
    Ok(cfg.access_token.unwrap())
}

/// Block until the browser hits the localhost callback, or time out.
fn wait_for_code(listener: TcpListener, expected_state: String) -> AppResult<String> {
    listener.set_nonblocking(true).map_err(AppError::Io)?;
    let deadline = Instant::now() + Duration::from_secs(180);
    loop {
        match listener.accept() {
            Ok((mut stream, _)) => {
                let mut buf = [0u8; 4096];
                stream.set_read_timeout(Some(Duration::from_secs(5))).ok();
                let n = stream.read(&mut buf).unwrap_or(0);
                let req = String::from_utf8_lossy(&buf[..n]);
                let first = req.lines().next().unwrap_or("");
                let ok = first.starts_with("GET /callback");
                let _ = stream.write_all(
                    b"HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n\
                      <html><body style=\"font-family:sans-serif;padding:40px\">\
                      <h2>Plotr is connected.</h2><p>You can close this window.</p></body></html>",
                );
                if !ok {
                    continue;
                }
                let query = first
                    .split_whitespace()
                    .nth(1)
                    .and_then(|p| p.split_once('?'))
                    .map(|(_, q)| q)
                    .unwrap_or("");
                let mut code = None;
                let mut state = None;
                for pair in query.split('&') {
                    if let Some((k, v)) = pair.split_once('=') {
                        match k {
                            "code" => code = Some(v.to_string()),
                            "state" => state = Some(v.to_string()),
                            _ => {}
                        }
                    }
                }
                if state.as_deref() != Some(expected_state.as_str()) {
                    return Err(AppError::Msg("OAuth state mismatch. Try again.".into()));
                }
                return code.ok_or_else(|| {
                    AppError::Msg("Pinterest denied access or sent no code.".into())
                });
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                if Instant::now() > deadline {
                    return Err(AppError::Msg(
                        "Timed out waiting for the Pinterest sign-in.".into(),
                    ));
                }
                std::thread::sleep(Duration::from_millis(200));
            }
            Err(e) => return Err(AppError::Io(e)),
        }
    }
}

#[tauri::command]
pub async fn pinterest_configure(
    app: tauri::AppHandle,
    app_id: String,
    app_secret: String,
) -> AppResult<()> {
    let mut cfg = load_config(&app)?;
    cfg.app_id = app_id.trim().to_string();
    cfg.app_secret = app_secret.trim().to_string();
    save_config(&app, &cfg)
}

#[tauri::command]
pub async fn pinterest_status(app: tauri::AppHandle) -> AppResult<ConnectorStatus> {
    let cfg = load_config(&app)?;
    Ok(ConnectorStatus {
        configured: !cfg.app_id.is_empty() && !cfg.app_secret.is_empty(),
        connected: cfg.access_token.is_some(),
        username: cfg.username,
    })
}

#[tauri::command]
pub async fn pinterest_connect(app: tauri::AppHandle) -> AppResult<ConnectorStatus> {
    let mut cfg = load_config(&app)?;
    if cfg.app_id.is_empty() || cfg.app_secret.is_empty() {
        return Err(AppError::Msg("Enter the App ID and secret first.".into()));
    }
    let listener = TcpListener::bind("127.0.0.1:8585")
        .map_err(|_| AppError::Msg("Port 8585 is in use. Close the other program and retry.".into()))?;
    let state: String = {
        let mut rng = rand::thread_rng();
        (0..24).map(|_| format!("{:x}", rng.gen_range(0..16u8))).collect()
    };
    let auth_url = format!(
        "https://www.pinterest.com/oauth/?client_id={}&redirect_uri={}&response_type=code&scope={}&state={}",
        cfg.app_id, REDIRECT_URI_ENC, SCOPES_ENC, state
    );
    app.opener()
        .open_url(&auth_url, None::<&str>)
        .map_err(|e| AppError::Msg(e.to_string()))?;

    let code = tauri::async_runtime::spawn_blocking(move || wait_for_code(listener, state))
        .await
        .map_err(|e| AppError::Msg(e.to_string()))??;

    let client = reqwest::Client::new();
    let resp = client
        .post(TOKEN_URL)
        .basic_auth(&cfg.app_id, Some(&cfg.app_secret))
        .form(&[
            ("grant_type", "authorization_code"),
            ("code", code.as_str()),
            ("redirect_uri", REDIRECT_URI),
        ])
        .send()
        .await
        .map_err(|e| AppError::Msg(e.to_string()))?;
    apply_token_response(&app, &mut cfg, resp, "sign-in").await?;

    let token = cfg.access_token.clone().unwrap();
    if let Ok(resp) = client
        .get(format!("{API}/user_account"))
        .bearer_auth(&token)
        .send()
        .await
    {
        if let Ok(v) = resp.json::<Value>().await {
            cfg.username = v["username"].as_str().map(String::from);
            save_config(&app, &cfg)?;
        }
    }
    Ok(ConnectorStatus {
        configured: true,
        connected: true,
        username: cfg.username,
    })
}

#[tauri::command]
pub async fn pinterest_disconnect(app: tauri::AppHandle) -> AppResult<()> {
    let mut cfg = load_config(&app)?;
    cfg.access_token = None;
    cfg.refresh_token = None;
    cfg.expires_at = None;
    cfg.username = None;
    save_config(&app, &cfg)
}

#[tauri::command]
pub async fn pinterest_list_boards(app: tauri::AppHandle) -> AppResult<Vec<PinterestBoard>> {
    let token = access_token(&app).await?;
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{API}/boards?page_size=100"))
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| AppError::Msg(e.to_string()))?;
    let status = resp.status();
    let body = resp.text().await.unwrap_or_default();
    if !status.is_success() {
        return Err(api_err("board list", status, &body));
    }
    let v: Value = serde_json::from_str(&body).map_err(|e| AppError::Msg(e.to_string()))?;
    let boards = v["items"]
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter_map(|b| {
                    Some(PinterestBoard {
                        id: b["id"].as_str()?.to_string(),
                        name: b["name"].as_str().unwrap_or("Untitled").to_string(),
                        pin_count: b["pin_count"].as_u64().unwrap_or(0),
                    })
                })
                .collect()
        })
        .unwrap_or_default();
    Ok(boards)
}

fn best_image_urls(pin: &Value) -> Option<(String, String)> {
    let images = pin["media"]["images"].as_object()?;
    let mut best: Option<(u64, &str)> = None;
    let mut thumb: Option<(u64, &str)> = None;
    for img in images.values() {
        let w = img["width"].as_u64().unwrap_or(0);
        let url = img["url"].as_str()?;
        if best.map_or(true, |(bw, _)| w > bw) {
            best = Some((w, url));
        }
        if w >= 150 && thumb.map_or(true, |(tw, _)| w < tw) {
            thumb = Some((w, url));
        }
    }
    let full = best?.1.to_string();
    let small = thumb.map(|(_, u)| u.to_string()).unwrap_or_else(|| full.clone());
    Some((small, full))
}

#[tauri::command]
pub async fn pinterest_list_pins(
    app: tauri::AppHandle,
    board_id: String,
    bookmark: Option<String>,
) -> AppResult<PinPage> {
    let token = access_token(&app).await?;
    let mut url = format!("{API}/boards/{board_id}/pins?page_size=50");
    if let Some(b) = &bookmark {
        url.push_str(&format!("&bookmark={b}"));
    }
    let client = reqwest::Client::new();
    let resp = client
        .get(url)
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| AppError::Msg(e.to_string()))?;
    let status = resp.status();
    let body = resp.text().await.unwrap_or_default();
    if !status.is_success() {
        return Err(api_err("pin list", status, &body));
    }
    let v: Value = serde_json::from_str(&body).map_err(|e| AppError::Msg(e.to_string()))?;
    let items = v["items"]
        .as_array()
        .map(|pins| {
            pins.iter()
                .filter_map(|p| {
                    let (thumb_url, image_url) = best_image_urls(p)?;
                    Some(PinterestPin {
                        id: p["id"].as_str()?.to_string(),
                        title: p["title"].as_str().unwrap_or("").to_string(),
                        thumb_url,
                        image_url,
                    })
                })
                .collect()
        })
        .unwrap_or_default();
    Ok(PinPage {
        items,
        bookmark: v["bookmark"].as_str().map(String::from),
    })
}

#[tauri::command]
pub async fn pinterest_import_pin(
    project_path: String,
    image_url: String,
    pin_id: String,
) -> AppResult<AttachmentMeta> {
    let client = reqwest::Client::new();
    let resp = client
        .get(&image_url)
        .send()
        .await
        .map_err(|e| AppError::Msg(e.to_string()))?;
    if !resp.status().is_success() {
        return Err(AppError::Msg(format!("image download failed ({})", resp.status())));
    }
    let ext = image_url
        .rsplit('.')
        .next()
        .filter(|e| matches!(*e, "png" | "jpg" | "jpeg" | "gif" | "webp"))
        .unwrap_or("jpg");
    let file_name = format!("pinterest-{pin_id}.{ext}");
    let bytes = resp.bytes().await.map_err(|e| AppError::Msg(e.to_string()))?;
    store_bytes(&project_path, &file_name, &bytes)
}
