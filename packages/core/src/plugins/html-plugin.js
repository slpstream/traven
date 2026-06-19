// @ts-check
import { Decoration, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TravenPlugin } from "./TravenPlugin.js";
import { collapseDeco } from "../wysiwym.js";

/**
 * Sanitizes HTML to prevent script execution inside the editor DOM.
 * Strips <script> tags and removes inline "on*" event handler attributes.
 * 
 * Note on Security: Traven trusts the author's input model (the XSS surface is 
 * what the writer types, similar to a static site generator). If Traven is integrated 
 * with untrusted sources, a full sanitizer like DOMPurify should be run at the 
 * integration boundary.
 * 
 * @param {string} html 
 * @returns {string}
 */
export function safeHtmlForEditor(html) {
  if (typeof document === "undefined") return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Remove all script elements
    const scripts = doc.querySelectorAll("script");
    scripts.forEach(s => s.remove());
    
    // Remove inline event handlers (on*)
    const allElements = doc.querySelectorAll("*");
    allElements.forEach(el => {
      for (let i = el.attributes.length - 1; i >= 0; i--) {
        const attr = el.attributes[i];
        if (/^on[a-z]+$/i.test(attr.name)) {
          el.removeAttribute(attr.name);
        }
      }
    });

    // Scope IDs and references (url(#id), href="#id", style="...#id", <style>...#id) to prevent collisions
    const suffix = Math.random().toString(36).substring(2, 8);
    const elementsWithId = doc.querySelectorAll("[id]");
    elementsWithId.forEach(el => {
      const oldId = el.getAttribute("id");
      if (oldId) {
        const newId = `${oldId}-${suffix}`;
        el.setAttribute("id", newId);

        // Update clip-path attributes
        doc.querySelectorAll(`[clip-path*="#${oldId}"]`).forEach(target => {
          const val = target.getAttribute("clip-path");
          if (val) {
            target.setAttribute("clip-path", val.replace(`#${oldId}`, `#${newId}`));
          }
        });

        // Update style attributes
        doc.querySelectorAll(`[style*="#${oldId}"]`).forEach(target => {
          const val = target.getAttribute("style");
          if (val) {
            target.setAttribute("style", val.replace(new RegExp(`#${oldId}\\b`, 'g'), `#${newId}`));
          }
        });

        // Update href and namespace href attributes
        doc.querySelectorAll(`[href="#${oldId}"], [*|href="#${oldId}"]`).forEach(target => {
          const val = target.getAttribute("href") || target.getAttribute("xlink:href");
          if (val) {
            if (target.hasAttribute("href")) {
              target.setAttribute("href", `#${newId}`);
            } else {
              target.setAttribute("xlink:href", `#${newId}`);
            }
          }
        });

        // Update internal style tag selectors
        doc.querySelectorAll("style").forEach(styleEl => {
          const content = styleEl.textContent;
          if (content && content.includes(`#${oldId}`)) {
            styleEl.textContent = content.replace(new RegExp(`#${oldId}\\b`, 'g'), `#${newId}`);
          }
        });
      }
    });
    
    return doc.body.innerHTML;
  } catch (e) {
    console.warn("Failed to clean editor HTML preview:", e);
    // Secure fallback: return escaped HTML rather than raw HTML if DOMParser fails
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

/**
 * Widget to render raw HTML block in the editor.
 */
export class HTMLPreviewWidget extends WidgetType {
  /**
   * @param {string} html
   * @param {number} nodeFrom
   */
  constructor(html, nodeFrom) {
    super();
    this.html = html;
    this.nodeFrom = nodeFrom;
  }

  /**
   * @param {HTMLPreviewWidget} other
   */
  eq(other) {
    return other instanceof HTMLPreviewWidget && other.html === this.html && other.nodeFrom === this.nodeFrom;
  }

  /**
   * @param {import("@codemirror/view").EditorView} view
   */
  toDOM(view) {
    const div = document.createElement("div");
    div.className = "cm-wysiwym-html-preview";
    div.innerHTML = safeHtmlForEditor(this.html);

    // Click handler to select and focus the node to edit the raw HTML source
    div.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({ selection: { anchor: this.nodeFrom } });
      view.focus();
    });

    return div;
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Widget to render inline HTML tags in the editor.
 */
export class InlineHTMLPreviewWidget extends WidgetType {
  /**
   * @param {string} html
   * @param {number} nodeFrom
   */
  constructor(html, nodeFrom) {
    super();
    this.html = html;
    this.nodeFrom = nodeFrom;
  }

  /**
   * @param {InlineHTMLPreviewWidget} other
   */
  eq(other) {
    return other instanceof InlineHTMLPreviewWidget && other.html === this.html && other.nodeFrom === this.nodeFrom;
  }

  /**
   * @param {import("@codemirror/view").EditorView} view
   */
  toDOM(view) {
    const span = document.createElement("span");
    span.className = "cm-wysiwym-inline-html-preview";
    span.innerHTML = safeHtmlForEditor(this.html);

    span.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({ selection: { anchor: this.nodeFrom } });
      view.focus();
    });

    return span;
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * HTMLPlugin - Decorates and renders HTML in markdown editor view.
 * 
 * Note on Tag Pairing:
 * The tag matcher uses a stack-based algorithm to pair tags on the same line, correctly 
 * resolving nested tag structures (e.g. `<em>foo <strong>bar</strong> baz</em>`). 
 * To avoid nested replacement decorations inside CodeMirror, only the outermost paired 
 * tags are decorated and replaced with widgets; inner tags are handled natively.
 */
export class HTMLPlugin extends TravenPlugin {
  name = "html";
  requiredNodes = ["HTMLBlock", "HTMLTag"];
  decorationPriority = 80;

  /**
   * @param {import("./TravenPlugin.js").DecorationContext} ctx 
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorHead, suppressedFigureRanges } = ctx;

    // Collect tags and blocks
    const htmlTags = [];

    syntaxTree(state).iterate({
      enter(node) {
        // Skip processing any AST nodes inside replaced figures
        if (suppressedFigureRanges.some(r => node.from >= r.from && node.to <= r.to)) {
          return false;
        }

        if (node.name === "HTMLBlock") {
          const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;
          if (!isCursorInside) {
            const rawText = state.sliceDoc(node.from, node.to);
            decorations.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({
                widget: new HTMLPreviewWidget(rawText, node.from),
                block: true
              })
            });
          }
        }

        if (node.name === "HTMLTag") {
          htmlTags.push({
            from: node.from,
            to: node.to,
            text: state.sliceDoc(node.from, node.to)
          });
        }
      }
    });

    // Pair and render inline elements where possible using a stack-based matcher
    const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
    const pairedTags = [];
    const openStack = [];

    for (const tag of htmlTags) {
      const closeMatch = tag.text.match(/^<\s*\/\s*([a-zA-Z0-9-]+)\s*>$/);
      if (closeMatch) {
        const tagName = closeMatch[1].toLowerCase();
        // Find matching open tag in stack (scanning from top of stack)
        let matchIdx = -1;
        for (let i = openStack.length - 1; i >= 0; i--) {
          if (openStack[i].name === tagName) {
            matchIdx = i;
            break;
          }
        }
        if (matchIdx !== -1) {
          const openTag = openStack[matchIdx].tag;
          // Pop everything up to and including the matched tag
          openStack.splice(matchIdx);
          
          pairedTags.push({
            from: openTag.from,
            to: tag.to,
            text: state.sliceDoc(openTag.from, tag.to)
          });
        }
        continue;
      }

      const openMatch = tag.text.match(/^<\s*([a-zA-Z0-9-]+)[^>]*>$/);
      if (openMatch) {
        const tagName = openMatch[1].toLowerCase();
        const isSelfClosing = tag.text.endsWith("/>") || voidElements.has(tagName);
        if (isSelfClosing) {
          pairedTags.push({
            from: tag.from,
            to: tag.to,
            text: tag.text
          });
        } else {
          openStack.push({ name: tagName, tag });
        }
      }
    }

    // Sort by position and filter out overlapping elements (keep outermost)
    pairedTags.sort((a, b) => a.from - b.from);
    const filteredElements = [];
    let lastEnd = -1;

    for (const elem of pairedTags) {
      if (elem.from >= lastEnd) {
        filteredElements.push(elem);
        lastEnd = elem.to;
      }
    }

    // Replace paired inline HTML tags if the cursor is outside them
    for (const paired of filteredElements) {
      const isCursorInside = cursorHead >= paired.from && cursorHead <= paired.to;
      if (!isCursorInside) {
        decorations.push({
          from: paired.from,
          to: paired.to,
          deco: Decoration.replace({
            widget: new InlineHTMLPreviewWidget(paired.text, paired.from)
          })
        });
      }
    }
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
