// @ts-check
import { Decoration, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";

class HRWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement("hr");
    hr.className = "cm-wysiwym-hr-widget";
    return hr;
  }
  eq() { return true; }
}

export class HrPlugin extends TravenPlugin {
  name = "hr";
  requiredNodes = ["HorizontalRule"];
  decorationPriority = 100;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorLine } = ctx;

    syntaxTree(state).iterate({
      enter(node) {
        if (node.name === "HorizontalRule") {
          const line = state.doc.lineAt(node.from);
          if (cursorLine !== line.number) {
            decorations.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new HRWidget(), block: true })
            });
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
