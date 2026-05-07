import { markInputRule, markPasteRule } from "@tiptap/core";
import Highlight, { inputRegex, pasteRegex } from "@tiptap/extension-highlight";
import type { Node } from "prosemirror-model";
import { DEFAULT_HIGHLIGHT_COLOR } from "@/consts/highlight";
import type { MarkdownSerializerState } from "@/types";
export const CustomHighlight = Highlight.extend({
  // Parse `<mark>` tags with `data-color` and `style` attributes
  addAttributes() {
    return {
      color: {
        default: DEFAULT_HIGHLIGHT_COLOR,
        parseHTML: (element) =>
          element.getAttribute("data-color") ||
          element.style.backgroundColor ||
          DEFAULT_HIGHLIGHT_COLOR,
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {};
          }
          return {
            "data-color": attributes.color,
            style: `background-color: ${attributes.color}; color: inherit;`,
          };
        },
      },
    };
  },
  // Serialize highlights with concrete color values for portable markdown
  addStorage() {
    const COLOR_MAP: Record<string, string> = {
      "var(--tt-color-highlight-orange)": "rgb(251, 236, 221)",
      "var(--tt-color-highlight-yellow)": "#fef9c3",
      "var(--tt-color-highlight-green)": "#dcfce7",
      "var(--tt-color-highlight-blue)": "#e0f2fe",
      "var(--tt-color-highlight-purple)": "#f3e8ff",
      "var(--tt-color-highlight-red)": "#ffe4e6",
    };
    return {
      markdown: {
        serialize: {
          open(_: MarkdownSerializerState, mark: Node) {
            const color =
              mark.attrs.color ?? "var(--tt-color-highlight-purple)";
            const concrete = COLOR_MAP[color] ?? color;
            return `<mark data-color="${color}" style="background-color: ${concrete}; color: inherit;">`;
          },
          close: "</mark>",
        },
      },
    };
  },
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
});
