import { keymap, EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Extension } from "@codemirror/state";
import { setSuppression, clearSuppression } from "./wysiwym.js";

function skipDelimiter(view, direction) {
  const { state } = view;
  const cursor = state.selection.main.head;

  let target = null;
  let suppressRange = null;

  // Inspect syntax tree within a small window around the cursor position
  syntaxTree(state).iterate({
    from: Math.max(0, cursor - 6),
    to: Math.min(state.doc.length, cursor + 6),
    enter(node) {
      // 1. StrongEmphasis (bold, length 2 delimiter)
      if (node.name === "StrongEmphasis") {
        const openEnd = node.from + 2;
        const closeStart = node.to - 2;

        if (direction === "right") {
          // Inside or entering opening delimiter -> skip to content start
          if (cursor >= node.from && cursor < openEnd) {
            target = openEnd;
            suppressRange = { from: node.from, to: node.to };
          }
          // Inside or entering closing delimiter -> skip past node end
          if (cursor >= closeStart && cursor < node.to) {
            target = node.to;
          }
        } else {
          // Inside or entering closing delimiter from right -> skip to content end
          if (cursor > closeStart && cursor <= node.to) {
            target = closeStart;
            suppressRange = { from: node.from, to: node.to };
          }
          // Inside or entering opening delimiter from right -> skip before node
          if (cursor > node.from && cursor <= openEnd) {
            target = node.from;
          }
        }
      }

      // 2. Emphasis (italic, length 1 delimiter)
      if (node.name === "Emphasis") {
        const openEnd = node.from + 1;
        const closeStart = node.to - 1;

        if (direction === "right") {
          if (cursor >= node.from && cursor < openEnd) {
            target = openEnd;
            suppressRange = { from: node.from, to: node.to };
          }
          if (cursor >= closeStart && cursor < node.to) {
            target = node.to;
          }
        } else {
          if (cursor > closeStart && cursor <= node.to) {
            target = closeStart;
            suppressRange = { from: node.from, to: node.to };
          }
          if (cursor > node.from && cursor <= openEnd) {
            target = node.from;
          }
        }
      }

      // 3. InlineCode (length 1 delimiter)
      if (node.name === "InlineCode") {
        const openEnd = node.from + 1;
        const closeStart = node.to - 1;

        if (direction === "right") {
          if (cursor >= node.from && cursor < openEnd) {
            target = openEnd;
          }
          if (cursor >= closeStart && cursor < node.to) {
            target = node.to;
          }
        } else {
          if (cursor > closeStart && cursor <= node.to) {
            target = closeStart;
          }
          if (cursor > node.from && cursor <= openEnd) {
            target = node.from;
          }
        }
      }

      // 4. HeaderMark (heading markers at start of line)
      if (node.name === "HeaderMark") {
        if (direction === "right") {
          if (cursor >= node.from && cursor < node.to) {
            target = node.to;
          }
        } else {
          if (cursor > node.from && cursor <= node.to) {
            target = node.from;
          }
        }
      }
    }
  });

  if (target === null || target === cursor) return false;

  const effects = suppressRange
    ? [setSuppression.of(suppressRange)]
    : [clearSuppression.of(null)];

  view.dispatch({
    selection: { anchor: target },
    effects
  });

  return true;
}

export function delimiterSkipKeymap() {
  return keymap.of([
    {
      key: "ArrowRight",
      run(view) {
        return skipDelimiter(view, "right");
      }
    },
    {
      key: "ArrowLeft",
      run(view) {
        return skipDelimiter(view, "left");
      }
    }
  ]);
}
