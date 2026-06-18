// @ts-check
import { Decoration, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { ensureMermaid } from "../mermaid-parser.js";

export function extractMermaidCode(blockText) {
  const lines = blockText.split(/\r?\n/);
  if (lines.length >= 2) {
    return lines.slice(1, lines.length - 1).join("\n").trim();
  }
  return blockText.trim();
}

export class MermaidWidget extends WidgetType {
  /**
   * @param {string} code
   * @param {number} nodeFrom
   */
  constructor(code, nodeFrom) {
    super();
    this.code = code;
    this.nodeFrom = nodeFrom;
  }

  toDOM(view) {
    const container = document.createElement("div");
    container.className = "cm-wysiwym-mermaid-container";
    container.style.display = "block";
    container.style.overflow = "auto";

    const inner = document.createElement("div");
    inner.className = "mermaid";
    inner.textContent = this.code;
    container.appendChild(inner);

    ensureMermaid().then(async (mermaid) => {
      if (mermaid) {
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "loose",
          });
          const id = `mermaid-wysiwym-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const { svg } = await mermaid.render(id, this.code);
          inner.innerHTML = svg;
          
          if (view && !view.destroyed) {
            view.requestMeasure();
          }
        } catch (e) {
          console.warn("Mermaid render error in WYSIWYM:", e);
          const errorMsg = e instanceof Error ? e.message : String(e);
          // Assuming escapeHtml is extracted or inlined
          inner.innerHTML = `<pre class="language-mermaid"><code>${this.code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre><p class="mermaid-error-message">Failed to render diagram: ${String(errorMsg).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
        }
      } else {
        inner.innerHTML = `<pre class="language-mermaid"><code>${this.code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
      }
    });

    container.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({ selection: { anchor: this.nodeFrom } });
      view.focus();
    });

    return container;
  }

  eq(other) {
    return other instanceof MermaidWidget && this.code === other.code && this.nodeFrom === other.nodeFrom;
  }

  ignoreEvent() { return false; }
}

export class MermaidPlugin extends TravenPlugin {
  name = "mermaid";
  requiredNodes = ["FencedCode"];
  // We want it to run before CodePlugin just to be safe, though they don't strictly conflict anymore.
  decorationPriority = 90;

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

        if (node.name === "FencedCode") {
          const isCursorInside = cursorHead > node.from && cursorHead < node.to;
          
          if (!isCursorInside) {
            const blockText = state.sliceDoc(node.from, node.to);
            const isMermaid = blockText.trim().startsWith("```mermaid") || blockText.trim().startsWith("~~~mermaid");
            if (isMermaid) {
              const rawCode = extractMermaidCode(blockText);
              decorations.push({
                from: node.from,
                to: node.to,
                deco: Decoration.replace({ widget: new MermaidWidget(rawCode, node.from), block: true })
              });
              return false;
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
