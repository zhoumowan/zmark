import type { Editor } from "@tiptap/core";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useKeyDisplay } from "@/hooks";
import type { MenuBarState } from "@/stores";

type AlignPickerProps = {
  editor: Editor;
  editorState: MenuBarState;
  onClose: () => void;
};

export const AlignPicker = ({
  editor,
  editorState,
  onClose,
}: AlignPickerProps) => {
  const { shortcuts } = useKeyDisplay();
  const aligns = [
    {
      icon: AlignLeft,
      label: "左对齐",
      shortcut: shortcuts.alignLeft,
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
      isActive: editorState.isAlignLeft,
    },
    {
      icon: AlignCenter,
      label: "居中对齐",
      shortcut: shortcuts.alignCenter,
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
      isActive: editorState.isAlignCenter,
    },
    {
      icon: AlignRight,
      label: "右对齐",
      shortcut: shortcuts.alignRight,
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
      isActive: editorState.isAlignRight,
    },
    {
      icon: AlignJustify,
      label: "两端对齐",
      shortcut: shortcuts.alignJustify,
      onClick: () => editor.chain().focus().setTextAlign("justify").run(),
      isActive: editorState.isAlignJustify,
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1">
      {aligns.map((item) => (
        <Tooltip key={item.label} delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`flex items-center justify-center w-8 h-8 rounded hover:bg-accent hover:text-accent-foreground transition-colors ${
                item.isActive ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-2">
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-muted-foreground">
                {item.shortcut}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
