mod commands;
mod db;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            db::init_db(app.handle())?;
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::knowledge_base::create_knowledge_base,
            commands::knowledge_base::list_knowledge_bases,
            commands::knowledge_base::add_document,
            commands::knowledge_base::list_documents,
            commands::knowledge_base::delete_document,
            commands::knowledge_base::chat
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
