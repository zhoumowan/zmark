import type { Editor } from "@tiptap/core";
import { Highlighter } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MenuBarState } from "@/stores";
import { HighlightColorPicker } from "./highlight-picker";
import { MenuButton } from "./menu-button";

interface HighlightPopoverProps {
  editor: Editor;
  editorState: MenuBarState;
  shortcut?: string;
}

export const HighlightPopover = ({
  editor,
  editorState,
  shortcut,
}: HighlightPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <MenuButton
          icon={Highlighter}
          label="高亮"
          shortcut={shortcut}
          disabled={!editorState.canHighlight}
          isActive={editorState.isHighlight}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="bottom">
        <HighlightColorPicker
          editor={editor}
          currentColor={editorState.currentHighlightColor}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};
