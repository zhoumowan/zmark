import BubbleMenu from "@tiptap/extension-bubble-menu";
import { ListKit } from "@tiptap/extension-list";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import {
  SlashCommand,
  slashSuggestion,
} from "../slash-command/slash-extension";
import { CodeBlock } from "./code-block";
import { Heading } from "./heading";
import { CustomHighlight as Highlight } from "./highlight";
import { HtmlDiv } from "./html-div";
import { Image } from "./image";
import { Link } from "./link";
import { BlockMath, InlineMath, MultilineMathExtension } from "./math";
import { Mention } from "./mention";
import { Paragraph } from "./paragraph";
import { Subscript } from "./subscript";
import { Superscript } from "./superscript";
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
  Superscript,
  Subscript,

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
  Link,
  Image,
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
