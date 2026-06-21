// @ts-check
import { Decoration } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { collapseDeco, blockquoteLineDeco, alertNoteLineDeco, alertTipLineDeco, alertImportantLineDeco, alertWarningLineDeco, alertCautionLineDeco } from "../wysiwym.js";

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

          const firstLine = state.doc.line(startLine);
          const alertMatch = firstLine.text.match(/^\s*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|DANGER)\]/i);

          let deco = blockquoteLineDeco;
          let isEmptyAfterMarker = false;
          let isCursorInAdmonition = false;

          if (alertMatch) {
            let type = alertMatch[1].toUpperCase();
            if (type === "INFO") type = "NOTE";
            if (type === "DANGER") type = "CAUTION";

            switch (type) {
              case "NOTE":
                deco = alertNoteLineDeco;
                break;
              case "TIP":
                deco = alertTipLineDeco;
                break;
              case "IMPORTANT":
                deco = alertImportantLineDeco;
                break;
              case "WARNING":
                deco = alertWarningLineDeco;
                break;
              case "CAUTION":
                deco = alertCautionLineDeco;
                break;
            }

            isEmptyAfterMarker = firstLine.text.replace(/^\s*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|DANGER)\]/i, "").trim() === "";
            isCursorInAdmonition = cursorLine >= startLine && cursorLine <= endLine;

            // Collapse first line / marker if cursor is NOT in the admonition
            if (!isCursorInAdmonition) {
              if (isEmptyAfterMarker) {
                // Collapse the entire first line (including trailing newline if not end of doc)
                const endPos = startLine < state.doc.lines ? firstLine.to + 1 : firstLine.to;
                decorations.push({ from: firstLine.from, to: endPos, deco: collapseDeco });
              } else {
                // Collapse only the marker
                const markerStartMatch = firstLine.text.match(/^(\s*>\s*)(\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|DANGER)\])/i);
                if (markerStartMatch) {
                  const startPos = firstLine.from + markerStartMatch[1].length;
                  const endPos = startPos + markerStartMatch[2].length;
                  decorations.push({ from: startPos, to: endPos, deco: collapseDeco });
                }
              }
            }
          }

          for (let i = startLine; i <= endLine; i++) {
            if (!claimedLines.has(i)) {
              const line = state.doc.line(i);
              decorations.push({ from: line.from, to: line.from, deco: deco });
              claimedLines.add(i);
            }
          }
        }

        if (node.name === "QuoteMark") {
          const line = state.doc.lineAt(node.from);
          let isAlertFirstLineQuoteMark = false;
          let parent = node.node.parent;
          if (parent && parent.name === "Blockquote") {
            const startLine = state.doc.lineAt(parent.from).number;
            if (line.number === startLine) {
              const firstLineText = state.doc.line(startLine).text;
              const isAlert = /^\s*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO|DANGER)\]/i.test(firstLineText);
              if (isAlert) {
                const endLine = state.doc.lineAt(parent.to).number;
                const isCursorInAdmonition = cursorLine >= startLine && cursorLine <= endLine;
                if (isCursorInAdmonition) {
                  isAlertFirstLineQuoteMark = true;
                }
              }
            }
          }

          if (cursorLine !== line.number && !isAlertFirstLineQuoteMark) {
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
