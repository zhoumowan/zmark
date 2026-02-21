import { TreeItem } from "@/components/tree";
import { BaseDirectory, documentDir, join } from "@tauri-apps/api/path";
import { DirEntry, exists, mkdir, readDir } from "@tauri-apps/plugin-fs";

/**
 * 获取数据目录路径
 */
export async function getDataDir() {
  // 尝试创建 markdowns 目录，如果已存在则忽略错误
  try {
    await mkdir("markdowns", {
      baseDir: BaseDirectory.Document,
      recursive: true,
    });
  } catch (_error) {
    // 如果目录已存在，忽略错误
    console.error("error", _error);
  }
  // 无论是否创建成功，都返回完整的路径
  return join(await documentDir(), "markdowns");
}

async function buildFileTree(dirPath: string) {
  const entries = await readDir(dirPath);
  const fileTree = [];

  for (const entry of entries) {
    if (entry.isFile) {
      fileTree.push(entry.name);
    } else if (entry.isDirectory) {
      const subTree = await buildFileTree(await join(dirPath, entry.name));
      fileTree.push([entry.name, ...subTree]);
    }
  }

  return fileTree;
}

export async function getFileTree() {
  const dataDir = await getDataDir();
  return await buildFileTree(dataDir);
}

export function getTreeKey(item: TreeItem) {
  return typeof item === "string" ? item : String(item[0]);
}
