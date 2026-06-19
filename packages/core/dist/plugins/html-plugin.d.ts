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
export function safeHtmlForEditor(html: string): string;
/**
 * Widget to render raw HTML block in the editor.
 */
export class HTMLPreviewWidget extends WidgetType {
    /**
     * @param {string} html
     * @param {number} nodeFrom
     */
    constructor(html: string, nodeFrom: number);
    html: string;
    nodeFrom: number;
    /**
     * @param {HTMLPreviewWidget} other
     */
    eq(other: HTMLPreviewWidget): boolean;
    /**
     * @param {import("@codemirror/view").EditorView} view
     */
    toDOM(view: import("@codemirror/view").EditorView): HTMLDivElement;
    ignoreEvent(): boolean;
}
/**
 * Widget to render inline HTML tags in the editor.
 */
export class InlineHTMLPreviewWidget extends WidgetType {
    /**
     * @param {string} html
     * @param {number} nodeFrom
     */
    constructor(html: string, nodeFrom: number);
    html: string;
    nodeFrom: number;
    /**
     * @param {InlineHTMLPreviewWidget} other
     */
    eq(other: InlineHTMLPreviewWidget): boolean;
    ignoreEvent(): boolean;
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
    requiredNodes: string[];
    /**
     * @param {import("@lezer/common").SyntaxNode} _node
     * @param {string} _childrenHtml
     * @param {any} _ctx
     */
    renderToHTML(_node: import("@lezer/common").SyntaxNode, _childrenHtml: string, _ctx: any): any;
}
import { WidgetType } from "@codemirror/view";
import { TravenPlugin } from "./TravenPlugin.js";
