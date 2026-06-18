// @ts-check
import { Decoration, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { tableRowLineDeco, renderInlineMarkdown } from "../wysiwym.js";
import { parseMarkdownTable, openTableModal } from "../toolbar/modal.js";
import { viewToEditor } from "../bridge.js";

export class TableWidget extends WidgetType {
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
      const target = /** @type {Element} */ (e.target);
      if (target.closest("a")) {
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
    return other instanceof TableWidget && this.tableText === other.tableText && this.tableFrom === other.tableFrom;
  }

  ignoreEvent() { return false; }
}

export class TablePlugin extends TravenPlugin {
  name = "table";
  requiredNodes = ["Table"];
  decorationPriority = 100;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorHead } = ctx;
    const claimedLines = new Set();

    syntaxTree(state).iterate({
      enter(node) {
        if (node.name === "Table") {
          const isCursorInside = cursorHead > node.from && cursorHead < node.to;

          if (!isCursorInside) {
            // Replace the entire table with a rendered HTML table widget
            const tableText = state.doc.sliceString(node.from, node.to);
            decorations.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new TableWidget(tableText, node.from), block: true })
            });
          } else {
            // When editing: apply subtle background tint to table lines
            const startLine = state.doc.lineAt(node.from).number;
            const endLine = state.doc.lineAt(node.to).number;
            for (let i = startLine; i <= endLine; i++) {
              if (!claimedLines.has(i)) {
                const line = state.doc.line(i);
                decorations.push({ from: line.from, to: line.from, deco: tableRowLineDeco });
                claimedLines.add(i);
              }
            }
          }
        }
      }
    });
  }

  /**
   * @param {import("@lezer/common").SyntaxNode} _node 
   * @param {string} _childrenHtml 
   * @param {any} _ctx 
   */
  renderToHTML(_node, _childrenHtml, _ctx) {
    return null; // Fall through to default renderer
  }
}
