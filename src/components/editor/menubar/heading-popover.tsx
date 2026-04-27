import type { Editor } from "@tiptap/core";
import {
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MenuBarState } from "@/stores";
import { HeadingPicker } from "./heading-picker";
import { MenuButton } from "./menu-button";

interface HeadingPopoverProps {
  editor: Editor;
  editorState: MenuBarState;
}

export const HeadingPopover = ({
  editor,
  editorState,
}: HeadingPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const icon = useMemo(() => {
    if (editorState.isHeading1) return Heading1;
    if (editorState.isHeading2) return Heading2;
    if (editorState.isHeading3) return Heading3;
    if (editorState.isHeading4) return Heading4;
    if (editorState.isHeading5) return Heading5;
    if (editorState.isHeading6) return Heading6;
    return Heading;
  }, [
    editorState.isHeading1,
    editorState.isHeading2,
    editorState.isHeading3,
    editorState.isHeading4,
    editorState.isHeading5,
    editorState.isHeading6,
  ]);

  const isActive =
    editorState.isHeading1 ||
    editorState.isHeading2 ||
    editorState.isHeading3 ||
    editorState.isHeading4 ||
    editorState.isHeading5 ||
    editorState.isHeading6;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <MenuButton icon={icon} label="标题" isActive={isActive} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center" side="bottom">
        <HeadingPicker
          editor={editor}
          editorState={editorState}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};
