// @ts-check
import { Decoration } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { 
  codeBlockLineDeco, 
  codeBlockLineFirstDeco, 
  codeBlockLineLastDeco, 
  codeBlockLineSingleDeco,
  collapsedFenceLineDeco,
  collapseDeco
} from "../wysiwym.js";

export class CodePlugin extends TravenPlugin {
  name = "code";
  requiredNodes = ["FencedCode", "CodeBlock"];
  decorationPriority = 100;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorHead } = ctx;
    const claimedLines = new Set();

    syntaxTree(state).iterate({
      enter(node) {
        if (node.name === "FencedCode" || node.name === "CodeBlock") {
          const isCursorInside = cursorHead > node.from && cursorHead < node.to;

          if (node.name === "FencedCode") {
            const blockText = state.sliceDoc(node.from, node.to);
            const isMermaid = blockText.trim().startsWith("```mermaid") || blockText.trim().startsWith("~~~mermaid");
            if (isMermaid) {
              if (!isCursorInside) {
                return false;
              }
            }
          }

          const startLine = state.doc.lineAt(node.from).number;
          const endLine = state.doc.lineAt(node.to).number;

          for (let i = startLine; i <= endLine; i++) {
            // If the cursor is outside, do not decorate the first and last lines (fences are collapsed)
            if (!isCursorInside && node.name === "FencedCode" && (i === startLine || i === endLine)) {
              continue;
            }
            if (!claimedLines.has(i)) {
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
              
              decorations.push({
                from: line.from,
                to: line.from,
                deco: deco
              });
              claimedLines.add(i);
            }
          }

          if (!isCursorInside && node.name === "FencedCode") {
            const startLineObj = state.doc.line(startLine);
            const endLineObj = state.doc.line(endLine);
            decorations.push({ from: startLineObj.from, to: startLineObj.to, deco: collapseDeco });
            decorations.push({ from: endLineObj.from, to: endLineObj.to, deco: collapseDeco });
            if (!claimedLines.has(startLine)) {
              decorations.push({ from: startLineObj.from, to: startLineObj.from, deco: collapsedFenceLineDeco });
              claimedLines.add(startLine);
            }
            if (!claimedLines.has(endLine)) {
              decorations.push({ from: endLineObj.from, to: endLineObj.from, deco: collapsedFenceLineDeco });
              claimedLines.add(endLine);
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
