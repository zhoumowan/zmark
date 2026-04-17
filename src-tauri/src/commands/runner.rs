use std::process::Command;

#[tauri::command]
pub async fn run_python(code: String) -> Result<String, String> {
    let output = Command::new("python")
        .arg("-c")
        .arg(&code)
        .output()
        .map_err(|e| format!("Failed to execute python: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}