import { Extension } from "@tiptap/core";

export interface InsertMarkdownTableOptions {
  columns?: number;
  rows?: number;
}

const clampCount = (value: number, min = 1, max = 12) =>
  Math.min(max, Math.max(min, value));

const createMarkdownTable = (options: InsertMarkdownTableOptions = {}) => {
  const columnCount = clampCount(options.columns ?? 3);
  const rowCount = clampCount(options.rows ?? 2);

  const header = Array.from(
    { length: columnCount },
    (_, index) => `Column ${index + 1}`,
  );
  const divider = Array.from({ length: columnCount }, () => "---");
  const rows = Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from(
      { length: columnCount },
      (_, colIndex) => `Value ${rowIndex + 1}-${colIndex + 1}`,
    ),
  );

  return [header, divider, ...rows]
    .map((cells) => `| ${cells.join(" | ")} |`)
    .join("\n");
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    markdownTable: {
      insertMarkdownTable: (options?: InsertMarkdownTableOptions) => ReturnType;
    };
  }
}

export const MarkdownTable = Extension.create({
  name: "markdownTable",

  addCommands() {
    return {
      insertMarkdownTable:
        (options?: InsertMarkdownTableOptions) =>
        ({ commands }) => {
          return commands.insertContent(`\n${createMarkdownTable(options)}\n`);
        },
    };
  },
});
