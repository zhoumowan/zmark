import { mergeAttributes } from "@tiptap/core";
import TiptapHeading from "@tiptap/extension-heading";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\n]+/g, "-")
    .replace(/[^\u4e00-\u9fa5\w-]/g, ""); // Keep Chinese characters, alphanumeric, and hyphens
}

export const Heading = TiptapHeading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const level = hasLevel ? node.attrs.level : this.options.levels[0];

    const id = slugify(node.textContent);

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { id }),
      0,
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const align = node.attrs.textAlign;
          if (align && align !== "left") {
            state.write(`<h${node.attrs.level} align="${align}">`);
            state.renderInline(node);
            state.write(`</h${node.attrs.level}>`);
            state.closeBlock(node);
          } else {
            state.write(state.repeat("#", node.attrs.level) + " ");
            state.renderInline(node);
            state.closeBlock(node);
          }
        },
      },
    };
  },
});
