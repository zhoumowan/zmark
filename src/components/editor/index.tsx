import "katex/dist/katex.min.css";
import "./styles/index.scss";

import { writeTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { EditorContent, useEditor } from "@tiptap/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveShortcut, useTableOfContents } from "@/hooks";
import { useEditorStore } from "@/stores";
import type { EditorStorage } from "@/types/editor.ts";
import { addOrUpdateFile, handleImageUpload } from "@/utils";
import { extensions } from "./extensions";
import { EmptyEditor } from "./fallback/empty-state.tsx";
import { UnsupportedFile } from "./fallback/unsupported-file.tsx";
import { MenuBar } from "./menubar/index.tsx";
import { TableOfContents } from "./toc";

export default () => {
  const { content, curPath } = useEditorStore();
  const editor = useEditor(
    {
      extensions,
      content: content,
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
                  console.log("Image uploaded to:", url);
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
    [content],
  );

  const handleSave = () => {
    if (curPath && editor) {
      const storage = editor.storage as EditorStorage;
      const markdown = storage.markdown.getMarkdown();
      writeTextFile(curPath, markdown);

      addOrUpdateFile({
        path: curPath,
        name: curPath.split("/").pop() || "Untitled",
        content: markdown,
      });

      toast.success("保存成功");
    }
  };

  useSaveShortcut(handleSave);

  const showEditor = curPath;
  const isMdFile = curPath.endsWith(".md");
  const fileName = curPath.split("/").pop() || curPath;
  const [isTocOpen, setIsTocOpen] = useState(true);

  const tocItems = useTableOfContents(editor);

  return (
    <div className="flex flex-col h-full">
      {showEditor ? (
        isMdFile ? (
          editor && (
            <>
              <MenuBar
                editor={editor}
                isTocOpen={isTocOpen}
                onToggleToc={() => setIsTocOpen(!isTocOpen)}
                hasHeadings={tocItems.length > 0}
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
