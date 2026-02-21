import "./index.scss";

import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MenuBar } from "./menubar.tsx";
import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor.ts";
import { defaultContent } from "./const.ts";
import { Markdown } from "tiptap-markdown";


const extensions = [TextStyleKit, StarterKit, Markdown];

export default () => {
  const content = useEditorStore((state) => state.content);
  const editor = useEditor({
    extensions,
    content: content || defaultContent,
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content || defaultContent);
    }
  }, [content, editor]);

  return (
    <>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
};
