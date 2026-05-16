import { getMarksBetween, InputRule } from "@tiptap/core";
import TiptapLink from "@tiptap/extension-link";
import type { MarkType } from "prosemirror-model";

export const Link = TiptapLink.extend({
  addInputRules() {
    const isMaliciousUrl = (url: string) => {
      const lower = url.toLowerCase();
      return lower.startsWith("javascript:") || lower.startsWith("vbscript:");
    };

    return [
      new InputRule({
        find: /\[(.+?)\]\((.+?)\)\s$/,
        handler: ({ state, range, match }) => {
          const linkText = match[1];
          const url = match[2];
          const { tr } = state;

          // 保留链接文本，删除 [ 和 ](url) 部分
          const textStart = range.from + 1; // 跳过 '['
          const textEnd = textStart + linkText.length;

          if (textEnd < range.to) {
            tr.delete(textEnd, range.to);
          }
          if (textStart > range.from) {
            tr.delete(range.from, textStart);
          }

          if (isMaliciousUrl(url)) {
            // 恶意 URL 只保留纯文本，不添加 Link mark
            return;
          }

          // 检查排除 marks（复制 markInputRule 的安全检查）
          const excludedMarks = getMarksBetween(range.from, range.to, state.doc)
            .filter((item) => {
              const excluded = (
                item.mark.type as unknown as { excluded?: MarkType[] }
              ).excluded;
              return (
                excluded?.some(
                  (type) => type === this.type && type !== item.mark.type,
                ) ?? false
              );
            })
            .filter((item) => item.to > textStart);

          if (excludedMarks.length) {
            return null;
          }

          tr.addMark(
            range.from,
            range.from + linkText.length,
            this.type.create({ href: url }),
          );
          tr.removeStoredMark(this.type);
        },
      }),
      // Add rule to match <a><img></a> pattern
      new InputRule({
        find: /<a\s+href="([^"]+)"[^>]*><img\s+src="([^"]+)"[^>]*><\/a>/,
        handler: ({ state, range, match }) => {
          const url = match[1];
          const imgSrc = match[2];
          const { tr } = state;

          // 替换整个匹配范围为 Image 节点
          const imageNode = state.schema.nodes.image.create({ src: imgSrc });
          tr.replaceWith(range.from, range.to, imageNode);

          if (!isMaliciousUrl(url)) {
            tr.addMark(
              range.from,
              range.from + 1,
              this.type.create({ href: url }),
            );
            tr.removeStoredMark(this.type);
          }
        },
      }),
    ];
  },
}).configure({
  openOnClick: false,
  autolink: true,
  linkOnPaste: true,
  validate: (url) => !!url && !url.toLowerCase().startsWith("javascript:"),
});
