import type { Storage } from "@tiptap/core";
import type { Node } from "prosemirror-model";

export type TreeItem = string | TreeItem[];

export type MarkdownSerializerState = {
  write: (content: string) => void;
  ensureNewLine: () => void;
  renderContent: (node: Node) => void;
  renderInline: (node: Node) => void;
  closeBlock: (node: Node) => void;
  repeat: (str: string, count: number) => string;
};

export type EditorStorage = Storage & {
  markdown: {
    getMarkdown: () => string;
    serializer: {
      serialize: (doc: Node) => string;
    };
    parser: {
      parse: (text: string) => string;
    };
  };
};
