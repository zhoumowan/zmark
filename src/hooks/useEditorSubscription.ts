import type { Editor } from "@tiptap/core";
import { useEffect } from "react";

type EditorEventHandler = (...args: unknown[]) => void;

type EditorEventMethod = (
  eventName: string,
  callback: EditorEventHandler,
) => void;

type EditorEventEmitter = {
  on: EditorEventMethod;
  off: EditorEventMethod;
};

export function useEditorSubscription(
  editor: Editor | null,
  event: string,
  handler: EditorEventHandler,
  enabled = true,
) {
  useEffect(() => {
    if (!editor) return;
    if (!enabled) return;

    const emitter = editor as unknown as EditorEventEmitter;

    emitter.on(event, handler);
    return () => {
      emitter.off(event, handler);
    };
  }, [editor, enabled, event, handler]);
}
