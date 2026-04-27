import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";
import { useEditorSubscription } from "./useEditorSubscription";

export function useMathPopover(editor: Editor) {
  const [latex, setLatex] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const updateState = useCallback(() => {
    if (!editor) return;

    if (editor.isActive("inlineMath")) {
      const { latex } = editor.getAttributes("inlineMath");
      setLatex(latex || "");
      return;
    }

    if (editor.isActive("blockMath")) {
      const { latex } = editor.getAttributes("blockMath");
      setLatex(latex || "");
      return;
    }

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    setLatex(text);
  }, [editor]);

  useEffect(() => {
    updateState();
  }, [updateState]);

  useEditorSubscription(editor, "selectionUpdate", updateState);
  useEditorSubscription(editor, "transaction", updateState);

  const setMath = useCallback(
    (latexInput: string) => {
      if (!editor) return;

      if (editor.isActive("inlineMath")) {
        editor
          .chain()
          .focus()
          .updateAttributes("inlineMath", { latex: latexInput })
          .run();
      } else if (editor.isActive("blockMath")) {
        editor
          .chain()
          .focus()
          .updateAttributes("blockMath", { latex: latexInput })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "inlineMath",
            attrs: { latex: latexInput },
          })
          .run();
      }
      setIsOpen(false);
    },
    [editor],
  );

  return {
    latex,
    setMath,
    isOpen,
    setIsOpen,
  };
}
