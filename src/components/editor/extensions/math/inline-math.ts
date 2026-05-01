import { InputRule } from "@tiptap/core";
import { InlineMath as TiptapInlineMath } from "@tiptap/extension-mathematics";

export const InlineMath = TiptapInlineMath.extend({
  addStorage() {
    return {
      markdown: {
        parse: {
          setup(markdownit: any) {
            markdownit.inline.ruler.after(
              "escape",
              "inlineMath",
              (state: any, silent: boolean) => {
                const start = state.pos;
                if (state.src.charCodeAt(start) !== 0x24) return false;
                if (state.src.charCodeAt(start + 1) === 0x24) return false;

                const max = state.posMax;
                let match = start + 1;
                while (match < max) {
                  if (state.src.charCodeAt(match) === 0x24) {
                    if (!silent) {
                      const token = state.push("inlineMath", "", 0);
                      token.markup = "$";
                      token.content = state.src.slice(start + 1, match);
                    }
                    state.pos = match + 1;
                    return true;
                  }
                  if (state.src.charCodeAt(match) === 0x5c) match++;
                  match++;
                }
                return false;
              },
            );
            markdownit.renderer.rules.inlineMath = (
              tokens: any,
              idx: number,
            ) => {
              const latex = tokens[idx].content;
              return `<span data-type="inline-math" data-latex="${latex.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"></span>`;
            };
          },
        },
        serialize(state: any, node: any) {
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
});
