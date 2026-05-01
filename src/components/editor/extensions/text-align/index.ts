import TiptapTextAlign from "@tiptap/extension-text-align";

export const TextAlign = TiptapTextAlign.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element) => {
              const styleAlign = element.style.textAlign;
              const attrAlign = element.getAttribute("align");
              const alignment = styleAlign || attrAlign;
              return alignment && this.options.alignments.includes(alignment)
                ? alignment
                : this.options.defaultAlignment;
            },
            renderHTML: (attributes) => {
              if (!attributes.textAlign) {
                return {};
              }
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
});
