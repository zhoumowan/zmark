import TiptapParagraph from "@tiptap/extension-paragraph";

export const Paragraph = TiptapParagraph.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
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
