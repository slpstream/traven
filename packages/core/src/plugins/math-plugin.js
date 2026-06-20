// @ts-check
import { Decoration, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { ensureKatex } from "../math-parser.js";

export class MathWidget extends WidgetType {
  constructor(math, isBlock, nodeFrom) {
    super();
    this.math = math;
    this.isBlock = isBlock;
    this.nodeFrom = nodeFrom;
  }

  toDOM(view) {
    const wrapper = document.createElement(this.isBlock ? "div" : "span");
    wrapper.className = this.isBlock ? "cm-wysiwym-block-math-widget" : "cm-wysiwym-inline-math-widget";
    wrapper.style.display = this.isBlock ? "block" : "inline-block";

    wrapper.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Put cursor inside the delimiters to trigger isCursorInside
      view.dispatch({ selection: { anchor: this.nodeFrom + (this.isBlock ? 2 : 1) } });
      view.focus();
    });

    ensureKatex().then((katex) => {
      if (katex) {
        try {
          katex.render(this.math, wrapper, {
            displayMode: this.isBlock,
            throwOnError: false
          });
        } catch (e) {
          wrapper.textContent = (this.isBlock ? "$$" : "$") + this.math + (this.isBlock ? "$$" : "$");
        }
      } else {
        wrapper.textContent = (this.isBlock ? "$$" : "$") + this.math + (this.isBlock ? "$$" : "$");
      }
    });

    if (!window["katex"]) {
      wrapper.textContent = (this.isBlock ? "$$" : "$") + this.math + (this.isBlock ? "$$" : "$");
      ensureKatex().then(() => {
        if (view && !view.destroyed) {
          view.requestMeasure();
        }
      });
    }

    return wrapper;
  }

  eq(other) {
    return this.math === other.math && this.isBlock === other.isBlock && this.nodeFrom === other.nodeFrom;
  }

  ignoreEvent() { return false; }
}

export class MathPlugin extends TravenPlugin {
  name = "math";
  requiredNodes = ["InlineMath", "BlockMath"];
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

        if (node.name === "InlineMath") {
          const isCursorInside = cursorHead > node.from && cursorHead < node.to;
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

          if (!isCursorInside || isSuppressed) {
            const mathText = state.sliceDoc(node.from + 1, node.to - 1);
            decorations.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new MathWidget(mathText, false, node.from) })
            });
            return false;
          }
        } else if (node.name === "BlockMath") {
          const isCursorInside = cursorHead > node.from && cursorHead < node.to;
          const isSuppressed = suppressed && suppressed.some(s => s.from === node.from && s.to === node.to);

          if (!isCursorInside || isSuppressed) {
            const mathText = state.sliceDoc(node.from + 2, node.to - 2);
            decorations.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new MathWidget(mathText, true, node.from), block: true })
            });
            return false;
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
