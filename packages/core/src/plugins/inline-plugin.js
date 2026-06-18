// @ts-check
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { collapseDeco, boldDeco, italicDeco, strikethroughDeco, highlightDeco, codeDeco } from "../wysiwym.js";

export class InlinePlugin extends TravenPlugin {
  name = "inline";
  requiredNodes = ["StrongEmphasis", "Emphasis", "Strikethrough", "Highlight", "InlineCode"];
  decorationPriority = 100;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorHead, suppressed, suppressedFigureRanges } = ctx;

    syntaxTree(state).iterate({
      enter(node) {
        // Skip processing any AST nodes inside replaced figures
        if (suppressedFigureRanges.some(r => node.from >= r.from && node.to <= r.to)) {
          return false;
        }

        const isCursorInside = cursorHead > node.from && cursorHead < node.to;

        if (node.name === "StrongEmphasis" || node.name === "Strikethrough" || node.name === "Highlight") {
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);
          if (!isCursorInside || isSuppressed) {
            decorations.push({ from: node.from, to: node.from + 2, deco: collapseDeco });
            decorations.push({ from: node.to - 2, to: node.to, deco: collapseDeco });
            const deco = node.name === "StrongEmphasis" ? boldDeco : (node.name === "Strikethrough" ? strikethroughDeco : highlightDeco);
            decorations.push({ from: node.from + 2, to: node.to - 2, deco });
          }
        } else if (node.name === "Emphasis") {
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);
          if (!isCursorInside || isSuppressed) {
            decorations.push({ from: node.from, to: node.from + 1, deco: collapseDeco });
            decorations.push({ from: node.to - 1, to: node.to, deco: collapseDeco });
            decorations.push({ from: node.from + 1, to: node.to - 1, deco: italicDeco });
          }
        } else if (node.name === "InlineCode") {
          // InlineCode has no isSuppressed check by design
          if (!isCursorInside) {
            decorations.push({ from: node.from, to: node.from + 1, deco: collapseDeco });
            decorations.push({ from: node.to - 1, to: node.to, deco: collapseDeco });
            decorations.push({ from: node.from + 1, to: node.to - 1, deco: codeDeco });
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
