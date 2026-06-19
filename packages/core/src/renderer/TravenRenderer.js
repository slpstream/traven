// @ts-check

import { defaultNodeRenderer } from "./default-renderers.js";

/**
 * Escapes HTML entities in text to prevent injection.
 * @param {string} text 
 * @returns {string}
 */
export function escapeHtml(text) {
  if (typeof text !== "string") {
    text = String(text);
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export class TravenRenderer {
  /** 
   * @param {import("@lezer/common").Parser} parser 
   * @param {import("../plugins/TravenPlugin.js").TravenPlugin[]} [plugins]
   */
  constructor(parser, plugins = []) {
    this.parser = parser;
    this.plugins = plugins;
  }

  /**
   * Compiles Markdown text to HTML using the Lezer syntax tree.
   * @param {string} markdownText 
   * @returns {string}
   */
  compile(markdownText) {
    const tree = this.parser.parse(markdownText);
    return this.renderNode(tree.topNode, markdownText);
  }

  /**
   * Renders a single syntax node to HTML.
   * @param {import("@lezer/common").SyntaxNode} node 
   * @param {string} docText 
   * @returns {string}
   */
  renderNode(node, docText) {
    const childrenHtml = this.renderChildren(node, docText);

    // Allow plugins to override rendering
    for (const plugin of this.plugins) {
      if (plugin.requiredNodes.includes(node.name)) {
        const ctx = { sliceDoc: (from, to) => docText.slice(from, to) };
        const result = plugin.renderToHTML(node, childrenHtml, ctx);
        if (result !== null) {
          return result;
        }
      }
    }

    return defaultNodeRenderer(node, childrenHtml, docText);
  }

  /**
   * Renders the children of a syntax node, handling raw text gaps.
   * @param {import("@lezer/common").SyntaxNode} node 
   * @param {string} docText 
   * @returns {string}
   */
  renderChildren(node, docText) {
    let result = "";
    let pos = node.from;
    let child = node.firstChild;

    while (child) {
      // Text gaps between child nodes
      if (child.from > pos) {
        result += escapeHtml(docText.slice(pos, child.from));
      }
      result += this.renderNode(child, docText);
      pos = child.to;
      child = child.nextSibling;
    }

    // Trailing text after the last child
    if (pos < node.to) {
      result += escapeHtml(docText.slice(pos, node.to));
    }

    return result;
  }
}
