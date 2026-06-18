// @ts-check
import { Decoration } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { collapseDeco, blockquoteLineDeco } from "../wysiwym.js";

export class QuotePlugin extends TravenPlugin {
  name = "quote";
  requiredNodes = ["Blockquote", "QuoteMark"];
  decorationPriority = 100;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorLine } = ctx;
    const claimedLines = new Set();

    syntaxTree(state).iterate({
      enter(node) {
        if (node.name === "Blockquote") {
          const startLine = state.doc.lineAt(node.from).number;
          const endLine = state.doc.lineAt(node.to).number;
          for (let i = startLine; i <= endLine; i++) {
            if (!claimedLines.has(i)) {
              const line = state.doc.line(i);
              decorations.push({ from: line.from, to: line.from, deco: blockquoteLineDeco });
              claimedLines.add(i);
            }
          }
        }

        if (node.name === "QuoteMark") {
          const line = state.doc.lineAt(node.from);
          if (cursorLine !== line.number) {
            decorations.push({ from: node.from, to: node.to, deco: collapseDeco });
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
