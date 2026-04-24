import type { SuggestionProps } from "@tiptap/suggestion";
import { File } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { TruncatedTooltip } from "@/components/common/truncated-tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

export interface MentionItem {
  name: string;
  path: string;
}

export const MentionList = forwardRef(
  (props: SuggestionProps<MentionItem>, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // biome-ignore lint/correctness/useExhaustiveDependencies: Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0);
    }, [props.items.length]);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command({ id: item.path, label: item.name });
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex(
            (selectedIndex + props.items.length - 1) % props.items.length,
          );
          return true;
        }

        if (event.key === "ArrowDown") {
          setSelectedIndex((selectedIndex + 1) % props.items.length);
          return true;
        }

        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }

        return false;
      },
    }));

    if (props.items.length === 0) {
      return null;
    }

    return (
      <TooltipProvider delayDuration={400}>
        <div className="w-64 flex flex-col overflow-hidden rounded-md bg-popover text-popover-foreground border border-border shadow-md">
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              提及文档
            </div>
            {props.items.map((item, index) => (
              <button
                key={item.path || index}
                type="button"
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`relative flex w-full cursor-pointer gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-left ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground"
                }`}
              >
                <File className="h-4 w-4 shrink-0" />
                <TruncatedTooltip
                  content={item.name}
                  side="right"
                  sideOffset={12}
                />
              </button>
            ))}
          </div>
        </div>
      </TooltipProvider>
    );
  },
);

MentionList.displayName = "MentionList";
