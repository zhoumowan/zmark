import { Settings2 } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FrontmatterPanel } from "../frontmatter-panel";
import { MenuButton } from "./menu-button";

interface FrontmatterPopoverProps {
  isInlineFrontmatterOpen: boolean;
  onToggleInlineFrontmatter: () => void;
}

export const FrontmatterPopover = ({
  isInlineFrontmatterOpen,
  onToggleInlineFrontmatter,
}: FrontmatterPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <MenuButton icon={Settings2} label="文档属性" isActive={isOpen} />
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-4 max-h-[80vh] overflow-y-auto"
        align="end"
        side="bottom"
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <h3 className="font-semibold leading-none tracking-tight">
            文档属性
          </h3>
          <button
            type="button"
            onClick={onToggleInlineFrontmatter}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              isInlineFrontmatterOpen
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {isInlineFrontmatterOpen ? "隐藏内联显示" : "在正文中显示"}
          </button>
        </div>
        <FrontmatterPanel className="" />
      </PopoverContent>
    </Popover>
  );
};
