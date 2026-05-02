import { InputRule } from "@tiptap/core";
import { InlineMath as TiptapInlineMath } from "@tiptap/extension-mathematics";
import type MarkdownIt from "markdown-it";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";
import type Token from "markdown-it/lib/token.mjs";
import type { Node } from "prosemirror-model";
import type { MarkdownSerializerState } from "@/types";

export const InlineMath = TiptapInlineMath.extend({
  addStorage() {
    return {
      markdown: {
        parse: {
          setup(markdownit: MarkdownIt) {
            markdownit.inline.ruler.after(
              "escape",
              "inlineMath",
              (state: StateInline, silent: boolean) => {
                const start = state.pos;
                if (state.src.charCodeAt(start) !== 0x24) return false;

                let markerLength = 1;
                if (state.src.charCodeAt(start + 1) === 0x24) {
                  markerLength = 2;
                }

                const max = state.posMax;
                let match = start + markerLength;
                while (match < max) {
                  if (state.src.charCodeAt(match) === 0x24) {
                    if (markerLength === 2) {
                      if (state.src.charCodeAt(match + 1) === 0x24) {
                        if (!silent) {
                          const token = state.push("inlineMath", "", 0);
                          token.markup = "$$";
                          token.content = state.src
                            .slice(start + 2, match)
                            .trim();
                        }
                        state.pos = match + 2;
                        return true;
                      }
                    } else {
                      if (state.src.charCodeAt(match + 1) !== 0x24) {
                        if (!silent) {
                          const token = state.push("inlineMath", "", 0);
                          token.markup = "$";
                          token.content = state.src
                            .slice(start + 1, match)
                            .trim();
                        }
                        state.pos = match + 1;
                        return true;
                      } else {
                        match++;
                      }
                    }
                  }
                  if (state.src.charCodeAt(match) === 0x5c) match++;
                  match++;
                }
                return false;
              },
            );
            markdownit.renderer.rules.inlineMath = (
              tokens: Token[],
              idx: number,
            ) => {
              const latex = tokens[idx].content;
              return `<span data-type="inline-math" data-latex="${latex.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"></span>`;
            };
          },
        },
        serialize(state: MarkdownSerializerState, node: Node) {
          state.write("$");
          state.write(node.attrs.latex || "");
          state.write("$");
        },
      },
    };
  },
  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\$\$([^$\n]+)\$\$/,
        handler: ({ state, range, match }) => {
          const { from, to } = range;
          const latex = match[1];
          const fullMatch = match[0];
          const startOffset = fullMatch.startsWith(" ") ? 1 : 0;

          if (latex.trim()) {
            state.tr.replaceWith(
              from + startOffset,
              to,
              this.type.create({ latex: latex.trim() }),
            );
          }
        },
      }),
      new InputRule({
        find: /(?:^|\s)\$([^$\n]+)\$/,
        handler: ({ state, range, match }) => {
          const { from, to } = range;
          const latex = match[1];
          const fullMatch = match[0];
          const startOffset = fullMatch.startsWith(" ") ? 1 : 0;

          if (latex.trim()) {
            state.tr.replaceWith(
              from + startOffset,
              to,
              this.type.create({ latex: latex.trim() }),
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
});
