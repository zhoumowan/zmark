import type { LucideIcon } from "lucide-react";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
}

export const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  (originalProps, ref) => {
    const {
      icon: Icon,
      label,
      shortcut,
      onClick,
      isActive,
      disabled,
      className,
      ...props
    } = originalProps;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`${className} ${isActive ? "is-active" : ""}`}
            {...props}
          >
            <Icon size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {label} {shortcut && `(${shortcut})`}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  },
);

MenuButton.displayName = "MenuButton";
