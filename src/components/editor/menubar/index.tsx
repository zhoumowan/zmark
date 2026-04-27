import type { Editor } from "@tiptap/core";
import { History, TableOfContents } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMenuBar } from "@/hooks";
import { handleImageUpload, to } from "@/utils";
import { FrontmatterPopover } from "./frontmatter-popover";
import { HeadingPopover } from "./heading-popover";
import { HighlightPopover } from "./highlight-popover";
import { LinkPopover } from "./link-popover";
import { ListPopover } from "./list-popover";
import { MathPopover } from "./math-popover";
import { MenuButton } from "./menu-button";

type MenuBarProps = {
  editor: Editor;
  isTocOpen: boolean;
  onToggleToc: () => void;
  hasHeadings: boolean;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  isInlineFrontmatterOpen: boolean;
  onToggleInlineFrontmatter: () => void;
};

export const MenuBar = ({
  editor,
  isTocOpen,
  onToggleToc,
  hasHeadings,
  isHistoryOpen,
  onToggleHistory,
  isInlineFrontmatterOpen,
  onToggleInlineFrontmatter,
}: MenuBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 菜单栏图片按钮的点击回调，通过 ref 间接点击隐藏的 input
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const [err, url] = await to(handleImageUpload(file));
      if (err) {
        const errorMessage = err.message || String(err);
        toast.error(`图片上传失败: ${errorMessage}`);
      } else if (url) {
        editor.chain().focus().setImage({ src: url }).run();
        toast.success("图片已上传");
      }
    }
    // 重置 input，方便下次选择同一张图
    event.target.value = "";
  };

  const { historyActions, textActions, insertActions, shortcuts, editorState } =
    useMenuBar(editor, handleImageButtonClick);

  return (
    <div className="w-full sticky top-2 z-10 flex justify-center">
      {/* 隐藏的文件输入框：
          1. 用于调用系统的文件选择器（浏览器安全限制必须使用原生 input）
          2. 设置为 hidden 隐藏默认样式，通过 fileInputRef.current?.click() 被间接触发
      */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="rounded-lg border border-border bg-background/95 p-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.15)] backdrop-blur-md">
        <div className="button-group">
          <TooltipProvider>
            {historyActions.map((action) => (
              <MenuButton key={action.label} {...action} />
            ))}

            <HeadingPopover editor={editor} editorState={editorState} />

            {textActions.map((action) => (
              <MenuButton key={action.label} {...action} />
            ))}

            <HighlightPopover
              editor={editor}
              editorState={editorState}
              shortcut={shortcuts.highlight}
            />

            <LinkPopover editor={editor} shortcut={shortcuts.link} />
            <MathPopover editor={editor} />

            {insertActions.map((action) => (
              <MenuButton key={action.label} {...action} />
            ))}

            <ListPopover editor={editor} editorState={editorState} />

            <MenuButton
              icon={TableOfContents}
              label={isTocOpen ? "隐藏目录" : "显示目录"}
              onClick={onToggleToc}
              isActive={isTocOpen}
              isVisible={hasHeadings}
            />

            <FrontmatterPopover
              isInlineFrontmatterOpen={isInlineFrontmatterOpen}
              onToggleInlineFrontmatter={onToggleInlineFrontmatter}
            />

            <MenuButton
              icon={History}
              label={isHistoryOpen ? "隐藏对比" : "版本对比"}
              onClick={onToggleHistory}
              isActive={isHistoryOpen}
            />
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
