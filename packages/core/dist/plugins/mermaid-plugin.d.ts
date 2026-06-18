export function extractMermaidCode(blockText: any): any;
export class MermaidWidget extends WidgetType {
    /**
     * @param {string} code
     * @param {number} nodeFrom
     */
    constructor(code: string, nodeFrom: number);
    code: string;
    nodeFrom: number;
    toDOM(view: any): HTMLDivElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
export class MermaidPlugin extends TravenPlugin {
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
