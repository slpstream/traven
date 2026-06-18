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
 */
export class TravenPlugin {
    /** @type {string} */
    name: string;
    /** @type {readonly string[]} */
    requiredNodes: readonly string[];
    /** @type {number} */
    decorationPriority: number;
    /**
     * Return markdown parser extensions.
     * @returns {import("@lezer/markdown").MarkdownConfig|null}
     */
    getMarkdownConfig(): import("@lezer/markdown").MarkdownConfig | null;
    /**
     * Return keybindings for this plugin.
     * @returns {import("@codemirror/view").KeyBinding[]}
     */
    getKeymap(): import("@codemirror/view").KeyBinding[];
    /**
     * Return CodeMirror extensions for this plugin.
     * @returns {import("@codemirror/state").Extension[]}
     */
    getExtensions(): import("@codemirror/state").Extension[];
    /**
     * Build decorations for the current view state.
     * @param {DecorationContext} _ctx
     */
    buildDecorations(_ctx: DecorationContext): void;
    /**
     * Called when plugin is registered.
     * @param {PluginContext} _ctx
     */
    onRegister(_ctx: PluginContext): void;
    /**
     * Called by the static renderer for nodes matching this plugin's requiredNodes.
     * Return HTML string, or null to fall through to default renderer.
     * @param {import("@lezer/common").SyntaxNode} _node
     * @param {string} _childrenHtml
     * @param {any} _ctx
     * @returns {string | null}
     */
    renderToHTML(_node: import("@lezer/common").SyntaxNode, _childrenHtml: string, _ctx: any): string | null;
}
/**
 * Context passed to plugin decoration builders.
 */
export type DecorationContext = {
    state: import("@codemirror/state").EditorState;
    decorations: Array<{
        from: number;
        to: number;
        deco: import("@codemirror/view").Decoration;
    }>;
    selectionOverlapsRange: (from: number, to: number) => boolean;
    cursorInRange: (from: number, to: number) => boolean;
    hasFocus: boolean;
    cursorHead: number;
    cursorLine: number;
    suppressed: Array<{
        from: number;
        to: number;
    }> | null;
    suppressedFigureRanges: Array<{
        from: number;
        to: number;
    }>;
};
/**
 * Context passed to plugin lifecycle methods.
 */
export type PluginContext = any;
