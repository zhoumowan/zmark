use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

#[derive(serde::Serialize)]
pub struct UpdateCheckResult {
    pub available: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub release_notes: Option<String>,
}

#[tauri::command]
pub async fn check_for_update(app: AppHandle) -> Result<UpdateCheckResult, String> {
    let current_version = app.package_info().version.to_string();

    let updater = app.updater().map_err(|e| format!("获取更新器失败: {}", e))?;
    
    match updater.check().await {
        Ok(Some(update)) => {
            Ok(UpdateCheckResult {
                available: true,
                current_version,
                latest_version: Some(update.version),
                release_notes: update.body,
            })
        }
        Ok(None) => {
            Ok(UpdateCheckResult {
                available: false,
                current_version,
                latest_version: None,
                release_notes: None,
            })
        }
        Err(e) => {
            Err(format!("检查更新失败: {}", e))
        }
    }
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| format!("获取更新器失败: {}", e))?;
    
    match updater.check().await {
        Ok(Some(update)) => {
            update.download_and_install(|_, _| {}, || {}).await.map_err(|e| {
                format!("安装更新失败: {}", e)
            })?;
            Ok(())
        }
        Ok(None) => {
            Err("没有可用的更新".to_string())
        }
        Err(e) => {
            Err(format!("更新检查失败: {}", e))
        }
    }
}
