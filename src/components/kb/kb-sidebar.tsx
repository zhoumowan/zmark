import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useKbStore } from "@/stores/kb";
import type { Document, KnowledgeBase } from "../../types/kb";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function KbSidebar({
  mode,
  ...props
}: React.ComponentProps<typeof Sidebar> & { mode: "editor" | "kb" }) {
  const {
    currentKbId,
    knowledgeBases,
    documents,
    setCurrentKbId,
    fetchKnowledgeBases,
    createKnowledgeBase,
    addDocument,
    deleteDocument,
  } = useKbStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newKbName, setNewKbName] = useState("");

  useEffect(() => {
    fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  const handleCreateKb = async () => {
    if (!newKbName.trim()) return;
    try {
      await createKnowledgeBase(newKbName);
      setNewKbName("");
      setIsCreating(false);
      toast.success("知识库创建成功");
    } catch (error) {
      toast.error(`创建失败: ${error}`);
    }
  };

  const handleAddDocument = async () => {
    if (!currentKbId) return;
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });

      if (!selected || !Array.isArray(selected)) return;

      for (const filePath of selected) {
        const filename = filePath.split("/").pop() || "unknown.md";
        const loadingToast = toast.loading(`正在处理 ${filename}...`);
        try {
          const text = await readTextFile(filePath);
          await addDocument(currentKbId, filename, text);
          toast.success(`${filename} 添加成功`, { id: loadingToast });
        } catch (error) {
          toast.error(`${filename} 添加失败: ${error}`, { id: loadingToast });
        }
      }
    } catch (error) {
      toast.error(`文件选择失败: ${error}`);
    }
  };

  return (
    <>
      <Sidebar
        variant="floating"
        className="border-border bg-background"
        {...props}
      >
        <SidebarContent className="flex flex-col">
          <SidebarGroup className="space-y-1 flex-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Select value={currentKbId || ""} onValueChange={setCurrentKbId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="选择知识库" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {knowledgeBases.map((kb: KnowledgeBase) => (
                    <SelectItem key={kb.id} value={kb.id}>
                      {kb.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>新建知识库</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <ScrollArea className="flex-1">
              <SidebarMenu className="px-1">
                {documents.map((doc: Document) => (
                  <div
                    key={doc.id}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-accent text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{doc.filename}</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>删除文档</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
                {currentKbId && documents.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    暂无文档
                  </div>
                )}
              </SidebarMenu>
            </ScrollArea>

            <div className="mt-2 px-1">
              <Button
                variant="secondary"
                className="w-full gap-2"
                disabled={!currentKbId}
                onClick={handleAddDocument}
              >
                <Upload className="h-4 w-4" />
                添加文档
              </Button>
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建知识库</DialogTitle>
            <DialogDescription>请输入新知识库的名称</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="知识库名称"
              value={newKbName}
              onChange={(e) => setNewKbName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateKb()}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsCreating(false)}>
              取消
            </Button>
            <Button variant="secondary" onClick={handleCreateKb}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
