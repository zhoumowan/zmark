import {
  type EditorState,
  Plugin,
  PluginKey,
  type Transaction,
} from "prosemirror-state";

export const multilineMathPlugin = new Plugin({
  key: new PluginKey("multilineMath"),
  appendTransaction(
    transactions: readonly Transaction[],
    _oldState: EditorState,
    newState: EditorState,
  ) {
    const docChanges = transactions.some((tr) => tr.docChanged);
    if (!docChanges) return;

    const tr = newState.tr;
    let modified = false;

    const { selection } = newState;
    if (!selection.empty) return;

    const $pos = selection.$from;
    const currentParent = $pos.parent;

    if (
      currentParent.type.name === "paragraph" &&
      currentParent.textContent === "$$"
    ) {
      const latexLines: string[] = [];
      const parentBlock = $pos.node($pos.depth - 1);
      const blockIndex = $pos.index($pos.depth - 1);
      let found = false;
      let startPos = 0;

      for (let i = blockIndex - 1; i >= 0; i--) {
        const node = parentBlock.child(i);
        if (node.type.name === "paragraph" && node.textContent === "$$") {
          found = true;
          let offset = 0;
          for (let j = 0; j < i; j++) {
            offset += parentBlock.child(j).nodeSize;
          }
          startPos = $pos.start($pos.depth - 1) + offset;
          break;
        }
        if (node.type.name === "paragraph") {
          latexLines.unshift(
            node.textBetween(0, node.content.size, "\n", "\n"),
          );
        } else {
          break;
        }
      }

      if (found) {
        const latex = latexLines.join("\n").trim();
        const endPos = $pos.after();

        const blockMathType = newState.schema.nodes.blockMath;
        if (blockMathType) {
          tr.replaceWith(startPos, endPos, blockMathType.create({ latex }));
          modified = true;
        }
      }
    }

    if (modified) return tr;
  },
});
