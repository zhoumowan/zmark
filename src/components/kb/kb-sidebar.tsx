import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import {
  File,
  Library,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TruncatedTooltip } from "@/components/common/truncated-tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAsyncAction, useEnterSubmit } from "@/hooks";
import { useKbStore } from "@/stores";
import type { Document, KnowledgeBase } from "@/types/kb";
import { getDisplayFilename, to } from "@/utils";
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
  mode: _mode,
  ...props
}: React.ComponentProps<typeof Sidebar> & { mode: "editor" | "kb" }) {
  const {
    currentKbId,
    knowledgeBases,
    documents,
    setCurrentKbId,
    fetchKnowledgeBases,
    fetchDocuments,
    createKnowledgeBase,
    renameKnowledgeBase,
    deleteKnowledgeBase,
    addDocument,
    deleteDocument,
  } = useKbStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newKbName, setNewKbName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameKbName, setRenameKbName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isKbSelectOpen, setIsKbSelectOpen] = useState(false);

  useEffect(() => {
    fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  useEffect(() => {
    if (currentKbId) {
      fetchDocuments(currentKbId);
    }
  }, [currentKbId, fetchDocuments]);

  useEffect(() => {
    if (knowledgeBases.length === 0) {
      setIsKbSelectOpen(true);
    }
  }, [knowledgeBases.length]);

  const { execute: createKb, isLoading: isCreatingKb } = useAsyncAction(
    async (name: string) => {
      const [err] = await to(createKnowledgeBase(name));
      if (err) {
        throw err instanceof Error ? err : new Error(String(err));
      }
      return null;
    },
    {
      loadingMessage: "创建中...",
      successMessage: "知识库创建成功",
      errorMessage: (e) => `创建失败: ${e.message}`,
      onSuccess: () => setNewKbName(""),
    },
  );

  const { execute: renameKb, isLoading: isRenamingKb } = useAsyncAction(
    async (name: string) => {
      if (!currentKbId) return;
      const [err] = await to(renameKnowledgeBase(currentKbId, name));
      if (err) {
        throw err instanceof Error ? err : new Error(String(err));
      }
    },
    {
      loadingMessage: "重命名中...",
      successMessage: "重命名成功",
      errorMessage: (e) => `重命名失败: ${e.message}`,
      onSuccess: () => {
        setRenameKbName("");
        setIsRenaming(false);
      },
    },
  );

  const { execute: deleteKb, isLoading: isDeletingKb } = useAsyncAction(
    async () => {
      if (!currentKbId) return;
      const [err] = await to(deleteKnowledgeBase(currentKbId));
      if (err) {
        throw err instanceof Error ? err : new Error(String(err));
      }
    },
    {
      loadingMessage: "删除中...",
      successMessage: "删除成功",
      errorMessage: (e) => `删除失败: ${e.message}`,
      onSuccess: () => setIsDeleting(false),
    },
  );

  const handleCreateKb = async () => {
    const name = newKbName.trim();
    if (!name) return;
    await createKb(name);
    setIsCreating(false);
  };

  const handleRenameKb = async () => {
    const name = renameKbName.trim();
    if (!name) return;
    await renameKb(name);
  };

  const handleDeleteKb = async () => {
    await deleteKb();
  };

  const startRename = () => {
    const kb = knowledgeBases.find((k) => k.id === currentKbId);
    if (kb) {
      setRenameKbName(kb.name);
      setIsRenaming(true);
    }
  };

  const createEnterSubmit = useEnterSubmit({
    onEnter: handleCreateKb,
    enabled: isCreating && !isCreatingKb,
  });

  const renameEnterSubmit = useEnterSubmit({
    onEnter: handleRenameKb,
    enabled: isRenaming && !isRenamingKb,
  });

  const showAddDocumentResult = (
    filename: string,
    toastId: string | number,
    err: unknown,
  ) => {
    if (err) {
      toast.error(`${filename} 添加失败: ${String(err)}`, { id: toastId });
      return;
    }
    toast.success(`${filename} 添加成功`, { id: toastId });
  };

  const handleAddDocument = async () => {
    if (!currentKbId) return;
    const [openErr, selected] = await to(
      open({
        multiple: true,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      }),
    );

    if (openErr) {
      toast.error(`文件选择失败: ${openErr}`);
      return;
    }

    if (!selected || !Array.isArray(selected)) return;

    for (const filePath of selected) {
      const filename = getDisplayFilename(filePath);
      const loadingToast = toast.loading(`正在处理 ${filename}...`);
      const [readErr, text] = await to(readTextFile(filePath));
      if (readErr) {
        showAddDocumentResult(filename, loadingToast, readErr);
        continue;
      }

      const [addErr] = await to(addDocument(currentKbId, filename, text));
      showAddDocumentResult(filename, loadingToast, addErr);
    }
  };

  const currentKbName =
    knowledgeBases.find((kb) => kb.id === currentKbId)?.name ?? "";

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
              <Select
                value={currentKbId || ""}
                onValueChange={setCurrentKbId}
                open={isKbSelectOpen}
                onOpenChange={setIsKbSelectOpen}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="选择知识库" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {knowledgeBases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-muted-foreground">
                      <Library className="h-10 w-10 mb-3 opacity-40" />
                      <p className="text-sm font-medium">暂无知识库</p>
                      <p className="text-xs mt-1">点击右侧 + 按钮创建</p>
                    </div>
                  ) : (
                    knowledgeBases.map((kb: KnowledgeBase) => (
                      <SelectItem key={kb.id} value={kb.id}>
                        {kb.name}
                      </SelectItem>
                    ))
                  )}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" disabled={!currentKbId}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={startRename}>
                    <Pencil className="mr-2 h-4 w-4" />
                    重命名
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleting(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ScrollArea className="flex-1">
              <SidebarMenu className="px-1">
                {documents.map((doc: Document) => (
                  <SidebarMenuItem key={doc.id}>
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <SidebarMenuButton>
                          <File />
                          <TruncatedTooltip
                            content={getDisplayFilename(doc.filename)}
                          />
                        </SidebarMenuButton>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => deleteDocument(doc.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </SidebarMenuItem>
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
              onCompositionStart={createEnterSubmit.onCompositionStart}
              onCompositionEnd={createEnterSubmit.onCompositionEnd}
              onKeyDown={createEnterSubmit.onKeyDown}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsCreating(false)}>
              取消
            </Button>
            <Button
              variant="secondary"
              onClick={handleCreateKb}
              disabled={isCreatingKb}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名知识库</DialogTitle>
            <DialogDescription>请输入新的知识库名称</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="知识库名称"
              value={renameKbName}
              onChange={(e) => setRenameKbName(e.target.value)}
              onCompositionStart={renameEnterSubmit.onCompositionStart}
              onCompositionEnd={renameEnterSubmit.onCompositionEnd}
              onKeyDown={renameEnterSubmit.onKeyDown}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsRenaming(false)}>
              取消
            </Button>
            <Button
              variant="secondary"
              onClick={handleRenameKb}
              disabled={isRenamingKb}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除知识库</DialogTitle>
            <DialogDescription>
              确定要删除知识库「{currentKbName}
              」吗？此操作将同时删除该知识库下的所有文档，且不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteKb}
              disabled={isDeletingKb}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
