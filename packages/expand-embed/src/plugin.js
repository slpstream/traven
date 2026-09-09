// @ts-check
import { TravenPlugin, Decorations, WidgetType, syntaxTree } from "@freedomware/traven";
import {
  Wikilink,
  parseWikilinkAttrs,
  expandEmbedLabel,
} from "./parser.js";
import { openExpandEmbedModal } from "./modal.js";
import { attachWikilinkAutocomplete } from "./autocomplete.js";

/**
 * @typedef {Object} ExpandResolveArgs
 * @property {string} slug
 * @property {string|null} [heading]
 * @property {string|null} [source]
 * @property {'expand'|'embed'} mode
 */

/**
 * @callback ExpandResolver
 * @param {ExpandResolveArgs} args
 * @returns {string|null}
 */

const PENCIL_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

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
   * @param {{
   *   mode: string,
   *   slug: string,
   *   heading: string|null,
   *   text: string|null,
   *   source: string|null,
   *   rawText: string,
   *   nodeFrom: number,
   *   editor?: object|null,
   * }} opts
   */
  constructor(opts) {
    super();
    this.mode = opts.mode;
    this.slug = opts.slug;
    this.heading = opts.heading;
    this.text = opts.text;
    this.source = opts.source;
    this.rawText = opts.rawText;
    this.nodeFrom = opts.nodeFrom;
    this.editor = opts.editor || null;
  }

  toDOM(view) {
    const el = document.createElement("span");
    const chipMode = this.mode === "embed" || this.mode === "expand" ? this.mode : "link";
    el.className = `traven-expand-chip traven-expand-chip--${chipMode}`;
    el.dataset.mode = chipMode;
    el.title = this.rawText;

    const label = document.createElement("span");
    label.className = "traven-expand-chip-label";
    label.textContent = expandEmbedLabel({
      text: this.text,
      heading: this.heading,
      slug: this.slug,
    });
    el.appendChild(label);

    if (chipMode === "expand" || chipMode === "embed") {
      const pencil = document.createElement("button");
      pencil.type = "button";
      pencil.className = "traven-expand-chip-edit";
      pencil.setAttribute("aria-label", chipMode === "embed" ? "Edit embed" : "Edit expand");
      pencil.innerHTML = PENCIL_SVG;
      pencil.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.editor) {
          openExpandEmbedModal(this.editor, pencil, chipMode, {
            from: this.nodeFrom,
            to: this.nodeFrom + this.rawText.length,
            attrs: {
              mode: chipMode,
              slug: this.slug,
              heading: this.heading,
              text: this.text,
              source: this.source,
            },
          });
        }
      });
      el.appendChild(pencil);
    }

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
      other.source === this.source &&
      other.rawText === this.rawText
    );
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Host-agnostic wikilink / expand / embed plugin (`[[slug]]`, `[[!slug]]`, `[[>slug]]`).
 * Registers Lezer `Wikilink` grammar, WYSIWYM chips, and in-editor `[[` typeahead via `onSuggestLinks`.
 */
export class ExpandEmbedPlugin extends TravenPlugin {
  name = "expand-embed";
  requiredNodes = /** @type {const} */ (["Wikilink"]);
  decorationPriority = 80;

  /**
   * @param {{ resolve?: ExpandResolver }} [options]
   */
  constructor(options = {}) {
    super();
    this.resolve = typeof options.resolve === "function" ? options.resolve : null;
    /** @type {object|null} */
    this.editor = null;
    /** @type {{ destroy: () => void }|null} */
    this._autocomplete = null;
  }

  getMarkdownConfig() {
    return Wikilink;
  }

  /**
   * @param {import("@freedomware/traven").PluginContext | any} ctx
   */
  onRegister(ctx) {
    this.editor = ctx?.editor || null;
    const editor = this.editor;
    if (!editor) return;
    const attach = () => {
      if (this._autocomplete) return;
      this._autocomplete = attachWikilinkAutocomplete(editor);
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(attach);
    } else {
      setTimeout(attach, 0);
    }
  }

  /**
   * @param {import("@freedomware/traven").DecorationContext | any} ctx
   */
  buildDecorations(ctx) {
    const { state, decorations, cursorInRange, selectionOverlapsRange } = ctx;
    const tree = syntaxTree(state);

    tree.iterate({
      enter: (node) => {
        if (node.name !== "Wikilink") return;
        if (cursorInRange(node.from, node.to) || selectionOverlapsRange(node.from, node.to)) {
          return;
        }
        const rawText = state.doc.sliceString(node.from, node.to);
        const attrs = parseWikilinkAttrs(rawText);
        decorations.push({
          from: node.from,
          to: node.to,
          deco: Decorations.replace({
            widget: new ExpandEmbedWidget({
              mode: attrs.mode,
              slug: attrs.slug,
              heading: attrs.heading,
              text: attrs.text,
              source: attrs.source,
              rawText,
              nodeFrom: node.from,
              editor: this.editor,
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
    const attrs = parseWikilinkAttrs(rawText);
    if (!attrs.slug) return "";

    const label = escapeHtml(expandEmbedLabel(attrs));
    const slugAttr = escapeAttr(attrs.slug);
    const headingAttr = attrs.heading ? ` data-heading="${escapeAttr(attrs.heading)}"` : "";
    const sourceAttr = attrs.source ? ` data-source="${escapeAttr(attrs.source)}"` : "";

    if (attrs.mode === "link") {
      return (
        `<a class="traven-wikilink" href="#" data-slug="${slugAttr}"${headingAttr}${sourceAttr}>${label}</a>`
      );
    }

    let bodyHtml = null;
    if (this.resolve) {
      try {
        bodyHtml = this.resolve({
          slug: attrs.slug,
          heading: attrs.heading,
          source: attrs.source,
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

    const inner =
      bodyHtml != null && bodyHtml !== ""
        ? bodyHtml
        : `<p class="traven-expand-unresolved">Unresolved reference: ${escapeHtml(attrs.slug)}</p>`;

    if (attrs.mode === "embed") {
      return `<div class="traven-embed" data-slug="${slugAttr}"${headingAttr}${sourceAttr}><div class="traven-embed-content">${inner}</div></div>`;
    }

    // Phrasing-safe: button + template stay inside <p>; JS inserts the panel.
    const id = nextExpandId();
    return (
      `<button type="button" class="traven-expand-trigger" data-traven-expand="${id}"` +
      ` data-slug="${slugAttr}"${headingAttr}${sourceAttr} aria-expanded="false">${label}</button>` +
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

export {
  Wikilink,
  /** @deprecated Use {@link Wikilink}. */
  Wikilink as ExpandEmbedShortcode,
  parseWikilinkAttrs,
  /** @deprecated Use {@link parseWikilinkAttrs}. */
  parseWikilinkAttrs as parseExpandEmbedAttrs,
  expandEmbedLabel,
};
