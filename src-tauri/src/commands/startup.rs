#[tauri::command]
pub fn get_app_startup_args() -> Vec<String> {
    std::env::args().collect()
}
