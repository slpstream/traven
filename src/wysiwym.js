import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder, Extension, StateField, StateEffect } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  EditorView,
  WidgetType
} from "@codemirror/view";

// --- Custom Widget Types ---

class HRWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement("hr");
    hr.className = "cm-wysiwym-hr-widget";
    return hr;
  }
  eq() { return true; }
}

// --- Decoration Tokens ---

const collapseDeco = Decoration.replace({});

// Inline styled decorations
const boldDeco = Decoration.mark({ class: "cm-wysiwym-bold" });
const italicDeco = Decoration.mark({ class: "cm-wysiwym-italic" });
const codeDeco = Decoration.mark({ class: "cm-wysiwym-inline-code" });
const strikethroughDeco = Decoration.mark({ class: "cm-wysiwym-strikethrough" });

// Block/Frontmatter styled decorations
const frontmatterLineDeco = Decoration.line({ class: "cm-wysiwym-frontmatter" });
const frontmatterActiveLineDeco = Decoration.line({ class: "cm-wysiwym-frontmatter-active" });

// Heading line styles
const h1LineDeco = Decoration.line({ class: "cm-wysiwym-h1" });
const h2LineDeco = Decoration.line({ class: "cm-wysiwym-h2" });
const h3LineDeco = Decoration.line({ class: "cm-wysiwym-h3" });
const h4LineDeco = Decoration.line({ class: "cm-wysiwym-h4" });
const h5LineDeco = Decoration.line({ class: "cm-wysiwym-h5" });
const h6LineDeco = Decoration.line({ class: "cm-wysiwym-h6" });

// Blockquote line style
const blockquoteLineDeco = Decoration.line({ class: "cm-wysiwym-blockquote" });

// Block code line styles
const codeBlockLineDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line" });
const codeBlockLineFirstDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line cm-wysiwym-codeblock-line-first" });
const codeBlockLineLastDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line cm-wysiwym-codeblock-line-last" });
const codeBlockLineSingleDeco = Decoration.line({ class: "cm-wysiwym-codeblock-line cm-wysiwym-codeblock-line-first cm-wysiwym-codeblock-line-last" });


// --- Suppression StateField ---
export const setSuppression = StateEffect.define();
export const clearSuppression = StateEffect.define();

export const suppressionField = StateField.define({
  create() {
    return null;
  },
  update(value, tr) {
    if (tr.docChanged) return null;
    for (const effect of tr.effects) {
      if (effect.is(setSuppression)) return effect.value;
      if (effect.is(clearSuppression)) return null;
    }
    return value;
  }
});

// --- Helper to get heading decoration ---
function getHeadingDeco(level) {
  switch (level) {
    case 1: return h1LineDeco;
    case 2: return h2LineDeco;
    case 3: return h3LineDeco;
    case 4: return h4LineDeco;
    case 5: return h5LineDeco;
    default: return h6LineDeco;
  }
}

// --- Decoration Builder ---
function buildWysiwymDecorations(state) {
  const collected = [];
  const cursorHead = state.selection.main.head;
  const cursorLine = state.doc.lineAt(cursorHead).number;
  const suppressed = state.field(suppressionField, false) || null;

  // Track lines that already have line decorations applied to avoid duplicate line class definitions
  const decoratedLines = new Set();

  syntaxTree(state).iterate({
    from: 0,
    to: state.doc.length,
      enter(node) {
        // 1. Bold (StrongEmphasis)
        if (node.name === "StrongEmphasis") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const isSuppressed = suppressed && suppressed.from === node.from && suppressed.to === node.to;

          if (!isCursorInside || isSuppressed) {
            // Collapse delimiters (first 2 and last 2 characters)
            collected.push({ from: node.from, to: node.from + 2, deco: collapseDeco });
            collected.push({ from: node.to - 2, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 2, to: node.to - 2, deco: boldDeco });
          }
        }

        // 2. Italic (Emphasis)
        if (node.name === "Emphasis") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const isSuppressed = suppressed && suppressed.from === node.from && suppressed.to === node.to;

          if (!isCursorInside || isSuppressed) {
            // Collapse delimiters (first 1 and last 1 characters)
            collected.push({ from: node.from, to: node.from + 1, deco: collapseDeco });
            collected.push({ from: node.to - 1, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 1, to: node.to - 1, deco: italicDeco });
          }
        }

        // 2.5 Strikethrough (Strikethrough)
        if (node.name === "Strikethrough") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const isSuppressed = suppressed && suppressed.from === node.from && suppressed.to === node.to;

          if (!isCursorInside || isSuppressed) {
            // Collapse delimiters (first 2 and last 2 characters '~~')
            collected.push({ from: node.from, to: node.from + 2, deco: collapseDeco });
            collected.push({ from: node.to - 2, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 2, to: node.to - 2, deco: strikethroughDeco });
          }
        }

        // 3. Inline Code (InlineCode)
        if (node.name === "InlineCode") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          
          if (!isCursorInside) {
            // Collapse delimiters (backticks)
            collected.push({ from: node.from, to: node.from + 1, deco: collapseDeco });
            collected.push({ from: node.to - 1, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 1, to: node.to - 1, deco: codeDeco });
          }
        }

        // 4. Headings (ATXHeading1-6, SetextHeading1-2, etc.)
        const headingMatch = node.name.match(/Heading([1-6])$/);
        if (headingMatch) {
          const level = parseInt(headingMatch[1]) || 1;
          const line = state.doc.lineAt(node.from);
          if (!decoratedLines.has(line.number)) {
            collected.push({ from: line.from, to: line.from, deco: getHeadingDeco(level) });
            decoratedLines.add(line.number);
          }
        }

        // 5. HeaderMark (e.g. '# ', '## ') - inside ATXHeading
        if (node.name === "HeaderMark") {
          const parent = node.node.parent;
          if (parent) {
            const parentLine = state.doc.lineAt(parent.from);
            const isCursorOnLine = cursorLine === parentLine.number;
            if (!isCursorOnLine) {
              let collapseTo = node.to;
              // Also collapse any space immediately following the hashes
              while (collapseTo < state.doc.length && state.sliceDoc(collapseTo, collapseTo + 1) === " ") {
                collapseTo++;
              }
              collected.push({ from: node.from, to: collapseTo, deco: collapseDeco });
            }
          }
        }

        // 6. Blockquote
        if (node.name === "Blockquote") {
          const startLine = state.doc.lineAt(node.from).number;
          const endLine = state.doc.lineAt(node.to).number;
          for (let i = startLine; i <= endLine; i++) {
            if (!decoratedLines.has(i)) {
              const line = state.doc.line(i);
              collected.push({ from: line.from, to: line.from, deco: blockquoteLineDeco });
              decoratedLines.add(i);
            }
          }
        }

        // 7. QuoteMark ('>') inside Blockquote
        if (node.name === "QuoteMark") {
          const line = state.doc.lineAt(node.from);
          const isCursorOnLine = cursorLine === line.number;
          if (!isCursorOnLine) {
            collected.push({ from: node.from, to: node.to, deco: collapseDeco });
          }
        }

        // 8. Horizontal Rule
        if (node.name === "HorizontalRule") {
          const line = state.doc.lineAt(node.from);
          const isCursorOnLine = cursorLine === line.number;
          if (!isCursorOnLine) {
            // Replace with custom HR Widget
            collected.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new HRWidget(), block: true })
            });
          }
        }

        // 9. YAML Frontmatter
        if (node.name.toLowerCase() === "frontmatter" || node.name === "yaml-frontmatter") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const startLine = state.doc.lineAt(node.from).number;
          const endLine = state.doc.lineAt(node.to).number;

          for (let i = startLine; i <= endLine; i++) {
            // If the cursor is outside, do not decorate the first and last lines (delimiters are collapsed)
            if (!isCursorInside && (i === startLine || i === endLine)) {
              continue;
            }
            if (!decoratedLines.has(i)) {
              const line = state.doc.line(i);
              collected.push({
                from: line.from,
                to: line.from,
                deco: isCursorInside ? frontmatterActiveLineDeco : frontmatterLineDeco
              });
              decoratedLines.add(i);
            }
          }

          // If the cursor is outside, collapse the '---' delimiters (first 3 and last 3 characters)
          if (!isCursorInside) {
            collected.push({ from: node.from, to: node.from + 3, deco: collapseDeco });
            collected.push({ from: node.to - 3, to: node.to, deco: collapseDeco });
          }
        }

        // 10. Fenced Code / Code Block
        if (node.name === "FencedCode" || node.name === "CodeBlock") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const startLine = state.doc.lineAt(node.from).number;
          const endLine = state.doc.lineAt(node.to).number;

          for (let i = startLine; i <= endLine; i++) {
            // If the cursor is outside, do not decorate the first and last lines (fences are collapsed)
            if (!isCursorInside && node.name === "FencedCode" && (i === startLine || i === endLine)) {
              continue;
            }
            if (!decoratedLines.has(i)) {
              const line = state.doc.line(i);
              let deco = codeBlockLineDeco;
              
              if (node.name === "FencedCode") {
                const contentStartLine = startLine + 1;
                const contentEndLine = endLine - 1;
                
                if (contentStartLine > contentEndLine) {
                  continue;
                }
                
                if (isCursorInside) {
                  if (startLine === endLine) {
                    deco = codeBlockLineSingleDeco;
                  } else if (i === startLine) {
                    deco = codeBlockLineFirstDeco;
                  } else if (i === endLine) {
                    deco = codeBlockLineLastDeco;
                  }
                } else {
                  if (contentStartLine === contentEndLine) {
                    deco = codeBlockLineSingleDeco;
                  } else if (i === contentStartLine) {
                    deco = codeBlockLineFirstDeco;
                  } else if (i === contentEndLine) {
                    deco = codeBlockLineLastDeco;
                  }
                }
              } else {
                if (startLine === endLine) {
                  deco = codeBlockLineSingleDeco;
                } else if (i === startLine) {
                  deco = codeBlockLineFirstDeco;
                } else if (i === endLine) {
                  deco = codeBlockLineLastDeco;
                }
              }
              
              collected.push({
                from: line.from,
                to: line.from,
                deco: deco
              });
              decoratedLines.add(i);
            }
          }

          if (!isCursorInside && node.name === "FencedCode") {
            const startLineObj = state.doc.line(startLine);
            const endLineObj = state.doc.line(endLine);
            collected.push({ from: startLineObj.from, to: startLineObj.to, deco: collapseDeco });
            collected.push({ from: endLineObj.from, to: endLineObj.to, deco: collapseDeco });
          }
        }
      }
    });

  // --- Strict RangeSetBuilder Sorting (collect-sort-build) ---
  // 1. Sort by start position ascending.
  // 2. If start positions are equal, sort by decoration startSide ascending (critical to place line decorations first).
  // 3. If startSide is also equal, sort by end position descending (larger range/outer node first).
  collected.sort((a, b) => {
    if (a.from !== b.from) {
      return a.from - b.from;
    }
    const aSide = a.deco.startSide || 0;
    const bSide = b.deco.startSide || 0;
    if (aSide !== bSide) {
      return aSide - bSide;
    }
    return b.to - a.to;
  });

  const builder = new RangeSetBuilder();
  for (const { from, to, deco } of collected) {
    // RangeSetBuilder requires strict document ordering.
    // Double check that we don't try to add past ranges if there are any overlaps
    builder.add(from, to, deco);
  }

  return builder.finish();
}

export const wysiwymField = StateField.define({
  create(state) {
    return buildWysiwymDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return buildWysiwymDecorations(tr.state);
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f)
});

export const wysiwymPlugin = () => {
  return [
    suppressionField,
    wysiwymField
  ];
};
