import { ChevronRight, Folder, File } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getTreeKey } from "@/utils/file";

export type TreeItem = string | TreeItem[];

interface ITreeProps {
  item: TreeItem;
}

export const Tree = (props: ITreeProps) => {
  const { item } = props;

  if (typeof item === "string") {
    return (
      <SidebarMenuButton
        isActive={item === "button.tsx"}
        className="data-[active=true]:bg-transparent"
      >
        <File />
        {item}
      </SidebarMenuButton>
    );
  }

  const [name, ...items] = item;
  const isEmpty = items.length === 0;

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={name === "components" || name === "ui"}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform" />
            <Folder />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {!isEmpty && (
            <SidebarMenuSub>
              {items.map((subItem) => (
                <Tree key={getTreeKey(subItem)} item={subItem} />
              ))}
            </SidebarMenuSub>
          )}
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
