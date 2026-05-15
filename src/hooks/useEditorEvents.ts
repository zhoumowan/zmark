import { dirname, join } from "@tauri-apps/api/path";
import { exists, readTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { Editor } from "@tiptap/core";
import { toast } from "sonner";
import { useEditorStore } from "@/stores/editor";
import {
  handleImageUpload,
  logError,
  resolveMarkdownImages,
  to,
} from "@/utils";
import { parseMarkdown } from "@/utils/frontmatter";

async function handleLocalDocument(href: string): Promise<void> {
  const { curPath, setCurPath, setContent, setFrontmatter } =
    useEditorStore.getState();
  if (!curPath) return;

  let targetPath = href;
  if (!href.startsWith("/") && !/^[a-zA-Z]:[\\/]/.test(href)) {
    const docDir = await dirname(curPath);
    targetPath = await join(docDir, href);
  }

  const isExist = await exists(targetPath);
  if (!isExist) {
    toast.error("文档不存在");
    return;
  }

  const content = await readTextFile(targetPath);
  const { frontmatter, body } = parseMarkdown(content);
  const resolvedContent = await resolveMarkdownImages(body, targetPath);

  setFrontmatter(frontmatter);
  setContent(resolvedContent);
  setCurPath(targetPath);
}

export function useEditorEvents() {
  return {
    click: (_view: Editor["view"], event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return false;

      const href = anchor.getAttribute("href");
      if (!href) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }

      const { metaKey, ctrlKey } = event;
      const isHttp = href.startsWith("http://") || href.startsWith("https://");
      const isLocalDoc =
        !isHttp && (href.endsWith(".md") || href.endsWith(".zmark"));

      // 1. 处理页内锚点跳转 (Heading Anchor)
      if (href.startsWith("#")) {
        const id = href.slice(1);
        if (id) {
          const element = _view.dom.parentElement?.querySelector(
            `[id="${id}"]`,
          );
          element?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      // 2. 处理本地 Markdown/Zmark 文档跳转
      else if (isLocalDoc) {
        to(handleLocalDocument(href)).then(([err]) => {
          if (err) {
            logError("Failed to open local link:", err);
            toast.error("无法打开文档");
          }
        });
      }
      // 3. 处理外部链接 (按住 Meta/Ctrl 键点击)
      else if (metaKey || ctrlKey) {
        to(openUrl(href)).then(([err]) => {
          if (err) {
            logError("Failed to open URL:", err);
            toast.error("无法打开链接");
          }
        });
      }

      // 统一拦截所有有效 <a> 标签的默认行为（包括页内锚点、本地文档、外部链接）
      event.preventDefault();
      event.stopPropagation();
      return true;
    },
    paste: (view: Editor["view"], event: ClipboardEvent) => {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));

      if (imageItem) {
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          to(handleImageUpload(file)).then(([err, url]) => {
            if (err) {
              logError("Image upload failed:", err);
              const errorMessage = err.message || String(err);
              toast.error(`图片上传失败: ${errorMessage}`);
            } else if (url) {
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: url }),
                ),
              );
              toast.success("图片已上传");
            }
          });
          return true;
        }
      }
      return false;
    },
  };
}
