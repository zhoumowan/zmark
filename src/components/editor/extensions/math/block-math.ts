import { InputRule } from "@tiptap/core";
import { BlockMath as TiptapBlockMath } from "@tiptap/extension-mathematics";
import type MarkdownIt from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type Token from "markdown-it/lib/token.mjs";
import type { Node } from "prosemirror-model";
import type { MarkdownSerializerState } from "@/types";

export const BlockMath = TiptapBlockMath.extend({
  addStorage() {
    return {
      markdown: {
        parse: {
          setup(markdownit: MarkdownIt) {
            markdownit.block.ruler.before(
              "paragraph",
              "blockMath",
              (
                state: StateBlock,
                startLine: number,
                endLine: number,
                silent: boolean,
              ) => {
                const startPos =
                  state.bMarks[startLine] + state.tShift[startLine];
                const maxPos = state.eMarks[startLine];

                if (startPos + 2 > maxPos) return false;
                if (
                  state.src.charCodeAt(startPos) !== 0x24 ||
                  state.src.charCodeAt(startPos + 1) !== 0x24
                ) {
                  return false;
                }

                let nextLine = startLine;
                let matchEnd = false;
                let endPos = startPos + 2;

                while (endPos < maxPos - 1) {
                  if (
                    state.src.charCodeAt(endPos) === 0x24 &&
                    state.src.charCodeAt(endPos + 1) === 0x24
                  ) {
                    matchEnd = true;
                    break;
                  }
                  if (state.src.charCodeAt(endPos) === 0x5c) endPos++;
                  endPos++;
                }

                if (!matchEnd) {
                  while (nextLine < endLine) {
                    nextLine++;
                    if (nextLine >= endLine) break;
                    const lineStart =
                      state.bMarks[nextLine] + state.tShift[nextLine];
                    const lineMax = state.eMarks[nextLine];
                    endPos = lineStart;
                    while (endPos < lineMax - 1) {
                      if (
                        state.src.charCodeAt(endPos) === 0x24 &&
                        state.src.charCodeAt(endPos + 1) === 0x24
                      ) {
                        matchEnd = true;
                        break;
                      }
                      if (state.src.charCodeAt(endPos) === 0x5c) endPos++;
                      endPos++;
                    }
                    if (matchEnd) break;
                  }
                }

                if (matchEnd) {
                  if (!silent) {
                    const token = state.push("blockMath", "", 0);
                    token.block = true;
                    token.content = state.src
                      .slice(startPos + 2, endPos)
                      .trim();
                    token.map = [startLine, nextLine + 1];
                  }
                  state.line = nextLine + 1;
                  return true;
                }

                return false;
              },
            );
            markdownit.renderer.rules.blockMath = (
              tokens: Token[],
              idx: number,
            ) => {
              const latex = tokens[idx].content;
              // escape html entities in latex if necessary, but here we just safely embed it
              return `<div data-type="block-math" data-latex="${latex.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"></div>`;
            };
          },
        },
        serialize(state: MarkdownSerializerState, node: Node) {
          state.write("$$\n");
          state.write(node.attrs.latex || "");
          state.write("\n$$\n");
        },
      },
    };
  },
  addInputRules() {
    return [
      new InputRule({
        find: /^\$\$([\s\S]+?)\$\$$/,
        handler: ({ state, range, match }) => {
          const { from, to } = range;
          const latex = match[1].replace(/\ufffc/g, "\n");
          if (latex.trim()) {
            state.tr.replaceWith(
              from,
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
