export class TableWidget extends WidgetType {
    constructor(tableText: any, tableFrom: any);
    tableText: any;
    tableFrom: any;
    toDOM(view: any): HTMLDivElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
export class TablePlugin extends TravenPlugin {
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
