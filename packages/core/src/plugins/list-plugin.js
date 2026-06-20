// @ts-check
import { Decoration, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { getListPrefixAt } from "../wysiwym.js";

export class CheckboxWidget extends WidgetType {
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

export class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-wysiwym-bullet";
    span.innerHTML = "•";
    return span;
  }
  eq() { return true; }
}

export class HiddenBulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.style.display = "none";
    return span;
  }
  eq() { return true; }
}

export class ListPlugin extends TravenPlugin {
  name = "list";
  requiredNodes = ["TaskMarker", "ListMark"];
  decorationPriority = 100;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorLine } = ctx;

    syntaxTree(state).iterate({
      enter(node) {
        if (node.name === "TaskMarker") {
          const line = state.doc.lineAt(node.from);
          const isCursorOnLine = cursorLine === line.number;
          if (!isCursorOnLine) {
            const markerText = state.sliceDoc(node.from, node.to);
            const isChecked = /\[[xX]\]/.test(markerText);
            decorations.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({
                widget: new CheckboxWidget(isChecked, node.from)
              })
            });
          }
        } else if (node.name === "ListMark") {
          const line = state.doc.lineAt(node.from);
          const isCursorOnLine = cursorLine === line.number;
          if (!isCursorOnLine) {
            const listInfo = getListPrefixAt(state, line.from);
            if (listInfo && (listInfo.type === "ul" || listInfo.type === "task") && listInfo.from === node.from) {
              const isTask = listInfo.type === "task";
              decorations.push({
                from: node.from,
                to: node.to,
                deco: Decoration.replace({
                  widget: isTask ? new HiddenBulletWidget() : new BulletWidget()
                })
              });
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
