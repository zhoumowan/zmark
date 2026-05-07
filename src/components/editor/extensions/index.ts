import { markInputRule } from "@tiptap/core";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { ListKit } from "@tiptap/extension-list";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import type { Node } from "prosemirror-model";
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
      return [
        markInputRule({
          find: /\[(.+?)\]\((.+?)\)\s$/,
          type: this.type,
          getAttributes: (match) => {
            const url = match[2];
            if (url.startsWith("javascript:") || url.startsWith("vbscript:")) {
              return { href: "" };
            }
            return {
              href: url,
            };
          },
        }),
        // Add rule to match <a><img></a> pattern
        markInputRule({
          find: /<a\s+href="([^"]+)"[^>]*><img\s+src="([^"]+)"[^>]*><\/a>/,
          type: this.type,
          getAttributes: (match) => {
            const url = match[1];
            if (url.startsWith("javascript:") || url.startsWith("vbscript:")) {
              return { href: "" };
            }
            return {
              href: url,
            };
          },
        }),
      ];
    },
  }).configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    validate: (url) => !!url && !url.startsWith("javascript:"),
  }),
  Image.extend({
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
