import { ChevronRight, Folder, File } from "lucide-react";
import { useEditorStore } from "@/stores/editor";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
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
  basePath: string;
}

export const Tree = (props: ITreeProps) => {
  const { item, basePath } = props;

  const { curPath, setCurPath, setContent } = useEditorStore();
  if (typeof item === "string") {
    const handleClick = async () => {
      const path = await join(basePath, item);
      console.log(path, curPath, item);
      setCurPath(path);
      const content = await readTextFile(path);
      setContent(content);
    };
    return (
      <SidebarMenuButton
        isActive={curPath.endsWith(item)}
        className="data-[active=true]:bg-purple-100"
        onClick={handleClick}
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
                <Tree
                  key={getTreeKey(subItem)}
                  item={subItem}
                  basePath={basePath + "/" + name}
                />
              ))}
            </SidebarMenuSub>
          )}
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
