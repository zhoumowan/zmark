import { GalleryVerticalEndIcon } from "lucide-react";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getDataDir, getFileTree, getTreeKey } from "@/utils/file";
import { useEffect, useState } from "react";
import { Tree } from "./tree";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [fileTree, setFileTree] = useState([]);
  const [basePath, setBasePath] = useState("");
  useEffect(() => {
    const fetchMdFiles = async () => {
      const files = await getFileTree();
      const dataDir = await getDataDir();
      setBasePath(dataDir);
      setFileTree(files);
      console.log(files)
    };
    fetchMdFiles();
  }, []);
  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEndIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Documentation</span>
                  <span className="">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {fileTree.map((item) => (
              <Tree key={getTreeKey(item)} item={item} basePath={basePath} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
