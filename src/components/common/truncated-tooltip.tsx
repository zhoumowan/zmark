import { useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TreeItem } from "@/types/editor";
import { cn } from "@/utils";

export const TruncatedTooltip = ({
  content,
  className,
  side,
  sideOffset = 4,
}: {
  content: TreeItem;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const textContent =
    typeof content === "string" ? content : (content[0] as string);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      const element = ref.current;
      if (element && element.scrollWidth > element.clientWidth) {
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  };

  const span = (
    <span ref={ref} className={cn("block w-full truncate", className)}>
      {textContent}
    </span>
  );

  return (
    <Tooltip open={isOpen} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        <div className="flex-1 min-w-0">{span}</div>
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset}>
        <p>{textContent}</p>
      </TooltipContent>
    </Tooltip>
  );
};
