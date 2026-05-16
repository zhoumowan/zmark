import { InputRule } from "@tiptap/core";
import TiptapImage from "@tiptap/extension-image";
import type { Node } from "prosemirror-model";
import type { MarkdownSerializerState } from "@/types";

export const Image = TiptapImage.extend({
  priority: 1001,
  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: Node) {
          const alt = node.attrs.alt || "";
          const src = node.attrs.src || "";
          const title = node.attrs.title ? ` "${node.attrs.title}"` : "";
          state.write(`![${alt}](${src}${title})`);
        },
      },
    };
  },
  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)!\[(.*?)\]\((\S+)(?:\s+"([^"]+)")?\)$/,
        handler: ({ state, range, match }) => {
          const { from, to } = range;
          const alt = match[1] || "";
          const src = match[2] || "";
          const title = match[3] || "";

          const fullMatch = match[0];
          const offset = fullMatch.indexOf("![");
          const actualFrom = offset > 0 ? from + offset : from;

          state.tr.replaceWith(
            actualFrom,
            to,
            this.type.create({ src, alt, title }),
          );
        },
      }),
    ];
  },
}).configure({
  allowBase64: true,
  inline: true,
});
