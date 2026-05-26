import { keymap, EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Extension } from "@codemirror/state";
import { setSuppression, clearSuppression } from "./wysiwym.js";

/**
 * Examines the syntax tree around `cursor` and returns the best skip target
 * for a single delimiter boundary, plus an optional suppress range if the
 * cursor is entering (not exiting) a node.
 *
 * @param {EditorState} state
 * @param {number} cursor
 * @param {"left"|"right"} direction
 * @returns {{ target: number, suppressRange: {from:number,to:number}|null } | null}
 */
function findSkipTarget(state, cursor, direction) {
  let best = null;

  syntaxTree(state).iterate({
    from: Math.max(0, cursor - 6),
    to: Math.min(state.doc.length, cursor + 6),
    enter(node) {
      // 1. StrongEmphasis (bold, length 2 delimiter)
      if (node.name === "StrongEmphasis") {
        const openEnd = node.from + 2;
        const closeStart = node.to - 2;

        if (direction === "right") {
          if (cursor >= node.from && cursor < openEnd) {
            best = { target: openEnd, suppressRange: { from: node.from, to: node.to } };
          }
          if (cursor >= closeStart && cursor < node.to) {
            best = { target: node.to, suppressRange: null };
          }
        } else {
          if (cursor > closeStart && cursor <= node.to) {
            best = { target: closeStart, suppressRange: { from: node.from, to: node.to } };
          }
          if (cursor > node.from && cursor <= openEnd) {
            best = { target: node.from, suppressRange: null };
          }
        }
      }

      // 2. Emphasis (italic, length 1 delimiter)
      if (node.name === "Emphasis") {
        const openEnd = node.from + 1;
        const closeStart = node.to - 1;

        if (direction === "right") {
          if (cursor >= node.from && cursor < openEnd) {
            best = { target: openEnd, suppressRange: { from: node.from, to: node.to } };
          }
          if (cursor >= closeStart && cursor < node.to) {
            best = { target: node.to, suppressRange: null };
          }
        } else {
          if (cursor > closeStart && cursor <= node.to) {
            best = { target: closeStart, suppressRange: { from: node.from, to: node.to } };
          }
          if (cursor > node.from && cursor <= openEnd) {
            best = { target: node.from, suppressRange: null };
          }
        }
      }

      // 3. InlineCode (length 1 delimiter)
      if (node.name === "InlineCode") {
        const openEnd = node.from + 1;
        const closeStart = node.to - 1;

        if (direction === "right") {
          if (cursor >= node.from && cursor < openEnd) {
            best = { target: openEnd, suppressRange: null };
          }
          if (cursor >= closeStart && cursor < node.to) {
            best = { target: node.to, suppressRange: null };
          }
        } else {
          if (cursor > closeStart && cursor <= node.to) {
            best = { target: closeStart, suppressRange: null };
          }
          if (cursor > node.from && cursor <= openEnd) {
            best = { target: node.from, suppressRange: null };
          }
        }
      }

      // 4. Strikethrough (length 2 delimiter)
      if (node.name === "Strikethrough") {
        const openEnd = node.from + 2;
        const closeStart = node.to - 2;

        if (direction === "right") {
          if (cursor >= node.from && cursor < openEnd) {
            best = { target: openEnd, suppressRange: { from: node.from, to: node.to } };
          }
          if (cursor >= closeStart && cursor < node.to) {
            best = { target: node.to, suppressRange: null };
          }
        } else {
          if (cursor > closeStart && cursor <= node.to) {
            best = { target: closeStart, suppressRange: { from: node.from, to: node.to } };
          }
          if (cursor > node.from && cursor <= openEnd) {
            best = { target: node.from, suppressRange: null };
          }
        }
      }

      // 5. HeaderMark (heading markers at start of line)
      if (node.name === "HeaderMark") {
        if (direction === "right") {
          if (cursor >= node.from && cursor < node.to) {
            best = { target: node.to, suppressRange: null };
          }
        } else {
          if (cursor > node.from && cursor <= node.to) {
            best = { target: node.from, suppressRange: null };
          }
        }
      }
    }
  });

  return best;
}

/**
 * Multi-jump delimiter skip: loops to traverse multiple adjacent collapsed
 * delimiter boundaries in a single arrow keypress (handles nested syntax
 * like **_text_**, ~~**text**~~, etc.)
 */
function skipDelimiter(view, direction) {
  const { state } = view;
  const originalCursor = state.selection.main.head;
  let cursor = originalCursor;
  const suppressRanges = [];

  // Safety cap: deepest realistic nesting is ~3-4 levels
  const maxIterations = 5;

  for (let i = 0; i < maxIterations; i++) {
    const result = findSkipTarget(state, cursor, direction);
    if (!result || result.target === cursor) break;

    cursor = result.target;
    if (result.suppressRange) {
      suppressRanges.push(result.suppressRange);
    }
  }

  if (cursor === originalCursor) return false;

  const effects = suppressRanges.length > 0
    ? [setSuppression.of(suppressRanges)]
    : [clearSuppression.of(null)];

  view.dispatch({
    selection: { anchor: cursor },
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
