// @ts-check
import { TravenPlugin, Decorations, WidgetType, syntaxTree } from "@freedomware/traven";
import { ExpandEmbedShortcode, parseExpandEmbedAttrs, expandEmbedLabel } from "./parser.js";

/**
 * @typedef {Object} ExpandResolveArgs
 * @property {string} slug
 * @property {string|null} [heading]
 * @property {'expand'|'embed'} mode
 */

/**
 * @callback ExpandResolver
 * @param {ExpandResolveArgs} args
 * @returns {string|null}
 */

let expandIdCounter = 0;

/**
 * @returns {string}
 */
function nextExpandId() {
  expandIdCounter += 1;
  return `traven-ee-${expandIdCounter}`;
}

class ExpandEmbedWidget extends WidgetType {
  /**
   * @param {{ mode: string, slug: string, heading: string|null, text: string|null, rawText: string, nodeFrom: number }} opts
   */
  constructor(opts) {
    super();
    this.mode = opts.mode;
    this.slug = opts.slug;
    this.heading = opts.heading;
    this.text = opts.text;
    this.rawText = opts.rawText;
    this.nodeFrom = opts.nodeFrom;
  }

  toDOM(view) {
    const el = document.createElement("span");
    el.className = `traven-expand-chip traven-expand-chip--${this.mode}`;
    el.dataset.mode = this.mode;
    el.title = this.rawText;
    el.textContent = expandEmbedLabel({
      text: this.text,
      heading: this.heading,
      slug: this.slug,
    });

    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({ selection: { anchor: this.nodeFrom } });
      view.focus();
    });

    return el;
  }

  eq(other) {
    return (
      other instanceof ExpandEmbedWidget &&
      other.mode === this.mode &&
      other.slug === this.slug &&
      other.heading === this.heading &&
      other.text === this.text &&
      other.rawText === this.rawText
    );
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Host-agnostic [expand]/[embed] plugin.
 */
export class ExpandEmbedPlugin extends TravenPlugin {
  name = "expand-embed";
  requiredNodes = /** @type {const} */ (["ExpandEmbedShortcode"]);
  decorationPriority = 80;

  /**
   * @param {{ resolve?: ExpandResolver }} [options]
   */
  constructor(options = {}) {
    super();
    this.resolve = typeof options.resolve === "function" ? options.resolve : null;
  }

  getMarkdownConfig() {
    return ExpandEmbedShortcode;
  }

  /**
   * @param {import("@freedomware/traven").DecorationContext | any} ctx
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorInRange, selectionOverlapsRange } = ctx;
    const tree = syntaxTree(state);

    tree.iterate({
      enter: (node) => {
        if (node.name !== "ExpandEmbedShortcode") return;
        if (cursorInRange(node.from, node.to) || selectionOverlapsRange(node.from, node.to)) {
          return;
        }
        const rawText = state.doc.sliceString(node.from, node.to);
        const attrs = parseExpandEmbedAttrs(rawText);
        decorations.push({
          from: node.from,
          to: node.to,
          deco: Decorations.replace({
            widget: new ExpandEmbedWidget({
              mode: attrs.mode,
              slug: attrs.slug,
              heading: attrs.heading,
              text: attrs.text,
              rawText,
              nodeFrom: node.from,
            }),
            // Inline — must not use block:true (breaks mid-sentence flow).
          }),
        });
      },
    });
  }

  /**
   * @param {import("@lezer/common").SyntaxNode} node
   * @param {string} _childrenHtml
   * @param {{ sliceDoc: (from: number, to: number) => string }} ctx
   * @returns {string|null}
   */
  renderToHTML(node, _childrenHtml, ctx) {
    const rawText = ctx.sliceDoc(node.from, node.to);
    const attrs = parseExpandEmbedAttrs(rawText);
    if (!attrs.slug) return "";

    let bodyHtml = null;
    if (this.resolve) {
      try {
        bodyHtml = this.resolve({
          slug: attrs.slug,
          heading: attrs.heading,
          mode: attrs.mode,
        });
      } catch (err) {
        console.warn("ExpandEmbedPlugin resolve failed:", err);
        bodyHtml = null;
      }
    }

    if (bodyHtml === null && this.resolve) {
      // Host said not-found → silent omission (reader-facing).
      return "";
    }

    const label = escapeHtml(expandEmbedLabel(attrs));
    const slugAttr = escapeAttr(attrs.slug);
    const headingAttr = attrs.heading ? ` data-heading="${escapeAttr(attrs.heading)}"` : "";
    const inner =
      bodyHtml != null && bodyHtml !== ""
        ? bodyHtml
        : `<p class="traven-expand-unresolved">Unresolved reference: ${escapeHtml(attrs.slug)}</p>`;

    if (attrs.mode === "embed") {
      return `<div class="traven-embed" data-slug="${slugAttr}"${headingAttr}><div class="traven-embed-content">${inner}</div></div>`;
    }

    // Phrasing-safe: button + template stay inside <p>; JS inserts the panel.
    const id = nextExpandId();
    return (
      `<button type="button" class="traven-expand-trigger" data-traven-expand="${id}"` +
      ` data-slug="${slugAttr}"${headingAttr} aria-expanded="false">${label}</button>` +
      `<template id="${id}">${inner}</template>`
    );
  }
}

/**
 * @param {string} text
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * @param {string} text
 */
function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

export { ExpandEmbedShortcode, parseExpandEmbedAttrs, expandEmbedLabel };
