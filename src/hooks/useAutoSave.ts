import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/stores";

export function useAutoSave(
  editor: Editor | null,
  handleSave: (isAutoSave: boolean) => Promise<void> | void,
  delay = 800,
) {
  const saveTimeoutRef = useRef<number | null>(null);
  const frontmatter = useEditorStore((state) => state.frontmatter);
  const isFirstRender = useRef(true);
  const handleSaveRef = useRef(handleSave);

  // 保持 handleSave 最新，避免在 useEffect 中频繁触发
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const triggerSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      handleSaveRef.current(true);
    }, delay);
  }, [delay]);

  // 监听编辑器内容变化
  useEffect(() => {
    if (!editor) return;

    const onUpdate = () => {
      triggerSave();
    };

    editor.on("update", onUpdate);

    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, triggerSave]);

  // 监听 frontmatter 变化
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    frontmatter; // Reference it so the linter knows it's used
    triggerSave();
  }, [frontmatter, triggerSave]);
}
