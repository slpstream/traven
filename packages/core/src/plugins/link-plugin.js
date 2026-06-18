// @ts-check
import { Decoration } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { collapseDeco, linkDeco } from "../wysiwym.js";

export class LinkPlugin extends TravenPlugin {
  name = "link";
  requiredNodes = ["Link", "Autolink", "URL"];
  decorationPriority = 100;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorHead, suppressedFigureRanges } = ctx;

    syntaxTree(state).iterate({
      enter(node) {
        // Skip processing any AST nodes inside replaced figures
        if (suppressedFigureRanges.some(r => node.from >= r.from && node.to <= r.to)) {
          return false;
        }

        if (node.name === "Link") {
          const isCursorInside = cursorHead > node.from && cursorHead < node.to;

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
                  decorations.push({ from: c.from, to: c.to, deco: collapseDeco });
                }
                if (c.name === "URL") {
                  decorations.push({ from: c.from, to: c.to, deco: collapseDeco });
                }
                if (c.name === "LinkTitle") {
                  // Extract title text (strip surrounding quotes)
                  const raw = state.sliceDoc(c.from, c.to);
                  linkTitle = raw.replace(/^["'(]|["')]$/g, "");
                  decorations.push({ from: c.from, to: c.to, deco: collapseDeco });
                }
              } while (c.nextSibling());
            }

            // Style the visible link text (between "[" and "]")
            if (firstMarkEnd !== null && secondMarkStart !== null && secondMarkStart > firstMarkEnd) {
              const deco = linkTitle
                ? Decoration.mark({ class: "cm-wysiwym-link-anchor", attributes: { title: linkTitle } })
                : linkDeco;
              decorations.push({ from: firstMarkEnd, to: secondMarkStart, deco });
            }
          }
        } else if (node.name === "Autolink") {
          const isCursorInside = cursorHead > node.from && cursorHead < node.to;

          if (!isCursorInside) {
            // Collapse the < and > angle brackets (first and last characters)
            decorations.push({ from: node.from, to: node.from + 1, deco: collapseDeco });
            decorations.push({ from: node.to - 1, to: node.to, deco: collapseDeco });
            // Style the URL text between the brackets
            decorations.push({ from: node.from + 1, to: node.to - 1, deco: linkDeco });
          }
        } else if (node.name === "URL") {
          const parent = node.node.parent;
          const isNaked = parent && parent.name !== "Link" && parent.name !== "Image" && parent.name !== "Autolink";
          if (isNaked) {
            const isCursorInside = cursorHead > node.from && cursorHead < node.to;
            if (!isCursorInside) {
              decorations.push({ from: node.from, to: node.to, deco: linkDeco });
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
