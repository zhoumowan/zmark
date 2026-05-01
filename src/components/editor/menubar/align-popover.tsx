import type { Editor } from "@tiptap/core";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MenuBarState } from "@/stores";
import { AlignPicker } from "./align-picker";
import { MenuButton } from "./menu-button";

interface AlignPopoverProps {
  editor: Editor;
  editorState: MenuBarState;
}

export const AlignPopover = ({ editor, editorState }: AlignPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const icon = useMemo(() => {
    if (editorState.isAlignCenter) return AlignCenter;
    if (editorState.isAlignRight) return AlignRight;
    if (editorState.isAlignJustify) return AlignJustify;
    return AlignLeft;
  }, [
    editorState.isAlignCenter,
    editorState.isAlignRight,
    editorState.isAlignJustify,
  ]);

  const isActive =
    editorState.isAlignLeft ||
    editorState.isAlignCenter ||
    editorState.isAlignRight ||
    editorState.isAlignJustify;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <MenuButton icon={icon} label="对齐方式" isActive={isActive} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center" side="bottom">
        <AlignPicker
          editor={editor}
          editorState={editorState}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};
