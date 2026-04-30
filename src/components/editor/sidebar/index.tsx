import { open } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, watch } from "@tauri-apps/plugin-fs";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { CollapseProvider } from "@/providers/collapse-provider";
import { useEditorStore } from "@/stores";
import type { TreeItem } from "@/types/editor";
import {
  createDirectory,
  createFile,
  getDataDir,
  getFileTree,
  getTreeKey,
  importDirectory,
  importFiles,
  logError,
  to,
} from "@/utils";
import { ActionButtons } from "./action-buttons";
import { InputDialog } from "./input-dialog";
import { Tree } from "./tree";

interface ISidebarProps extends React.ComponentProps<typeof Sidebar> {
  mode: "editor" | "kb" | "graph";
}

export function AppSidebar({ mode, ...props }: ISidebarProps) {
  const [fileTree, setFileTree] = useState<TreeItem[]>([]);
  const [basePath, setBasePath] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    onConfirm: (value: string) => void;
  } | null>(null);

  const unwatchRef = useRef<(() => void) | null>(null);

  const { setPreviewPath, previewPath } = useEditorStore();

  const refreshFileTree = useCallback(async () => {
    const files = await getFileTree();
    setFileTree(files);
  }, []);

  useEffect(() => {
    const fetchMdFiles = async () => {
      const files = await getFileTree();
      const dataDir = await getDataDir();
      setBasePath(dataDir);
      setFileTree(files);
    };
    fetchMdFiles();
  }, []);

  useEffect(() => {
    const setupWatcher = async () => {
      const [err, unwatch] = await to(
        watch(
          "markdowns",
          () => {
            refreshFileTree();
          },
          {
            baseDir: BaseDirectory.Document,
            recursive: true,
            delayMs: 100,
          },
        ),
      );

      if (err) {
        logError("Failed to setup file watcher:", err);
      } else if (unwatch) {
        unwatchRef.current = unwatch;
      }
    };

    setupWatcher();

    return () => {
      if (unwatchRef.current) {
        unwatchRef.current();
        unwatchRef.current = null;
      }
    };
  }, [refreshFileTree]);

  const handleCreateFile = () => {
    setDialogConfig({
      title: "创建新文件",
      onConfirm: async (fileName) => {
        if (fileName) {
          const finalFileName = fileName.endsWith(".md")
            ? fileName
            : `${fileName}.md`;
          await createFile(finalFileName, previewPath);
          await refreshFileTree();
        }
      },
    });
    setDialogOpen(true);
  };

  const handleCreateDirectory = () => {
    setDialogConfig({
      title: "创建新文件夹",
      onConfirm: async (dirName) => {
        if (dirName) {
          await createDirectory(dirName, previewPath);
          await refreshFileTree();
        }
      },
    });
    setDialogOpen(true);
  };

  const handleImportFiles = async () => {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Markdown Files",
          extensions: ["md", "zmark"],
        },
      ],
    });

    if (selected && selected.length > 0) {
      const filePaths = Array.isArray(selected) ? selected : [selected];
      const [err] = await to(importFiles(filePaths, previewPath));
      if (err) {
        logError("Failed to import files:", err);
        toast.error("导入文件失败");
      } else {
        toast.success("导入文件成功");
        await refreshFileTree();
      }
    }
  };

  const handleImportDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (selected && typeof selected === "string") {
      const [err] = await to(importDirectory(selected, previewPath));
      if (err) {
        logError("Failed to import directory:", err);
        toast.error("导入文件夹失败");
      } else {
        toast.success("导入文件夹成功");
        await refreshFileTree();
      }
    }
  };

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      const dataDir = await getDataDir();
      setPreviewPath(dataDir);
    }
  };

  return (
    <Sidebar
      variant="floating"
      className="border-border bg-background"
      {...props}
    >
      <SidebarContent className="flex flex-col">
        <CollapseProvider>
          <SidebarGroup className="space-y-1 flex-1" onClick={handleClick}>
            <div className="flex items-center justify-between px-3">
              <span className="font-medium text-sm">文件</span>
              <ActionButtons
                handleCreateFile={handleCreateFile}
                handleCreateDirectory={handleCreateDirectory}
                handleImportFiles={handleImportFiles}
                handleImportDirectory={handleImportDirectory}
                refreshFileTree={refreshFileTree}
              />
            </div>

            <SidebarMenu className="px-1">
              {fileTree.map((item) => (
                <Tree
                  key={getTreeKey(item)}
                  item={item}
                  basePath={basePath}
                  onRefresh={refreshFileTree}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </CollapseProvider>
      </SidebarContent>
      {dialogConfig && (
        <InputDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={dialogConfig.onConfirm}
          title={dialogConfig.title}
        />
      )}
    </Sidebar>
  );
}
