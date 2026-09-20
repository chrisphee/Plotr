use crate::error::{AppError, AppResult};
use crate::fsutil::{atomic_write, resolve_in_project, sanitize_name};
use serde::Serialize;
use std::path::Path;
use tauri::Manager;

#[derive(Serialize)]
pub struct ProjectBundle {
    /// Absolute path of the project folder.
    pub project_path: String,
    /// Raw JSON contents; the frontend owns parsing + schema migration.
    pub project: String,
    pub tree: String,
    pub trash: String,
    pub notes: Vec<String>,
    pub boards: Vec<String>,
}

fn read_json_files(dir: &Path) -> AppResult<Vec<String>> {
    let mut out = Vec::new();
    if !dir.exists() {
        return Ok(out);
    }
    let mut entries: Vec<_> = std::fs::read_dir(dir)?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|e| e == "json"))
        .collect();
    entries.sort();
    for path in entries {
        out.push(std::fs::read_to_string(&path)?);
    }
    Ok(out)
}

/// Create `<name>.plotr` inside `parent_dir`, writing the initial files.
#[tauri::command]
pub async fn create_project(
    parent_dir: String,
    name: String,
    project_json: String,
    tree_json: String,
) -> AppResult<String> {
    let folder_name = format!("{}.plotr", sanitize_name(&name));
    let root = Path::new(&parent_dir).join(&folder_name);
    if root.exists() {
        return Err(AppError::Msg(format!(
            "A project folder named \"{folder_name}\" already exists here."
        )));
    }
    std::fs::create_dir_all(root.join("notes"))?;
    std::fs::create_dir_all(root.join("boards"))?;
    std::fs::create_dir_all(root.join("assets"))?;
    atomic_write(&root.join("project.json"), project_json.as_bytes())?;
    atomic_write(&root.join("tree.json"), tree_json.as_bytes())?;
    atomic_write(
        &root.join("trash.json"),
        b"{\n  \"schemaVersion\": 1,\n  \"entries\": []\n}\n",
    )?;
    Ok(root.to_string_lossy().to_string())
}

/// Read every JSON file of a project into one payload and allow the asset
/// protocol to serve files from the project folder (cover images, inline images).
#[tauri::command]
pub async fn load_project(app: tauri::AppHandle, project_path: String) -> AppResult<ProjectBundle> {
    let root = Path::new(&project_path);
    let project_file = root.join("project.json");
    if !project_file.exists() {
        return Err(AppError::Msg(
            "This folder is not a Plotr project (project.json missing).".into(),
        ));
    }
    let project = std::fs::read_to_string(&project_file)?;
    let tree = std::fs::read_to_string(root.join("tree.json"))?;
    let trash = std::fs::read_to_string(root.join("trash.json"))
        .unwrap_or_else(|_| "{\"schemaVersion\":1,\"entries\":[]}".to_string());
    let notes = read_json_files(&root.join("notes"))?;
    let boards = read_json_files(&root.join("boards"))?;

    let scope = app.asset_protocol_scope();
    let _ = scope.allow_directory(root, true);

    Ok(ProjectBundle {
        project_path: root.to_string_lossy().to_string(),
        project,
        tree,
        trash,
        notes,
        boards,
    })
}

/// The only save primitive: atomically write one JSON file inside a project.
#[tauri::command]
pub async fn write_project_file(
    project_path: String,
    rel_path: String,
    contents: String,
) -> AppResult<()> {
    let path = resolve_in_project(&project_path, &rel_path)?;
    atomic_write(&path, contents.as_bytes())
}

#[tauri::command]
pub async fn delete_project_file(project_path: String, rel_path: String) -> AppResult<()> {
    let path = resolve_in_project(&project_path, &rel_path)?;
    if path.exists() {
        std::fs::remove_file(&path)?;
    }
    Ok(())
}

/// Quick validity check used by Open Project and the recents list.
#[tauri::command]
pub async fn probe_project(project_path: String) -> AppResult<bool> {
    Ok(Path::new(&project_path).join("project.json").exists())
}

/// File names inside one project subfolder ("notes", "boards" or "assets").
/// Used by Empty Trash garbage collection.
#[tauri::command]
pub async fn list_project_files(project_path: String, subdir: String) -> AppResult<Vec<String>> {
    if !matches!(subdir.as_str(), "notes" | "boards" | "assets") {
        return Err(crate::error::AppError::Msg(format!("invalid subdir: {subdir}")));
    }
    let dir = Path::new(&project_path).join(&subdir);
    let mut out = Vec::new();
    if dir.exists() {
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            if entry.file_type()?.is_file() {
                out.push(entry.file_name().to_string_lossy().to_string());
            }
        }
    }
    Ok(out)
}
