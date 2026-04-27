import type { Editor } from "@tiptap/core";
import { List, ListChecks, ListOrdered, ListTree } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MenuBarState } from "@/stores";
import { ListPicker } from "./list-picker";
import { MenuButton } from "./menu-button";

interface ListPopoverProps {
  editor: Editor;
  editorState: MenuBarState;
}

export const ListPopover = ({ editor, editorState }: ListPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const icon = useMemo(() => {
    if (editorState.isOrderedList) return ListOrdered;
    if (editorState.isTaskList) return ListChecks;
    if (editorState.isBulletList) return List;
    return ListTree;
  }, [
    editorState.isBulletList,
    editorState.isOrderedList,
    editorState.isTaskList,
  ]);

  const isActive =
    editorState.isBulletList ||
    editorState.isOrderedList ||
    editorState.isTaskList;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <MenuButton icon={icon} label="列表" isActive={isActive} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center" side="bottom">
        <ListPicker
          editor={editor}
          editorState={editorState}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};
