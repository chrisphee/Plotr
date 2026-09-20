use crate::error::{AppError, AppResult};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::path::Path;

#[derive(Serialize)]
pub struct AttachmentMeta {
    pub rel_path: String,
    pub file_name: String,
    pub size: u64,
    pub mime: String,
}

fn mime_for(ext: &str) -> &'static str {
    match ext.to_ascii_lowercase().as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "pdf" => "application/pdf",
        "txt" => "text/plain",
        "md" => "text/markdown",
        "doc" | "docx" => "application/msword",
        "odt" => "application/vnd.oasis.opendocument.text",
        "epub" => "application/epub+zip",
        "mp3" => "audio/mpeg",
        "mp4" => "video/mp4",
        _ => "application/octet-stream",
    }
}

fn store_bytes(project_path: &str, file_name: &str, bytes: &[u8]) -> AppResult<AttachmentMeta> {
    let ext = Path::new(file_name)
        .extension()
        .map(|e| e.to_string_lossy().to_ascii_lowercase())
        .unwrap_or_else(|| "bin".into());
    let hash = {
        let mut h = Sha256::new();
        h.update(bytes);
        hex::encode(&h.finalize()[..8])
    };
    let rel_path = format!("assets/{hash}.{ext}");
    let dest = Path::new(project_path).join(&rel_path);
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }
    // Content-addressed: identical bytes dedupe to the same file.
    if !dest.exists() {
        std::fs::write(&dest, bytes)?;
    }
    Ok(AttachmentMeta {
        rel_path,
        file_name: file_name.to_string(),
        size: bytes.len() as u64,
        mime: mime_for(&ext).to_string(),
    })
}

/// Copy a file from anywhere on disk into the project's assets folder.
#[tauri::command]
pub async fn import_attachment(project_path: String, source_path: String) -> AppResult<AttachmentMeta> {
    let source = Path::new(&source_path);
    let file_name = source
        .file_name()
        .ok_or_else(|| AppError::Msg("invalid source file".into()))?
        .to_string_lossy()
        .to_string();
    let bytes = std::fs::read(source)?;
    store_bytes(&project_path, &file_name, &bytes)
}

/// Store raw bytes (pasted or dropped image data) as a project asset.
#[tauri::command]
pub async fn import_attachment_bytes(
    project_path: String,
    file_name: String,
    bytes: Vec<u8>,
) -> AppResult<AttachmentMeta> {
    store_bytes(&project_path, &file_name, &bytes)
}
