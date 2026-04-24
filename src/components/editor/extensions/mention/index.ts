import MentionExtension from "@tiptap/extension-mention";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MentionNodeView } from "./mention-node-view";
import { getMentionSuggestion } from "./suggestion";

export const Mention = MentionExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView);
  },
}).configure({
  HTMLAttributes: {
    class: "mention",
  },
  suggestion: getMentionSuggestion(),
});
