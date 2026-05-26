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
import { viewToEditor } from "./bridge.js";
import { parseMarkdownTable, openTableModal } from "./toolbar/modal.js";

// --- Custom Widget Types ---

class HRWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement("hr");
    hr.className = "cm-wysiwym-hr-widget";
    return hr;
  }
  eq() { return true; }
}

class CheckboxWidget extends WidgetType {
  constructor(checked, pos) {
    super();
    this.checked = checked;
    this.pos = pos;
  }

  toDOM(view) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.checked;
    input.className = "cm-wysiwym-checkbox";
    input.setAttribute("aria-label", this.checked ? "Completed task" : "Incomplete task");

    input.addEventListener("mousedown", (e) => {
      e.preventDefault();
      if (view.state.readOnly) return;

      const marker = view.state.sliceDoc(this.pos, this.pos + 3);
      const isChecked = /[xX]/.test(marker[1]);
      const replacement = isChecked ? "[ ]" : "[x]";

      view.dispatch({
        changes: { from: this.pos, to: this.pos + 3, insert: replacement }
      });
    });

    return input;
  }

  eq(other) {
    return this.checked === other.checked;
  }

  ignoreEvent() { return false; }
}

class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-wysiwym-bullet";
    span.innerHTML = "•";
    return span;
  }
  eq() { return true; }
}

class TableWidget extends WidgetType {
  constructor(tableText, tableFrom) {
    super();
    this.tableText = tableText;
    this.tableFrom = tableFrom;
  }

  toDOM(view) {
    const container = document.createElement("div");
    container.className = "cm-wysiwym-table-widget";

    // Use the shared parser to get structured data
    const parsed = parseMarkdownTable(this.tableText);
    if (!parsed) {
      container.textContent = this.tableText;
      return container;
    }

    const table = document.createElement("table");

    // Pure function helper to convert basic inline Markdown to HTML inside cells
    const renderInlineMarkdown = (text) => {
      if (!text) return "";
      // Escape HTML characters to prevent XSS
      let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Convert inline elements (images, links, bold, italic, highlight, code)
      html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; display: inline-block;">');
      html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
      html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
      html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
      html = html.replace(/_(.*?)_/g, "<em>$1</em>");
      html = html.replace(/==(.*?)==/g, '<span class="cm-wysiwym-highlight">$1</span>');
      html = html.replace(/`(.*?)`/g, "<code>$1</code>");

      return html;
    };


    // Header
    const thead = document.createElement("thead");
    const headerTr = document.createElement("tr");
    parsed.headers.forEach((h, colIdx) => {
      const th = document.createElement("th");
      th.innerHTML = renderInlineMarkdown(h);
      if (parsed.alignments && parsed.alignments[colIdx]) {
        th.style.textAlign = parsed.alignments[colIdx];
      }
      headerTr.appendChild(th);
    });
    thead.appendChild(headerTr);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    parsed.rows.forEach((row) => {
      const tr = document.createElement("tr");
      for (let j = 0; j < parsed.headers.length; j++) {
        const td = document.createElement("td");
        td.innerHTML = renderInlineMarkdown(row[j] || "");
        if (parsed.alignments && parsed.alignments[j]) {
          td.style.textAlign = parsed.alignments[j];
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    // Click handler: open the Table Editor Modal
    const tableFrom = this.tableFrom;
    const tableTo = this.tableFrom + this.tableText.length;
    const tableText = this.tableText;
    container.addEventListener("mousedown", (e) => {
      // If user clicked a link, let the browser open it
      if (e.target.closest("a")) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const editor = viewToEditor.get(view);
      if (editor) {
        openTableModal({
          editor,
          tableData: parseMarkdownTable(tableText),
          docFrom: tableFrom,
          docTo: tableTo
        });
      }
    });

    return container;
  }

  eq(other) {
    return this.tableText === other.tableText && this.tableFrom === other.tableFrom;
  }

  ignoreEvent() { return false; }
}

// --- Decoration Tokens ---

const collapseDeco = Decoration.replace({});

// Inline styled decorations
const boldDeco = Decoration.mark({ class: "cm-wysiwym-bold" });
const italicDeco = Decoration.mark({ class: "cm-wysiwym-italic" });
const codeDeco = Decoration.mark({ class: "cm-wysiwym-inline-code" });
const strikethroughDeco = Decoration.mark({ class: "cm-wysiwym-strikethrough" });
const highlightDeco = Decoration.mark({ class: "cm-wysiwym-highlight" });
const linkDeco = Decoration.mark({ class: "cm-wysiwym-link-anchor" });

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

// Table line styles
const tableRowLineDeco = Decoration.line({ class: "cm-wysiwym-table-row" });


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
      if (effect.is(setSuppression)) {
        // Normalize to array for backwards compatibility
        const val = effect.value;
        return Array.isArray(val) ? val : [val];
      }
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
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

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
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

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
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

          if (!isCursorInside || isSuppressed) {
            // Collapse delimiters (first 2 and last 2 characters '~~')
            collected.push({ from: node.from, to: node.from + 2, deco: collapseDeco });
            collected.push({ from: node.to - 2, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 2, to: node.to - 2, deco: strikethroughDeco });
          }
        }

        // 2.6 Highlight (Highlight)
        if (node.name === "Highlight") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

          if (!isCursorInside || isSuppressed) {
            // Collapse delimiters (first 2 and last 2 characters '==')
            collected.push({ from: node.from, to: node.from + 2, deco: collapseDeco });
            collected.push({ from: node.to - 2, to: node.to, deco: collapseDeco });
            // Style content
            collected.push({ from: node.from + 2, to: node.to - 2, deco: highlightDeco });
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

        // 3.5. Links [text](url) / [text](url "title")
        if (node.name === "Link") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;

          if (!isCursorInside) {
            // Walk child nodes to find content boundaries, collapse markers/URL/title
            const c = node.node.cursor();
            let firstMarkEnd = null;
            let secondMarkStart = null;
            let linkTitle = null;
            let markCount = 0;

            if (c.firstChild()) {
              do {
                if (c.name === "LinkMark") {
                  markCount++;
                  if (markCount === 1) firstMarkEnd = c.to;   // end of "["
                  if (markCount === 2) secondMarkStart = c.from; // start of "]"
                  // Collapse all bracket/paren markers
                  collected.push({ from: c.from, to: c.to, deco: collapseDeco });
                }
                if (c.name === "URL") {
                  collected.push({ from: c.from, to: c.to, deco: collapseDeco });
                }
                if (c.name === "LinkTitle") {
                  // Extract title text (strip surrounding quotes)
                  const raw = state.sliceDoc(c.from, c.to);
                  linkTitle = raw.replace(/^["'(]|["')]$/g, "");
                  collected.push({ from: c.from, to: c.to, deco: collapseDeco });
                }
              } while (c.nextSibling());
            }

            // Style the visible link text (between "[" and "]")
            if (firstMarkEnd !== null && secondMarkStart !== null && secondMarkStart > firstMarkEnd) {
              const deco = linkTitle
                ? Decoration.mark({ class: "cm-wysiwym-link-anchor", attributes: { title: linkTitle } })
                : linkDeco;
              collected.push({ from: firstMarkEnd, to: secondMarkStart, deco });
            }
          }
        }

        // 3.6. Autolinks <https://url>
        if (node.name === "Autolink") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;

          if (!isCursorInside) {
            // Collapse the < and > angle brackets (first and last characters)
            collected.push({ from: node.from, to: node.from + 1, deco: collapseDeco });
            collected.push({ from: node.to - 1, to: node.to, deco: collapseDeco });
            // Style the URL text between the brackets
            collected.push({ from: node.from + 1, to: node.to - 1, deco: linkDeco });
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

        // 8.5. Task List Checkboxes (interactive)
        if (node.name === "TaskMarker") {
          const line = state.doc.lineAt(node.from);
          const isCursorOnLine = cursorLine === line.number;
          if (!isCursorOnLine) {
            const markerText = state.sliceDoc(node.from, node.to);
            const isChecked = /\[[xX]\]/.test(markerText);
            collected.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({
                widget: new CheckboxWidget(isChecked, node.from)
              })
            });
          }
        }

        // 8.6. Bullet List Markers (replace '-' / '*' / '+' with a bullet point when cursor is off the line)
        if (node.name === "ListMark") {
          const line = state.doc.lineAt(node.from);
          const isCursorOnLine = cursorLine === line.number;
          if (!isCursorOnLine) {
            const listInfo = getListPrefixAt(state, line.from);
            if (listInfo && listInfo.type === "ul" && listInfo.from === node.from) {
              collected.push({
                from: node.from,
                to: node.to,
                deco: Decoration.replace({
                  widget: new BulletWidget()
                })
              });
            }
          }
        }

        // 9. YAML Frontmatter
        if (node.name === "Frontmatter") {
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

        // 9.5 GFM Table
        if (node.name === "Table") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;

          if (!isCursorInside) {
            // Replace the entire table with a rendered HTML table widget
            const tableText = state.doc.sliceString(node.from, node.to);
            collected.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new TableWidget(tableText, node.from), block: true })
            });
          } else {
            // When editing: apply subtle background tint to table lines
            const startLine = state.doc.lineAt(node.from).number;
            const endLine = state.doc.lineAt(node.to).number;
            for (let i = startLine; i <= endLine; i++) {
              if (!decoratedLines.has(i)) {
                const line = state.doc.line(i);
                collected.push({ from: line.from, to: line.from, deco: tableRowLineDeco });
                decoratedLines.add(i);
              }
            }
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

// --- Ctrl/Cmd+Click handler for opening links ---
const linkClickHandler = EditorView.domEventHandlers({
  click(event, view) {
    if (!event.ctrlKey && !event.metaKey) return false;

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) return false;

    let linkUrl = null;
    syntaxTree(view.state).iterate({
      from: pos,
      to: pos,
      enter(node) {
        if (node.name === "Link") {
          const c = node.node.cursor();
          if (c.firstChild()) {
            do {
              if (c.name === "URL") {
                linkUrl = view.state.sliceDoc(c.from, c.to);
                break;
              }
            } while (c.nextSibling());
          }
        }
        if (node.name === "Autolink") {
          // Autolink URL is the text between < and >
          linkUrl = view.state.sliceDoc(node.from + 1, node.to - 1);
        }
      }
    });

    if (linkUrl) {
      window.open(linkUrl, "_blank", "noopener,noreferrer");
      event.preventDefault();
      return true;
    }
    return false;
  }
});

export const wysiwymPlugin = () => {
  return [
    suppressionField,
    wysiwymField,
    linkClickHandler
  ];
};

export function getListPrefixAt(state, pos) {
  const line = state.doc.lineAt(pos);
  const leadingMatch = line.text.match(/^([\s>]*)/);
  const leadLen = leadingMatch ? leadingMatch[1].length : 0;
  const startPos = line.from + leadLen;

  if (startPos > line.to) return null;

  const tree = syntaxTree(state);
  let node = tree.resolveInner(startPos, 1);
  
  // Walk up to find a ListItem node starting on this line
  let listItemNode = null;
  while (node) {
    if (node.name === "ListItem") {
      const itemLine = state.doc.lineAt(node.from).number;
      if (itemLine === line.number) {
        listItemNode = node;
        break;
      }
    }
    node = node.parent;
  }

  if (!listItemNode) {
    return null;
  }

  // Now let's extract details from the ListItem node
  let listMarkNode = null;
  let taskMarkerNode = null;
  
  const c = listItemNode.cursor();
  while (c.next() && c.from < listItemNode.to) {
    if (c.name === "ListMark" && c.from === startPos) {
      listMarkNode = c.node;
    } else if (c.name === "TaskMarker") {
      if (listMarkNode && c.from === listMarkNode.to + 1) {
        taskMarkerNode = c.node;
      }
    }
  }

  if (!listMarkNode || listMarkNode.from !== startPos) {
    return null;
  }

  // Determine type
  let type = null;
  const parentName = listItemNode.parent ? listItemNode.parent.name : "";
  if (taskMarkerNode) {
    type = "task";
  } else if (parentName === "BulletList") {
    type = "ul";
  } else if (parentName === "OrderedList") {
    type = "ol";
  }

  if (!type) return null;

  // Calculate prefix length (from startPos to end of list marker / task marker + trailing space)
  let endPos = startPos;
  if (taskMarkerNode) {
    endPos = taskMarkerNode.to;
  } else if (listMarkNode) {
    endPos = listMarkNode.to;
  } else {
    return null;
  }

  // Consume one trailing space if present
  if (endPos < line.to && state.sliceDoc(endPos, endPos + 1) === " ") {
    endPos++;
  }

  const prefixLen = endPos - startPos;

  return {
    type,
    from: startPos,
    prefixLen,
    taskMarker: taskMarkerNode ? { from: taskMarkerNode.from, to: taskMarkerNode.to } : null
  };
}

export function getListStrippingRanges(state, from, to) {
  const startLineNum = state.doc.lineAt(from).number;
  const endLineNum = state.doc.lineAt(to).number;
  const ranges = [];

  for (let l = startLineNum; l <= endLineNum; l++) {
    const line = state.doc.line(l);
    const listInfo = getListPrefixAt(state, line.from);
    if (listInfo) {
      const prefixEnd = listInfo.from + listInfo.prefixLen;
      
      const bqMatch = line.text.match(/^(\s*>\s*)+/);
      const indentStart = line.from + (bqMatch ? bqMatch[0].length : 0);
      
      const stripFrom = Math.max(indentStart, from);
      const stripTo = Math.min(prefixEnd, to);
      if (stripTo > stripFrom) {
        ranges.push({
          from: stripFrom,
          to: stripTo
        });
      }
    }
  }
  return ranges;
}

export function isInCodeBlock(state, pos) {
  const tree = syntaxTree(state);
  let node = tree.resolveInner(pos, 1);
  while (node) {
    if (
      node.name === "FencedCode" ||
      node.name === "CodeBlock" ||
      node.name === "CodeText" ||
      node.name === "HTMLBlock"
    ) {
      return true;
    }
    node = node.parent;
  }
  return false;
}
