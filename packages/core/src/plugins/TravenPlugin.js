// @ts-check

/**
 * Context passed to plugin decoration builders.
 * @typedef {Object} DecorationContext
 * @property {import("@codemirror/state").EditorState} state
 * @property {Array<{from: number, to: number, deco: import("@codemirror/view").Decoration}>} decorations
 * @property {(from: number, to: number) => boolean} selectionOverlapsRange
 * @property {(from: number, to: number) => boolean} cursorInRange
 * @property {boolean} hasFocus
 * @property {number} cursorHead
 * @property {number} cursorLine
 * @property {Array<{from: number, to: number}>|null} suppressed
 * @property {Array<{from: number, to: number}>} suppressedFigureRanges
 */

/**
 * Context passed to plugin lifecycle methods.
 * @typedef {Object} PluginContext
 * @property {any} [editor] - TravenEditor instance (may not have a view yet during onRegister).
 * @property {Object} [options] - Constructor options passed to TravenEditor.
 */

export class TravenPlugin {
  /** @type {string} */
  name = "";

  /** @type {readonly string[]} */
  requiredNodes = [];

  /** @type {number} */
  decorationPriority = 100;

  /**
   * Return markdown parser extensions.
   * @returns {import("@lezer/markdown").MarkdownConfig|null}
   */
  getMarkdownConfig() {
    return null;
  }

  /**
   * Return keybindings for this plugin.
   * @returns {import("@codemirror/view").KeyBinding[]}
   */
  getKeymap() {
    return [];
  }

  /**
   * Return CodeMirror extensions for this plugin.
   * @returns {import("@codemirror/state").Extension[]}
   */
  getExtensions() {
    return [];
  }

  /**
   * Build decorations for the current view state.
   * @param {DecorationContext} _ctx 
   */
  buildDecorations(_ctx) {}

  /**
   * Called when plugin is registered.
   * @param {PluginContext} _ctx 
   */
  onRegister(_ctx) {}

  /**
   * Called by the static renderer for nodes matching this plugin's requiredNodes.
   * Return HTML string, or null to fall through to default renderer.
   * @param {import("@lezer/common").SyntaxNode} _node
   * @param {string} _childrenHtml
   * @param {any} _ctx
   * @returns {string | null}
   */
  renderToHTML(_node, _childrenHtml, _ctx) {
    return null;
  }
}
