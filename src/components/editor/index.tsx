import "katex/dist/katex.min.css";
import "./styles/index.scss";

import { EditorContent, useEditor } from "@tiptap/react";
import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useCollaboration,
  useEditorEvents,
  useEditorExtensions,
  useEditorSave,
  useSaveShortcut,
  useTableOfContents,
} from "@/hooks";
import { useAuthStore, useCollabStore, useEditorStore } from "@/stores";
import type { EditorStorage } from "@/types/editor";
import { EditorBubbleMenu } from "./bubble-menu";
import { EmptyEditor } from "./fallback/empty-state.tsx";
import { UnsupportedFile } from "./fallback/unsupported-file.tsx";
import { FrontmatterPanel } from "./frontmatter-panel";
import { MenuBar } from "./menubar/index.tsx";
import { TableOfContents } from "./toc";
import { VersionHistory } from "./version-history";

export default function Editor({
  mode,
}: {
  mode?: "editor" | "kb" | "collab" | "graph";
}) {
  const { content, curPath: storeCurPath, activeCollabId } = useEditorStore();
  const { files } = useCollabStore();
  const { user } = useAuthStore();

  const collabId = mode === "collab" ? activeCollabId : null;
  const curPath = mode === "editor" ? storeCurPath : "";
  const currentFile = collabId ? files.find((f) => f.id === collabId) : null;

  const { ydoc, provider } = useCollaboration(collabId);

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

  // 使用自定义 hook 获取 extensions
  performance.mark("extensions-init-start");
  const activeExtensions = useEditorExtensions({
    collabId,
    ydoc,
    provider,
    userInfo,
  });
  performance.mark("extensions-init-end");

  const { click, paste } = useEditorEvents();

  performance.mark("editor-hook-start");
  const editor = useEditor(
    {
      extensions: activeExtensions,
      // 恢复内容初始化：非协作模式下使用 content，协作模式下由 Yjs 接管
      content: collabId ? undefined : content,
      // 【核心性能优化】：禁用自动聚焦，避免初始挂载时 Tiptap 触发全量 DOM 选择计算
      autofocus: false,
      // 【核心性能优化】：后台模式时不渲染可编辑区域，减小 ProseMirror 树构建压力
      editable: mode !== "graph",
      editorProps: {
        handleDOMEvents: {
          click,
        },
        handlePaste: paste,
      },
      onCreate: () => {
        performance.mark("editor-ready");
        try {
          performance.measure("tti", "app-init", "editor-ready");
          const tti = performance.getEntriesByName("tti").pop();
          if (tti) {
            const msg = `[Performance] TTI (Time to Interactive): ${tti.duration.toFixed(2)} ms`;
            console.log(
              `%c${msg}`,
              "color: #4CAF50; font-weight: bold; font-size: 14px;",
            );
            window.__perf_tti = tti.duration;
          }

          // Measure sub-phases
          const marks = performance.getEntriesByType("mark");
          // Deduplicate marks (Vite hot-reloading can cause duplicates)
          const uniqueMarks = Array.from(new Set(marks.map((m) => m.name))).map(
            (name) => marks.find((m) => m.name === name),
          );

          console.log("[Performance] Sub-phases:");
          uniqueMarks.forEach((m) => {
            if (m?.name !== "app-init" && m?.name !== "editor-ready") {
              try {
                performance.measure(
                  `phase_${m?.name || ""}`,
                  "app-init",
                  m?.name,
                );
                const phase = performance
                  .getEntriesByName(`phase_${m?.name || ""}`)
                  .pop();
                console.log(
                  `  - to ${m?.name || ""}: ${phase?.duration.toFixed(2)} ms`,
                );
              } catch (_e) {}
            }
          });
        } catch (_e) {
          // ignore if app-init not found
        }
      },
    },
    [content, provider], // 关键：必须将 provider 加入依赖，否则初始 null 变有值时编辑器不会重新初始化
  );

  const handleSave = useEditorSave({
    editor,
    collabId,
    currentFile,
    curPath,
  });

  useSaveShortcut(handleSave);

  // 恢复正常的显示逻辑
  const showEditor = curPath || collabId;
  const isMdFile =
    Boolean(collabId) || curPath.endsWith(".md") || curPath.endsWith(".zmark");
  const fileName = collabId
    ? `协作文档: ${currentFile?.name || "未知"}`
    : curPath?.split("/").pop() || curPath;
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInlineFrontmatterOpen, setIsInlineFrontmatterOpen] = useState(false);

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
                isInlineFrontmatterOpen={isInlineFrontmatterOpen}
                onToggleInlineFrontmatter={() =>
                  setIsInlineFrontmatterOpen(!isInlineFrontmatterOpen)
                }
              />
              <div className="flex flex-1 overflow-hidden relative">
                <div className="flex-1 h-full overflow-y-auto no-scrollbar">
                  <div className="max-w-[800px] mx-auto">
                    {isInlineFrontmatterOpen && (
                      <div className="pt-8 px-6 sm:px-12">
                        <FrontmatterPanel />
                      </div>
                    )}
                    <div
                      className={
                        isInlineFrontmatterOpen
                          ? "px-0 sm:px-6"
                          : "pt-8 px-0 sm:px-6"
                      }
                    >
                      <EditorContent editor={editor} />
                    </div>
                  </div>
                </div>
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
