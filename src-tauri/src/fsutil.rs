use crate::error::{AppError, AppResult};
use atomicwrites::{AtomicFile, OverwriteBehavior};
use std::io::Write;
use std::path::{Component, Path, PathBuf};

/// Resolve a relative path inside a project folder, rejecting absolute paths
/// and any attempt to escape the project root via `..`.
pub fn resolve_in_project(project_path: &str, rel_path: &str) -> AppResult<PathBuf> {
    let rel = Path::new(rel_path);
    let escapes = rel.is_absolute()
        || rel
            .components()
            .any(|c| matches!(c, Component::ParentDir | Component::Prefix(_)));
    if escapes {
        return Err(AppError::Msg(format!("invalid project path: {rel_path}")));
    }
    Ok(Path::new(project_path).join(rel))
}

/// Atomic write: tmp file in the same directory + rename-over. Retries a few
/// times because antivirus on Windows can transiently lock the destination.
pub fn atomic_write(path: &Path, contents: &[u8]) -> AppResult<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let mut last_err: Option<String> = None;
    for attempt in 0..3u64 {
        if attempt > 0 {
            std::thread::sleep(std::time::Duration::from_millis(60 * attempt));
        }
        let af = AtomicFile::new(path, OverwriteBehavior::AllowOverwrite);
        match af.write(|f| f.write_all(contents)) {
            Ok(()) => return Ok(()),
            Err(e) => last_err = Some(e.to_string()),
        }
    }
    Err(AppError::Msg(format!(
        "failed to write {}: {}",
        path.display(),
        last_err.unwrap_or_default()
    )))
}

/// Strip characters that are invalid in folder names on Windows/Linux.
pub fn sanitize_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => ' ',
            c if (c as u32) < 0x20 => ' ',
            c => c,
        })
        .collect();
    let cleaned = cleaned.trim().trim_end_matches('.').to_string();
    if cleaned.is_empty() {
        "Untitled".to_string()
    } else {
        cleaned
    }
}
