import { getMarksBetween, InputRule } from "@tiptap/core";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { ListKit } from "@tiptap/extension-list";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import type { MarkType, Node } from "prosemirror-model";
import { Markdown } from "tiptap-markdown";
import type { MarkdownSerializerState } from "@/types";
import {
  SlashCommand,
  slashSuggestion,
} from "../slash-command/slash-extension";
import { CodeBlock } from "./code-block";
import { Heading } from "./heading";
import { CustomHighlight as Highlight } from "./highlight";
import { HtmlDiv } from "./html-div";
import { BlockMath, InlineMath, MultilineMathExtension } from "./math";
import { Mention } from "./mention";
import { Paragraph } from "./paragraph";
import { TextAlign } from "./text-align";
import { ZMarkContainer } from "./zmark-container";

export const extensions = [
  // 基础结构扩展：支撑常见 Markdown 语法（粗体、斜体、列表、段落、标题等）
  StarterKit.configure({
    link: false,
    bulletList: false,
    listItem: false,
    listKeymap: false,
    orderedList: false,
    codeBlock: false,
    heading: false,
    paragraph: false,
  }),
  TextStyleKit,
  ListKit,
  Paragraph,
  Heading,
  Superscript.extend({
    addKeyboardShortcuts() {
      return {
        "Mod-Shift-.": () => this.editor.commands.toggleSuperscript(),
      };
    },
  }),
  Subscript.extend({
    addKeyboardShortcuts() {
      return {
        "Mod-Shift-,": () => this.editor.commands.toggleSubscript(),
      };
    },
  }),

  // 结构化扩展：文档引用、容器、HTML 块、文本对齐等
  TextAlign.configure({
    types: ["heading", "paragraph", "htmlDiv"],
  }),
  HtmlDiv,
  ZMarkContainer,
  Mention,

  // 样式与内容扩展：高亮、链接、图片、代码块以及 Markdown 序列化支持
  MultilineMathExtension,
  InlineMath,
  BlockMath,
  Highlight,
  Link.extend({
    addInputRules() {
      const isMaliciousUrl = (url: string) => {
        const lower = url.toLowerCase();
        return lower.startsWith("javascript:") || lower.startsWith("vbscript:");
      };

      return [
        new InputRule({
          find: /\[(.+?)\]\((.+?)\)\s$/,
          handler: ({ state, range, match }) => {
            const linkText = match[1];
            const url = match[2];
            const { tr } = state;

            // 保留链接文本，删除 [ 和 ](url) 部分
            const textStart = range.from + 1; // 跳过 '['
            const textEnd = textStart + linkText.length;

            if (textEnd < range.to) {
              tr.delete(textEnd, range.to);
            }
            if (textStart > range.from) {
              tr.delete(range.from, textStart);
            }

            if (isMaliciousUrl(url)) {
              // 恶意 URL 只保留纯文本，不添加 Link mark
              return;
            }

            // 检查排除 marks（复制 markInputRule 的安全检查）
            const excludedMarks = getMarksBetween(
              range.from,
              range.to,
              state.doc,
            )
              .filter((item) => {
                const excluded = (
                  item.mark.type as unknown as { excluded?: MarkType[] }
                ).excluded;
                return (
                  excluded?.some(
                    (type) => type === this.type && type !== item.mark.type,
                  ) ?? false
                );
              })
              .filter((item) => item.to > textStart);

            if (excludedMarks.length) {
              return null;
            }

            tr.addMark(
              range.from,
              range.from + linkText.length,
              this.type.create({ href: url }),
            );
            tr.removeStoredMark(this.type);
          },
        }),
        // Add rule to match <a><img></a> pattern
        new InputRule({
          find: /<a\s+href="([^"]+)"[^>]*><img\s+src="([^"]+)"[^>]*><\/a>/,
          handler: ({ state, range, match }) => {
            const url = match[1];
            const imgSrc = match[2];
            const { tr } = state;

            // 替换整个匹配范围为 Image 节点
            const imageNode = state.schema.nodes.image.create({ src: imgSrc });
            tr.replaceWith(range.from, range.to, imageNode);

            if (!isMaliciousUrl(url)) {
              tr.addMark(
                range.from,
                range.from + 1,
                this.type.create({ href: url }),
              );
              tr.removeStoredMark(this.type);
            }
          },
        }),
      ];
    },
  }).configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    validate: (url) => !!url && !url.toLowerCase().startsWith("javascript:"),
  }),
  Image.extend({
    priority: 1001,
    addStorage() {
      return {
        markdown: {
          serialize(state: MarkdownSerializerState, node: Node) {
            const alt = node.attrs.alt || "";
            const src = node.attrs.src || "";
            const title = node.attrs.title ? ` "${node.attrs.title}"` : "";
            state.write(`![${alt}](${src}${title})`);
          },
        },
      };
    },
    addInputRules() {
      return [
        new InputRule({
          find: /(?:^|\s)!\[(.*?)\]\((\S+)(?:\s+"([^"]+)")?\)$/,
          handler: ({ state, range, match }) => {
            const { from, to } = range;
            const alt = match[1] || "";
            const src = match[2] || "";
            const title = match[3] || "";

            const fullMatch = match[0];
            const offset = fullMatch.indexOf("![");
            const actualFrom = offset > 0 ? from + offset : from;

            state.tr.replaceWith(
              actualFrom,
              to,
              this.type.create({ src, alt, title }),
            );
          },
        }),
      ];
    },
  }).configure({
    allowBase64: true,
    inline: true,
  }),
  CodeBlock,
  Markdown.configure({ html: true, transformPastedText: true }),

  // 交互扩展：占位符、斜杠命令、行内气泡菜单等，提升写作交互体验
  Placeholder.configure({
    placeholder: "Write something …",
  }),
  BubbleMenu,
  SlashCommand.configure({
    suggestion: slashSuggestion,
  }),
];
