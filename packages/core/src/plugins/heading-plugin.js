// @ts-check
import { Decoration } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { collapseDeco } from "../wysiwym.js";

const HEADING_TYPES = ["ATXHeading1", "ATXHeading2", "ATXHeading3", "ATXHeading4", "ATXHeading5", "ATXHeading6"];

const headingLineDecos = {
  1: Decoration.line({ class: "cm-wysiwym-h1" }),
  2: Decoration.line({ class: "cm-wysiwym-h2" }),
  3: Decoration.line({ class: "cm-wysiwym-h3" }),
  4: Decoration.line({ class: "cm-wysiwym-h4" }),
  5: Decoration.line({ class: "cm-wysiwym-h5" }),
  6: Decoration.line({ class: "cm-wysiwym-h6" }),
};

export class HeadingPlugin extends TravenPlugin {
  name = "heading";
  requiredNodes = HEADING_TYPES.concat(["HeaderMark"]);
  decorationPriority = 100;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorLine } = ctx;
    const claimedLines = new Set();

    syntaxTree(state).iterate({
      enter(node) {
        // 1. Heading line decoration
        const m = node.name.match(/Heading([1-6])$/);
        if (m) {
          const level = parseInt(m[1], 10) || 1;
          const line = state.doc.lineAt(node.from);
          if (!claimedLines.has(line.number)) {
            decorations.push({ from: line.from, to: line.from, deco: headingLineDecos[level] });
            claimedLines.add(line.number);
          }
          return;
        }

        // 2. HeaderMark collapse
        if (node.name === "HeaderMark") {
          const parent = node.node.parent;
          if (!parent) return;
          const parentLine = state.doc.lineAt(parent.from);
          if (cursorLine === parentLine.number) return;
          
          let collapseTo = node.to;
          while (collapseTo < state.doc.length && state.sliceDoc(collapseTo, collapseTo + 1) === " ") {
            collapseTo++;
          }
          decorations.push({ from: node.from, to: collapseTo, deco: collapseDeco });
        }
      },
    });
  }

  /**
   * @param {import("@lezer/common").SyntaxNode} node 
   * @param {string} _childrenHtml 
   * @param {any} _ctx 
   */
  renderToHTML(node, _childrenHtml, _ctx) {
    if (node.name === "HeaderMark") return "";
    const m = node.name.match(/Heading([1-6])$/);
    if (!m) return null;
    // Default renderer already does <hX>${childrenHtml}</hX>
    return null;
  }
}
