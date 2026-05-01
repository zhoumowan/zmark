import TiptapParagraph from "@tiptap/extension-paragraph";
import type { Node } from "prosemirror-model";
import type { MarkdownSerializerState } from "@/types";

export const Paragraph = TiptapParagraph.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: Node) {
          const align = node.attrs.textAlign;
          if (align && align !== "left") {
            state.write(`<p align="${align}">`);
            state.renderInline(node);
            state.write(`</p>`);
            state.closeBlock(node);
          } else {
            state.renderInline(node);
            state.closeBlock(node);
          }
        },
      },
    };
  },
});
