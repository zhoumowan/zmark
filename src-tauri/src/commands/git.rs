use serde::Serialize;
use std::{
    path::{Path, PathBuf},
    process::Command,
};

#[derive(Debug, Serialize)]
pub struct GitCommit {
    pub id: String,
    pub author: String,
    pub message: String,
    pub timestamp: i64,
}

fn find_git_root(file_path: &Path) -> Option<PathBuf> {
    let start_dir = if file_path.is_dir() {
        file_path.to_path_buf()
    } else {
        file_path.parent()?.to_path_buf()
    };

    for dir in start_dir.ancestors() {
        let dot_git = dir.join(".git");
        if dot_git.exists() {
            return Some(dir.to_path_buf());
        }
    }

    None
}

fn to_git_rel_path(repo_root: &Path, file_path: &Path) -> Option<String> {
    let rel = file_path.strip_prefix(repo_root).ok()?;
    Some(rel.to_string_lossy().replace('\\', "/"))
}

fn is_valid_commit_id(commit: &str) -> bool {
    let len = commit.len();
    if len < 4 || len > 64 {
        return false;
    }
    commit.chars().all(|c| c.is_ascii_hexdigit())
}

#[tauri::command]
pub async fn git_file_history(
    path: String,
    limit: Option<u32>,
    skip: Option<u32>,
) -> std::result::Result<Vec<GitCommit>, String> {
    let file_path = PathBuf::from(path);
    let repo_root = find_git_root(&file_path).ok_or("NOT_GIT_REPO")?;
    let rel_path = to_git_rel_path(&repo_root, &file_path).ok_or("PATH_NOT_IN_REPO")?;

    let mut cmd = Command::new("git");
    cmd.arg("-C")
        .arg(&repo_root)
        .arg("log")
        .arg("--follow")
        .arg("--format=%H%x1f%an%x1f%ct%x1f%s")
        .arg(format!("-n{}", limit.unwrap_or(50)));

    if let Some(skip) = skip {
        if skip > 0 {
            cmd.arg(format!("--skip={skip}"));
        }
    }

    cmd.arg("--").arg(&rel_path);

    let output = cmd.output().map_err(|e| format!("GIT_EXEC_ERROR: {e}"))?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let commits = stdout
        .lines()
        .filter_map(|line| {
            let parts: Vec<&str> = line.split('\x1f').collect();
            if parts.len() != 4 {
                return None;
            }

            let timestamp = parts[2].parse::<i64>().ok()?;

            Some(GitCommit {
                id: parts[0].to_string(),
                author: parts[1].to_string(),
                timestamp,
                message: parts[3].to_string(),
            })
        })
        .collect::<Vec<_>>();

    Ok(commits)
}

#[tauri::command]
pub async fn git_file_content(
    path: String,
    commit: String,
) -> std::result::Result<String, String> {
    if !is_valid_commit_id(&commit) {
        return Err("INVALID_COMMIT".to_string());
    }

    let file_path = PathBuf::from(path);
    let repo_root = find_git_root(&file_path).ok_or("NOT_GIT_REPO")?;
    let rel_path = to_git_rel_path(&repo_root, &file_path).ok_or("PATH_NOT_IN_REPO")?;

    let spec = format!("{commit}:{rel_path}");
    let output = Command::new("git")
        .arg("-C")
        .arg(&repo_root)
        .arg("show")
        .arg(spec)
        .output()
        .map_err(|e| format!("GIT_EXEC_ERROR: {e}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

