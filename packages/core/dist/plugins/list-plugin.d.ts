export class CheckboxWidget extends WidgetType {
    constructor(checked: any, pos: any);
    checked: any;
    pos: any;
    toDOM(view: any): HTMLInputElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
export class BulletWidget extends WidgetType {
    toDOM(): HTMLSpanElement;
    eq(): boolean;
}
export class ListPlugin extends TravenPlugin {
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
