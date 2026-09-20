mod commands;
mod error;
mod fsutil;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::project::create_project,
            commands::project::load_project,
            commands::project::write_project_file,
            commands::project::delete_project_file,
            commands::project::probe_project,
            commands::project::list_project_files,
            commands::assets::import_attachment,
            commands::assets::import_attachment_bytes,
            commands::archive::export_zip,
            commands::archive::import_zip,
            commands::archive::write_export_files,
            commands::update::launch_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
