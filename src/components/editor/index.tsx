import "katex/dist/katex.min.css";
import "./styles/index.scss";

import { HocuspocusProvider } from "@hocuspocus/provider";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSaveShortcut, useTableOfContents } from "@/hooks";
import { useAuthStore, useCollabStore, useEditorStore } from "@/stores";
import type { EditorStorage } from "@/types/editor.ts";
import {
  addOrUpdateFile,
  handleImageUpload,
  unresolveMarkdownImages,
} from "@/utils";
import { supabase } from "@/utils/supabase-client";
import { EditorBubbleMenu } from "./bubble-menu";
import { extensions } from "./extensions";
import { EmptyEditor } from "./fallback/empty-state.tsx";
import { UnsupportedFile } from "./fallback/unsupported-file.tsx";
import { MenuBar } from "./menubar/index.tsx";
import { TableOfContents } from "./toc";
import { VersionHistory } from "./version-history";

const uint8ToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const base64ToUint8 = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export default function Editor({
  mode,
}: {
  mode?: "editor" | "kb" | "collab";
}) {
  const { content, curPath: storeCurPath, activeCollabId } = useEditorStore();
  const { files } = useCollabStore();
  const { user } = useAuthStore();

  const collabId = mode === "collab" ? activeCollabId : null;
  const curPath = mode === "editor" ? storeCurPath : "";
  const currentFile = collabId ? files.find((f) => f.id === collabId) : null;

  // 使用 useState 的懒初始化保证 ydoc 只被创建一次（避免 React StrictMode 下 useMemo 多次执行的问题）
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);

  const canUseSupabase = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );

  useEffect(() => {
    if (!collabId) return;
    const persistence = new IndexeddbPersistence(
      `zmark-collab:${collabId}`,
      ydoc,
    );
    return () => {
      persistence.destroy();
    };
  }, [collabId, ydoc]);

  useEffect(() => {
    if (!collabId || !canUseSupabase) return;

    let cancelled = false;

    const restoreFromSupabase = async () => {
      const { data, error } = await supabase
        .from("collab_documents")
        .select("y_update")
        .eq("id", collabId)
        .maybeSingle();

      if (cancelled) return;
      if (error) return;

      const yUpdate = data?.y_update;
      if (!yUpdate) return;

      try {
        Y.applyUpdate(ydoc, base64ToUint8(yUpdate));
      } catch {
        return;
      }
    };

    restoreFromSupabase();

    return () => {
      cancelled = true;
    };
  }, [collabId, canUseSupabase, ydoc]);

  useEffect(() => {
    if (!collabId || !canUseSupabase) return;

    let saveTimer: number | null = null;
    let lastSavedBase64: string | null = null;

    const flushSave = async () => {
      saveTimer = null;
      const update = Y.encodeStateAsUpdate(ydoc);
      const base64 = uint8ToBase64(update);
      if (base64 === lastSavedBase64) return;

      const { error } = await supabase
        .from("collab_documents")
        .upsert({ id: collabId, y_update: base64 });

      if (!error) {
        lastSavedBase64 = base64;
      }
    };

    const onUpdate = () => {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        flushSave();
      }, 1500);
    };

    ydoc.on("update", onUpdate);

    return () => {
      ydoc.off("update", onUpdate);
      if (saveTimer) window.clearTimeout(saveTimer);
      flushSave();
    };
  }, [collabId, canUseSupabase, ydoc]);

  // 在 useEffect 中处理副作用：建立网络连接
  useEffect(() => {
    if (!collabId) {
      setProvider(null);
      return;
    }

    const collaborationUrl =
      import.meta.env.VITE_COLLAB_URL ?? "ws://localhost:1234";

    const prov = new HocuspocusProvider({
      url: collaborationUrl,
      name: collabId, // 使用文档ID作为房间号
      document: ydoc,
      onConnect() {},
      onSynced() {},
      onDisconnect() {
        console.log("CRDT Disconnected");
      },
    });

    setProvider(prov);

    // 组件卸载或重新执行 effect 时销毁连接
    return () => {
      prov.destroy();
      setProvider(null);
    };
  }, [ydoc, collabId]); // 添加 collabId 依赖

  const [userColor] = useState(
    () =>
      `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`,
  );

  const userDisplayName = useMemo(() => {
    const email = user?.email?.trim();
    if (email) return email.split("@")[0] || email;
    return user?.user_name || user?.name || "用户";
  }, [user?.email, user?.name, user?.user_name]);

  const userInfo = useMemo(
    () => ({
      name: userDisplayName,
      color: userColor,
    }),
    [userColor, userDisplayName],
  );

  // 动态计算 extensions，确保只有 provider 准备好时才注入 CollaborationCursor
  const activeExtensions = useMemo(() => {
    const base = [...extensions];

    // 只有在开启协作模式（有 collabId）时，才注入协作相关的扩展
    if (collabId) {
      base.push(
        Collaboration.configure({
          document: ydoc,
          field: "content", // 显式指定同步的字段
        }),
      );

      if (provider) {
        base.push(
          CollaborationCursor.configure({
            provider: provider,
            user: userInfo,
          }),
        );
      }
    }

    return base;
  }, [ydoc, provider, userInfo, collabId]);

  const editor = useEditor(
    {
      extensions: activeExtensions,
      // 恢复内容初始化：非协作模式下使用 content，协作模式下由 Yjs 接管
      content: collabId ? undefined : content,
      editorProps: {
        handleDOMEvents: {
          click: (_, event) => {
            const target = event.target as HTMLElement;
            const anchor = target.closest("a");
            if (anchor) {
              const href = anchor.getAttribute("href");
              const { metaKey, ctrlKey } = event;

              if (href) {
                if (metaKey || ctrlKey) {
                  openUrl(href).catch((error) => {
                    console.error("Failed to open URL:", error);
                    toast.error("无法打开链接");
                  });
                }
                // 彻底阻止所有默认点击行为，防止浏览器或 Tiptap 扩展自动打开链接
                event.preventDefault();
                event.stopPropagation();
                return true;
              }
            }
            return false;
          },
        },
        handlePaste: (view, event) => {
          const items = Array.from(event.clipboardData?.items || []);
          const imageItem = items.find((item) =>
            item.type.startsWith("image/"),
          );

          if (imageItem) {
            event.preventDefault();
            const file = imageItem.getAsFile();
            if (file) {
              handleImageUpload(file)
                .then((url) => {
                  if (editor) {
                    editor.chain().focus().setImage({ src: url }).run();
                  } else {
                    view.dispatch(
                      view.state.tr.replaceSelectionWith(
                        view.state.schema.nodes.image.create({ src: url }),
                      ),
                    );
                  }
                  toast.success("图片已上传");
                })
                .catch((err) => {
                  console.error("Image upload failed:", err);
                  const errorMessage =
                    err instanceof Error ? err.message : String(err);
                  toast.error(`图片上传失败: ${errorMessage}`);
                });
              return true;
            }
          }
          return false;
        },
      },
    },
    [content, provider], // 关键：必须将 provider 加入依赖，否则初始 null 变有值时编辑器不会重新初始化
  );

  const handleSave = async () => {
    if (!editor) return;

    const storage = editor.storage as EditorStorage;
    const markdown = storage.markdown.getMarkdown();

    if (collabId && currentFile) {
      // 协作模式且没有关联本地文件：调用 Tauri 的另存为对话框
      try {
        const filePath = await save({
          filters: [{ name: "Markdown", extensions: ["md"] }],
          defaultPath: `${currentFile.name}.md`,
        });

        if (filePath) {
          const unresolvedMarkdown = await unresolveMarkdownImages(
            markdown,
            filePath,
          );
          await writeTextFile(filePath, unresolvedMarkdown);
          toast.success("协作文档已保存到本地");
        }
      } catch (err) {
        console.error("Save dialog failed:", err);
        toast.error("保存失败");
      }
      return;
    }

    if (curPath) {
      // 单机模式或已关联本地文件的保存逻辑
      const unresolvedMarkdown = await unresolveMarkdownImages(
        markdown,
        curPath,
      );
      await writeTextFile(curPath, unresolvedMarkdown);

      addOrUpdateFile({
        path: curPath,
        name: curPath.split("/").pop() || "Untitled",
        content: unresolvedMarkdown,
      });

      toast.success("保存成功");
    }
  };

  useSaveShortcut(handleSave);

  // 恢复正常的显示逻辑
  const showEditor = curPath || collabId;
  const isMdFile = Boolean(collabId) || curPath.endsWith(".md");
  const fileName = collabId
    ? `协作文档: ${currentFile?.name || "未知"}`
    : curPath?.split("/").pop() || curPath;
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const tocItems = useTableOfContents(editor);

  return (
    <div className="flex flex-col h-full">
      {showEditor ? (
        isMdFile ? (
          editor && (
            <>
              <EditorBubbleMenu editor={editor} />
              <MenuBar
                editor={editor}
                isTocOpen={isTocOpen}
                onToggleToc={() => setIsTocOpen(!isTocOpen)}
                hasHeadings={tocItems.length > 0}
                isHistoryOpen={isHistoryOpen}
                onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
              />
              <div className="flex flex-1 overflow-hidden relative">
                <EditorContent
                  editor={editor}
                  className="flex-1 h-full overflow-y-auto"
                />
                {isTocOpen && (
                  <TableOfContents editor={editor} items={tocItems} />
                )}
              </div>
              <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetContent
                  side="right"
                  className="w-[90vw]! max-w-[90vw]! gap-0"
                >
                  <SheetHeader>
                    <SheetTitle>版本对比</SheetTitle>
                  </SheetHeader>
                  <div className="h-full">
                    <VersionHistory
                      curPath={curPath}
                      getContent={() => {
                        const storage = editor.storage as EditorStorage;
                        return storage.markdown.getMarkdown();
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )
        ) : (
          <UnsupportedFile fileName={fileName} />
        )
      ) : (
        <EmptyEditor />
      )}
    </div>
  );
}
