import { InputRule, markInputRule, markPasteRule } from "@tiptap/core";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Highlight, { inputRegex, pasteRegex } from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { ListKit } from "@tiptap/extension-list";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";
import type * as Y from "yjs";
import { DEFAULT_HIGHLIGHT_COLOR } from "@/consts/highlight";
import {
  SlashCommand,
  slashSuggestion,
} from "../slash-command/slash-extension";

const lowlight = createLowlight(common);

interface ExtensionOptions {
  yDoc?: Y.Doc | null;
  // biome-ignore lint/suspicious/noExplicitAny: <WebrtcProvider type is complex and not fully exported>
  provider?: any | null;
  userName?: string;
  userColor?: string;
}

export const getExtensions = ({
  yDoc,
  provider,
  userName = "Anonymous",
  userColor = "#f783ac",
}: ExtensionOptions = {}) => {
  const isCollaborating = !!(yDoc && provider);

  const baseExtensions = [
    Placeholder.configure({
      placeholder: "Write something …",
    }),
    TextStyleKit,
    ListKit,
    StarterKit.configure({
      link: false,
      bulletList: false,
      listItem: false,
      listKeymap: false,
      orderedList: false,
      codeBlock: false,
      undoRedo: isCollaborating ? false : undefined,
    }),
    Markdown.configure({ html: true }),
    BubbleMenu,
    SlashCommand.configure({
      suggestion: slashSuggestion,
    }),
    Highlight.extend({
      addKeyboardShortcuts() {
        return {};
      },
      addInputRules() {
        return [
          markInputRule({
            find: inputRegex,
            type: this.type,
            getAttributes: () => ({
              color: DEFAULT_HIGHLIGHT_COLOR,
            }),
          }),
        ];
      },
      addPasteRules() {
        return [
          markPasteRule({
            find: pasteRegex,
            type: this.type,
            getAttributes: () => ({
              color: DEFAULT_HIGHLIGHT_COLOR,
            }),
          }),
        ];
      },
    }).configure({
      multicolor: true,
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
    Image.configure({
      allowBase64: true,
    }),
    Link.extend({
      addInputRules() {
        return [
          markInputRule({
            find: /\[(.+?)\]\((.+?)\)\s$/,
            type: this.type,
            getAttributes: (match) => {
              const url = match[2];
              if (
                url.startsWith("javascript:") ||
                url.startsWith("vbscript:")
              ) {
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
    InlineMath.extend({
      addInputRules() {
        return [
          new InputRule({
            find: /(?:^|\s)\$([^$]+)\$/,
            handler: ({ state, range, match }) => {
              const { from, to } = range;
              const latex = match[1];
              const fullMatch = match[0];
              const startOffset = fullMatch.startsWith(" ") ? 1 : 0;

              if (latex.trim()) {
                state.tr.replaceWith(
                  from + startOffset,
                  to,
                  this.type.create({ latex }),
                );
              }
            },
          }),
        ];
      },
    }).configure({
      katexOptions: {
        throwOnError: false,
      },
    }),
    BlockMath.extend({
      addInputRules() {
        return [
          new InputRule({
            find: /^\$\$([^$]+)\$\$$/,
            handler: ({ state, range, match }) => {
              const { from, to } = range;
              const latex = match[1];
              if (latex.trim()) {
                state.tr.replaceWith(from, to, this.type.create({ latex }));
              }
            },
          }),
        ];
      },
    }).configure({
      katexOptions: {
        throwOnError: false,
      },
    }),
  ];

  if (isCollaborating) {
    baseExtensions.push(
      Collaboration.configure({
        document: yDoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: userName,
          color: userColor,
        },
      }),
    );
  }

  return baseExtensions;
};
