// @ts-check
import { TravenPlugin, Decoration, WidgetType, syntaxTree } from "@freedomware/traven";
import { ExpandEmbedShortcode, parseExpandEmbedAttrs } from "./parser.js";

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

class ExpandEmbedWidget extends WidgetType {
  /**
   * @param {{ mode: string, slug: string, heading: string|null, rawText: string, nodeFrom: number }} opts
   */
  constructor(opts) {
    super();
    this.mode = opts.mode;
    this.slug = opts.slug;
    this.heading = opts.heading;
    this.rawText = opts.rawText;
    this.nodeFrom = opts.nodeFrom;
  }

  toDOM(view) {
    const el = document.createElement("div");
    el.className = `traven-expand-card traven-expand-card--${this.mode}`;
    el.title = this.rawText;

    const badge = document.createElement("span");
    badge.className = "traven-expand-card-badge";
    badge.textContent = this.mode === "embed" ? "embed" : "expand";

    const title = document.createElement("span");
    title.className = "traven-expand-card-title";
    title.textContent = this.heading || this.slug || "(missing slug)";

    const meta = document.createElement("span");
    meta.className = "traven-expand-card-meta";
    meta.textContent = this.slug ? `slug: ${this.slug}` : "no slug";

    el.appendChild(badge);
    el.appendChild(title);
    el.appendChild(meta);

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
          deco: Decoration.replace({
            widget: new ExpandEmbedWidget({
              mode: attrs.mode,
              slug: attrs.slug,
              heading: attrs.heading,
              rawText,
              nodeFrom: node.from,
            }),
            block: true,
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

    const summary = escapeHtml(attrs.heading || attrs.slug);
    const slugAttr = escapeAttr(attrs.slug);
    const headingAttr = attrs.heading ? ` data-heading="${escapeAttr(attrs.heading)}"` : "";
    const inner =
      bodyHtml != null && bodyHtml !== ""
        ? bodyHtml
        : `<p class="traven-expand-unresolved">Unresolved reference: ${escapeHtml(attrs.slug)}</p>`;

    if (attrs.mode === "embed") {
      return `<div class="traven-embed" data-slug="${slugAttr}"${headingAttr}><div class="traven-embed-content">${inner}</div></div>`;
    }

    return `<details class="traven-expand" data-slug="${slugAttr}"${headingAttr}><summary class="traven-expand-summary">${summary}</summary><div class="traven-expand-content">${inner}</div></details>`;
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

export { ExpandEmbedShortcode, parseExpandEmbedAttrs };
