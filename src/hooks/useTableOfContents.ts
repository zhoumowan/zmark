import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";
import { useEditorSubscription } from "./useEditorSubscription";

export type TocItem = {
  id: string;
  text: string;
  level: number;
  pos: number;
  indent?: number;
};

export const useTableOfContents = (editor: Editor | null) => {
  const [items, setItems] = useState<TocItem[]>([]);

  const updateToc = useCallback(() => {
    if (!editor) return;

    const headings: TocItem[] = [];
    const { doc } = editor.state;

    doc.descendants((node, pos) => {
      if (node.type.name !== "heading") return;
      if (node.textContent.trim().length === 0) return;

      headings.push({
        id: `heading-${pos}`,
        text: node.textContent,
        level: node.attrs.level,
        pos,
      });
    });

    const minLevel = headings.reduce(
      (min, item) => Math.min(min, item.level),
      6,
    );

    setItems(
      headings.map((item) => ({
        ...item,
        indent: item.level - minLevel,
      })),
    );
  }, [editor]);

  useEffect(() => {
    updateToc();
  }, [updateToc]);

  useEditorSubscription(editor, "update", updateToc);

  return items;
};
