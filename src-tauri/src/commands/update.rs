use crate::error::{AppError, AppResult};
use std::path::PathBuf;
use std::process::Command;

/// The repo this binary was built from (baked in at compile time).
/// Fine for a source-built personal app: the Update button rebuilds from
/// the same checkout that produced the running binary.
fn repo_root() -> AppResult<PathBuf> {
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest
        .parent()
        .map(|p| p.to_path_buf())
        .ok_or_else(|| AppError::Msg("cannot locate repo root".into()))
}

/// Spawn the platform update script detached, then quit so no files stay
/// locked while the installer replaces the app.
#[tauri::command]
pub async fn launch_update(app: tauri::AppHandle) -> AppResult<()> {
    let repo = repo_root()?;

    #[cfg(target_os = "windows")]
    {
        let script = repo.join("scripts").join("update.ps1");
        if !script.exists() {
            return Err(AppError::Msg(format!(
                "Update script not found: {}. Was the app built from a moved or deleted checkout?",
                script.display()
            )));
        }
        // `cmd /c start` detaches and opens a console window so the user can
        // watch the pull/build/install progress.
        Command::new("cmd")
            .args([
                "/c",
                "start",
                "Plotr Update",
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
            ])
            .arg(&script)
            .current_dir(&repo)
            .spawn()
            .map_err(|e| AppError::Msg(format!("failed to launch updater: {e}")))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        let script = repo.join("scripts").join("update.sh");
        if !script.exists() {
            return Err(AppError::Msg(format!(
                "Update script not found: {}. Was the app built from a moved or deleted checkout?",
                script.display()
            )));
        }
        // The script detaches itself (logs to ~/.cache/plotr-update.log and
        // notifies on completion).
        Command::new("bash")
            .arg(&script)
            .current_dir(&repo)
            .spawn()
            .map_err(|e| AppError::Msg(format!("failed to launch updater: {e}")))?;
    }

    app.exit(0);
    Ok(())
}
