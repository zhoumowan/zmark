import { InputRule } from "@tiptap/core";
import TiptapSubscript from "@tiptap/extension-subscript";
import type MarkdownIt from "markdown-it";

export const Subscript = TiptapSubscript.extend({
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-,": () => this.editor.commands.toggleSubscript(),
    };
  },
  addInputRules() {
    return [
      new InputRule({
        find: /~([^\s~]+)~$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const content = match[1];
          const start = range.from;
          const textStart = start + 1;
          const textEnd = textStart + content.length;
          if (textEnd < range.to) {
            tr.delete(textEnd, range.to);
          }
          if (textStart > start) {
            tr.delete(start, textStart);
          }
          tr.addMark(start, start + content.length, this.type.create());
          tr.removeStoredMark(this.type);
        },
      }),
    ];
  },
  addStorage() {
    return {
      markdown: {
        parse: {
          setup(markdownit: MarkdownIt) {
            markdownit.inline.ruler.after(
              "escape",
              "subscript",
              (state, silent) => {
                if (state.src.charCodeAt(state.pos) !== 0x7e) return false;
                const match = state.src.slice(state.pos).match(/^~([^\s~]+)~/);
                if (!match) return false;
                if (!silent) {
                  const token = state.push("html_inline", "", 0);
                  token.content = `<sub>${markdownit.utils.escapeHtml(match[1])}</sub>`;
                }
                state.pos += match[0].length;
                return true;
              },
            );
          },
        },
        serialize: {
          open: "~",
          close: "~",
          expelEnclosingWhitespace: true,
        },
      },
    };
  },
});
