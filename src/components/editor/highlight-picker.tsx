import type { Editor } from "@tiptap/core";
import { Ban } from "lucide-react";
import { DEFAULT_HIGHLIGHT_COLOR, HIGHLIGHT_COLORS } from "./const";

export const HighlightColorPicker = ({
  editor,
  currentColor,
  onClose,
}: {
  editor: Editor;
  currentColor: string | null;
  onClose: () => void;
}) => {
  const effectiveColor = currentColor || DEFAULT_HIGHLIGHT_COLOR;

  const handleColorClick = (color: string) => {
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!hasSelection) {
      // 如果光标不在内容内部 表示接下来输入的不要高光了
      const $to = editor.state.selection.$to;
      const isAtEnd = $to.parentOffset === $to.parent.content.size;

      if (isAtEnd && effectiveColor === color) {
        editor.chain().focus().unsetHighlight().run();
      }
      // 光标在内容内部 直接关闭popover 不做更多处理
      onClose();
      return;
    }

    if (effectiveColor === color) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
    onClose();
  };

  return (
    <div className="flex items-center gap-1.5 p-1">
      {HIGHLIGHT_COLORS.map(({ name, color }) => (
        <button
          key={name}
          type="button"
          onClick={() => handleColorClick(color)}
          className={`w-5 h-5 rounded-full border transition-all hover:scale-110 ${
            effectiveColor === color
              ? "border-gray-800 outline outline-offset-1 outline-gray-400"
              : "border-gray-300"
          }`}
          style={{ backgroundColor: color, borderRadius: "50%" }}
          title={name}
        />
      ))}
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().unsetHighlight().run();
          onClose();
        }}
        className="p-0! w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors rounded hover:bg-gray-100"
        title="取消高亮"
      >
        <Ban size={22} />
      </button>
    </div>
  );
};
