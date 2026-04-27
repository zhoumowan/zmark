import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";
import { useEditorSubscription } from "./useEditorSubscription";
import { useGlobalShortcut } from "./useGlobalShortcut";

export function useLinkPopover(editor: Editor | null) {
  const [url, setUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const updateUrl = useCallback(() => {
    if (!editor) return;
    const { href } = editor.getAttributes("link");
    setUrl(href || "");
  }, [editor]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  useEditorSubscription(editor, "selectionUpdate", updateUrl);

  const setLink = useCallback(
    (linkUrl: string) => {
      if (!linkUrl || !editor) return;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setIsOpen(false);
    },
    [editor],
  );

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setUrl("");
    setIsOpen(false);
  }, [editor]);

  const toggleLink = useCallback(() => {
    if (!editor) return;
    setIsOpen((prev) => !prev);
  }, [editor]);

  useGlobalShortcut({
    key: "k",
    onTrigger: toggleLink,
    requireMod: true,
    enabled: Boolean(editor),
  });

  return {
    url,
    setUrl,
    setLink,
    removeLink,
    toggleLink,
    isOpen,
    setIsOpen,
  };
}
