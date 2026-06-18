export class MathWidget extends WidgetType {
    constructor(math: any, isBlock: any);
    math: any;
    isBlock: any;
    toDOM(view: any): HTMLDivElement | HTMLSpanElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
export class MathPlugin extends TravenPlugin {
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
