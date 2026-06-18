// @ts-check

import { defaultNodeRenderer } from "./default-renderers.js";

/**
 * Escapes HTML entities in text to prevent injection.
 * @param {string} text 
 * @returns {string}
 */
export function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export class TravenRenderer {
  /** @param {import("@lezer/markdown").MarkdownParser} parser */
  constructor(parser) {
    this.parser = parser;
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
