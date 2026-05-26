import { keymap, EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
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

      // 5. Highlight (length 2 delimiter)
      if (node.name === "Highlight") {
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

      // 6. HeaderMark (heading markers at start of line)
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

      // 7. Link delimiters [text](url) — skip over collapsed brackets/URL
      if (node.name === "Link") {
        let firstMarkEnd = null;
        let secondMarkStart = null;
        let lastMarkEnd = null;
        let markCount = 0;

        const c = node.node.cursor();
        if (c.firstChild()) {
          do {
            if (c.name === "LinkMark") {
              markCount++;
              if (markCount === 1) firstMarkEnd = c.to;
              if (markCount === 2) secondMarkStart = c.from;
            }
          } while (c.nextSibling());
          lastMarkEnd = node.to; // the ")" is always the last character
        }

        if (firstMarkEnd && secondMarkStart && lastMarkEnd) {
          if (direction === "right") {
            // Entering from left: skip "[" to land on link text
            if (cursor >= node.from && cursor < firstMarkEnd) {
              best = { target: firstMarkEnd, suppressRange: null };
            }
            // Exiting link text right: skip "](url)" to land after ")"
            if (cursor >= secondMarkStart && cursor < lastMarkEnd) {
              best = { target: lastMarkEnd, suppressRange: null };
            }
          } else {
            // Entering from right: skip ")" and URL to land at end of link text
            if (cursor > secondMarkStart && cursor <= lastMarkEnd) {
              best = { target: secondMarkStart, suppressRange: null };
            }
            // Exiting link text left: skip "[" to land before link
            if (cursor > node.from && cursor <= firstMarkEnd) {
              best = { target: node.from, suppressRange: null };
            }
          }
        }
      }

      // 8. Autolink delimiters <url> — skip over collapsed angle brackets
      if (node.name === "Autolink") {
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
      // 9. ImageShortcode delimiters [image ...]
      if (node.name === "ImageShortcode") {
        const openEnd = node.from + 7; // after "[image "
        const closeStart = node.to - 1; // before "]"

        if (direction === "right") {
          if (cursor >= node.from && cursor < openEnd) {
            best = { target: Math.min(node.to, openEnd), suppressRange: null };
          }
          if (cursor >= closeStart && cursor < node.to) {
            best = { target: node.to, suppressRange: null };
          }
        } else {
          if (cursor > closeStart && cursor <= node.to) {
            best = { target: Math.max(node.from, closeStart), suppressRange: null };
          }
          if (cursor > node.from && cursor <= openEnd) {
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
