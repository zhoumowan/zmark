import { mergeAttributes, Node } from "@tiptap/core";

export const HtmlDiv = Node.create({
  name: "htmlDiv",

  group: "block",
  content: "block+",

  addAttributes() {
    return {
      align: {
        default: null,
        parseHTML: (element) => element.getAttribute("align"),
        renderHTML: (attributes) => {
          if (!attributes.align) return {};
          return {
            align: attributes.align,
            style: `text-align: ${attributes.align}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const align = node.attrs.align;
          if (align) {
            state.write(`<div align="${align}">\n`);
          } else {
            state.write(`<div>\n`);
          }
          state.renderContent(node);
          state.write(`</div>\n`);
          state.closeBlock(node);
        },
        parse: {
          setup(_markdownit: any) {
            // let tiptap-markdown HTML parser handle it naturally via its tag rules
          },
        },
      },
    };
  },
});
