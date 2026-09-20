use crate::error::{AppError, AppResult};
use serde::Deserialize;
use std::io::{Read, Write};
use std::path::Path;
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;

/// Zip the whole project folder into `dest_zip` (lossless backup).
#[tauri::command]
pub async fn export_zip(project_path: String, dest_zip: String) -> AppResult<()> {
    let root = Path::new(&project_path);
    if !root.join("project.json").exists() {
        return Err(AppError::Msg("not a Plotr project folder".into()));
    }
    let file = std::fs::File::create(&dest_zip)?;
    let mut zip = zip::ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        let rel = path
            .strip_prefix(root)
            .map_err(|_| AppError::Msg("path error".into()))?;
        if rel.as_os_str().is_empty() {
            continue;
        }
        let rel_str = rel.to_string_lossy().replace('\\', "/");
        if entry.file_type().is_dir() {
            zip.add_directory(&rel_str, options)
                .map_err(|e| AppError::Msg(e.to_string()))?;
        } else {
            zip.start_file(&rel_str, options)
                .map_err(|e| AppError::Msg(e.to_string()))?;
            let mut f = std::fs::File::open(path)?;
            let mut buf = Vec::new();
            f.read_to_end(&mut buf)?;
            zip.write_all(&buf)?;
        }
    }
    zip.finish().map_err(|e| AppError::Msg(e.to_string()))?;
    Ok(())
}

/// Unzip a Plotr backup into `dest_dir/<zip stem>/`, guarding against
/// zip-slip. Returns the created project path.
#[tauri::command]
pub async fn import_zip(zip_path: String, dest_dir: String) -> AppResult<String> {
    let file = std::fs::File::open(&zip_path)?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| AppError::Msg(e.to_string()))?;

    let stem = Path::new(&zip_path)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Imported Project".into());
    let target = Path::new(&dest_dir).join(&stem);
    if target.exists() {
        return Err(AppError::Msg(format!(
            "A folder named \"{stem}\" already exists there."
        )));
    }

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| AppError::Msg(e.to_string()))?;
        let Some(rel) = entry.enclosed_name() else {
            return Err(AppError::Msg("archive contains an unsafe path".into()));
        };
        let out = target.join(rel);
        if entry.is_dir() {
            std::fs::create_dir_all(&out)?;
        } else {
            if let Some(parent) = out.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let mut f = std::fs::File::create(&out)?;
            std::io::copy(&mut entry, &mut f)?;
        }
    }

    if !target.join("project.json").exists() {
        let _ = std::fs::remove_dir_all(&target);
        return Err(AppError::Msg(
            "That archive is not a Plotr project backup (no project.json).".into(),
        ));
    }
    Ok(target.to_string_lossy().to_string())
}

#[derive(Deserialize)]
pub struct ExportFile {
    pub rel_path: String,
    pub contents: String,
}

/// Write a tree of text files (Markdown export). The frontend renders the
/// content; Rust only performs the IO.
#[tauri::command]
pub async fn write_export_files(dest_dir: String, files: Vec<ExportFile>) -> AppResult<()> {
    let root = Path::new(&dest_dir);
    for f in files {
        let rel = Path::new(&f.rel_path);
        if rel.is_absolute()
            || rel
                .components()
                .any(|c| matches!(c, std::path::Component::ParentDir | std::path::Component::Prefix(_)))
        {
            return Err(AppError::Msg(format!("invalid export path: {}", f.rel_path)));
        }
        let out = root.join(rel);
        if let Some(parent) = out.parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(out, f.contents.as_bytes())?;
    }
    Ok(())
}
