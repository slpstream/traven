// @ts-check
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { 
  frontmatterLineDeco, 
  frontmatterActiveLineDeco, 
  collapseDeco 
} from "../wysiwym.js";

export class FrontmatterPlugin extends TravenPlugin {
  name = "frontmatter";
  requiredNodes = ["Frontmatter"];
  decorationPriority = 100;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorHead } = ctx;
    const claimedLines = new Set();

    syntaxTree(state).iterate({
      enter(node) {
        if (node.name === "Frontmatter") {
          let frontmatterTo = node.to;
          // Exclude any trailing newline to prevent line merging and incorrect endLine resolution
          if (frontmatterTo > node.from && state.sliceDoc(frontmatterTo - 1, frontmatterTo) === "\n") {
            frontmatterTo--;
            if (frontmatterTo > node.from && state.sliceDoc(frontmatterTo - 1, frontmatterTo) === "\r") {
              frontmatterTo--;
            }
          }

          const isCursorInside = cursorHead > node.from && cursorHead < frontmatterTo;
          const startLine = state.doc.lineAt(node.from).number;
          const endLine = state.doc.lineAt(frontmatterTo).number;

          for (let i = startLine; i <= endLine; i++) {
            // If the cursor is outside, do not decorate the first and last lines (delimiters are collapsed)
            if (!isCursorInside && (i === startLine || i === endLine)) {
              continue;
            }
            if (!claimedLines.has(i)) {
              const line = state.doc.line(i);
              decorations.push({
                from: line.from,
                to: line.from,
                deco: isCursorInside ? frontmatterActiveLineDeco : frontmatterLineDeco
              });
              claimedLines.add(i);
            }
          }

          // If the cursor is outside, collapse the '---' delimiters (first 3 and last 3 characters)
          if (!isCursorInside) {
            decorations.push({ from: node.from, to: node.from + 3, deco: collapseDeco });
            decorations.push({ from: frontmatterTo - 3, to: frontmatterTo, deco: collapseDeco });
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
    return ""; // Strip frontmatter from compiled HTML output
  }
}
