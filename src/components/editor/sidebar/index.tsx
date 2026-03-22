import { BaseDirectory, watch } from "@tauri-apps/plugin-fs";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
} from "@/utils";
import { ActionButtons } from "./action-buttons";
import { InputDialog } from "./input-dialog";
import { Tree } from "./tree";

interface ISidebarProps extends React.ComponentProps<typeof Sidebar> {
  mode: "editor" | "kb";
}

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppSidebar({ mode, ...props }: ISidebarProps) {
  const [fileTree, setFileTree] = useState<TreeItem[]>([]);
  const [basePath, setBasePath] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    onConfirm: (value: string) => void;
  } | null>(null);

  // 新增：协作房间弹窗状态
  const [collabDialogOpen, setCollabDialogOpen] = useState(false);

  const unwatchRef = useRef<(() => void) | null>(null);

  const { setPreviewPath, previewPath, setRoomName, roomName } =
    useEditorStore();

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
      try {
        const unwatch = await watch(
          "markdowns",
          () => {
            refreshFileTree();
          },
          {
            baseDir: BaseDirectory.Document,
            recursive: true,
            delayMs: 100,
          },
        );
        unwatchRef.current = unwatch;
      } catch (error) {
        console.error("Failed to setup file watcher:", error);
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

  const handleJoinCollab = () => {
    setCollabDialogOpen(true);
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
                refreshFileTree={refreshFileTree}
              />
            </div>

            {/* 协作入口按钮 */}
            <div className="px-3 py-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-primary"
                onClick={handleJoinCollab}
              >
                <Users className="w-4 h-4 mr-2" />
                {roomName ? `当前房间: ${roomName}` : "发起/加入协作"}
              </Button>
              {roomName && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-500 hover:text-red-600 mt-1"
                  onClick={() => setRoomName(null)}
                >
                  退出当前协作
                </Button>
              )}
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
      <InputDialog
        open={collabDialogOpen}
        onClose={() => setCollabDialogOpen(false)}
        onConfirm={(name) => {
          if (name) {
            setRoomName(name);
          }
        }}
        title="输入协作房间名称 (自动创建或加入)"
        placeholder="例如: project-a-docs"
      />
    </Sidebar>
  );
}
