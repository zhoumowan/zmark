import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  getHistoryActions,
  getInsertActions,
  getListActions,
  getTextActions,
} from "@/components/editor/menubar/actions";
import { useColorHighlight, useKeyDisplay } from "@/hooks";
import { menuBarStateSelector } from "@/stores";

export const useMenuBar = (editor: Editor, onImageUpload?: () => void) => {
  const { shortcuts } = useKeyDisplay();

  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  });

  useColorHighlight(editor);

  const actionParams = {
    editor,
    editorState,
    onImageUpload,
    shortcuts,
  };

  return {
    historyActions: getHistoryActions(actionParams),
    textActions: getTextActions(actionParams),
    listActions: getListActions(actionParams),
    insertActions: getInsertActions(actionParams),
    shortcuts,
    editorState,
  };
};
