/**
 * Escapes HTML entities in text to prevent injection.
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text: string): string;
export class TravenRenderer {
    /**
     * @param {import("@lezer/common").Parser} parser
     * @param {import("../plugins/TravenPlugin.js").TravenPlugin[]} [plugins]
     */
    constructor(parser: import("@lezer/common").Parser, plugins?: import("../plugins/TravenPlugin.js").TravenPlugin[]);
    parser: import("@lezer/common").Parser;
    plugins: import("../plugins/TravenPlugin.js").TravenPlugin[];
    /**
     * Compiles Markdown text to HTML using the Lezer syntax tree.
     * @param {string} markdownText
     * @returns {string}
     */
    compile(markdownText: string): string;
    /**
     * Renders a single syntax node to HTML.
     * @param {import("@lezer/common").SyntaxNode} node
     * @param {string} docText
     * @returns {string}
     */
    renderNode(node: import("@lezer/common").SyntaxNode, docText: string): string;
    /**
     * Renders the children of a syntax node, handling raw text gaps.
     * @param {import("@lezer/common").SyntaxNode} node
     * @param {string} docText
     * @returns {string}
     */
    renderChildren(node: import("@lezer/common").SyntaxNode, docText: string): string;
}
