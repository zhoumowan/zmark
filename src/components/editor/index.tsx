import "katex/dist/katex.min.css";
import "./styles/index.scss";

import { writeTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { WebrtcProvider } from "y-webrtc";
import type * as Y from "yjs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSaveShortcut, useTableOfContents } from "@/hooks";
import { useCollaborationStore, useEditorStore } from "@/stores";
import type { EditorStorage } from "@/types/editor.ts";
import {
  addOrUpdateFile,
  collabManager,
  handleImageUpload,
  unresolveMarkdownImages,
} from "@/utils";
import { EditorBubbleMenu } from "./bubble-menu";
import { getExtensions } from "./extensions";
import { EmptyEditor } from "./fallback/empty-state.tsx";
import { UnsupportedFile } from "./fallback/unsupported-file.tsx";
import { MenuBar } from "./menubar/index.tsx";
import { TableOfContents } from "./toc";
import { VersionHistory } from "./version-history";

const EditorCore = ({
  roomName,
  userName,
  userColor,
  initialContent,
}: {
  roomName: string | null;
  userName: string;
  userColor: string;
  initialContent: string;
}) => {
  const { content, curPath } = useEditorStore();

  const [collab, setCollab] = useState<{
    yDoc: Y.Doc | null;
    provider: WebrtcProvider | null;
  }>({
    yDoc: null,
    provider: null,
  });

  useEffect(() => {
    if (!roomName) {
      setCollab({ yDoc: null, provider: null });
      return;
    }

    const { doc, provider } = collabManager.getRoom(roomName);

    setCollab({ yDoc: doc, provider });

    return () => {
      collabManager.releaseRoom(roomName);
    };
  }, [roomName]);

  const { yDoc, provider } = collab;

  const editorExtensions = useMemo(() => {
    return getExtensions({
      yDoc,
      provider,
      userName,
      userColor,
    });
  }, [yDoc, provider, userName, userColor]);

  const editor = useEditor(
    {
      extensions: editorExtensions,
      // Pass initialContent even in collab mode!
      // Tiptap's Collaboration extension is smart enough to:
      // 1. If Y.Doc is empty -> it writes `content` into Y.Doc
      // 2. If Y.Doc has data -> it ignores `content` and uses Y.Doc
      content: initialContent,
      onUpdate: () => {
        // Optional: you can sync back to store here if needed,
        // but currently we rely on handleSave to pull the latest markdown.
      },
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
    // Remove dependencies to prevent Tiptap from trying to dynamically reconfigure collaboration extensions
    // React's `key` on the parent component will force a clean re-mount when switching modes.
    [],
  );

  // Sync content if it changes externally (e.g. async file read finishes after component mounts)
  useEffect(() => {
    // Only apply external content changes if we are NOT in collab mode.
    // In collab mode, Yjs handles all content sync.
    if (editor && !roomName && content !== undefined) {
      const storage = editor.storage as EditorStorage;
      // If the content from the store differs from what the editor initially loaded, update it.
      // We use `initialContent` to track what we started with. If `content` in the store updates
      // (because the async read finished), we inject it.
      // This prevents the bug where opening a new file leaves the editor blank or with the previous file's content.
      if (content !== storage.markdown.getMarkdown()) {
        // preserve history and selection if possible, though for a new file load it doesn't matter much
        editor.commands.setContent(content);
      }
    }
  }, [content, editor, roomName]);

  const handleSave = async () => {
    if (curPath && editor) {
      const storage = editor.storage as EditorStorage;
      const markdown = storage.markdown.getMarkdown();

      // 将图片路径转换为相对路径后再保存
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

  const showEditor = curPath;
  const isMdFile = curPath.endsWith(".md");
  const fileName = curPath.split("/").pop() || curPath;
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const tocItems = useTableOfContents(editor);

  // When roomName is present but collab state is not yet initialized, render nothing
  // to avoid rendering a local editor briefly before the collab editor mounts.
  if (roomName && !yDoc) {
    return null;
  }

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
                provider={provider}
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
};

export default () => {
  const { curPath, content } = useEditorStore();
  const { roomName, userName, userColor } = useCollaborationStore();

  // Use a unique key combining curPath and roomName to completely destroy and recreate
  // the editor instance when switching between documents or entering/leaving a collab room.
  // We don't include content in the key because typing would cause remounting.
  // But we need to handle the initial content load for a new file.
  // Tiptap's initialContent is only set on mount.
  // By using curPath in the key, when we switch files, curPath changes, the component remounts,
  // and it picks up the current `content` from the store.

  // To fix the issue where switching to a file that hasn't finished reading its content yet
  // loads an empty state into Tiptap, we can delay rendering the EditorCore until
  // the content state matches the file being opened, or we can use an effect inside EditorCore
  // to sync the content if it's vastly different.
  // Actually, in the local file system, reading is async. The curPath updates immediately,
  // but content might take a split second.
  // So we pass content to EditorCore and let it sync on the first few renders.
  const editorKey = `${curPath}-${roomName || "local"}`;

  return (
    <EditorCore
      key={editorKey}
      roomName={roomName}
      userName={userName}
      userColor={userColor}
      initialContent={content}
    />
  );
};
