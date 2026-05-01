import { Extension } from "@tiptap/core";
import { multilineMathPlugin } from "./plugin";

export const MultilineMathExtension = Extension.create({
  name: "multilineMath",
  addProseMirrorPlugins() {
    return [multilineMathPlugin];
  },
});
