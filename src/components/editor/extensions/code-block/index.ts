import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { CodeBlockComponent } from "./CodeBlockComponent";

const lowlight = createLowlight(common);

export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
}).configure({
  lowlight,
});
