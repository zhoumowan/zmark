import type { Editor } from "@tiptap/core";
import { List, ListChecks, ListOrdered } from "lucide-react";
import type { MenuBarState } from "@/stores/editor";

type ListPickerProps = {
  editor: Editor;
  editorState: MenuBarState;
  onClose: () => void;
};

export const ListPicker = ({
  editor,
  editorState,
  onClose,
}: ListPickerProps) => {
  const lists = [
    {
      icon: List,
      label: "无序列表",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editorState.isBulletList,
    },
    {
      icon: ListOrdered,
      label: "有序列表",
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editorState.isOrderedList,
    },
    {
      icon: ListChecks,
      label: "任务列表",
      onClick: () => editor.chain().focus().toggleTaskList().run(),
      isActive: editorState.isTaskList,
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1">
      {lists.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`flex items-center justify-center w-8 h-8 rounded hover:bg-accent hover:text-accent-foreground transition-colors ${
            item.isActive ? "bg-accent text-accent-foreground" : ""
          }`}
          title={item.label}
        >
          <item.icon className="h-4 w-4 shrink-0" />
        </button>
      ))}
    </div>
  );
};
