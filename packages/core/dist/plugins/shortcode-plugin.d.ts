export class ImageShortcodeWidget extends WidgetType {
    constructor(attrs: any, nodeFrom: any, rawText: any);
    attrs: any;
    nodeFrom: any;
    rawText: any;
    toDOM(view: any): HTMLDivElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
export class VideoShortcodeWidget extends WidgetType {
    constructor(attrs: any, nodeFrom: any, rawText: any);
    attrs: any;
    nodeFrom: any;
    rawText: any;
    toDOM(view: any): HTMLDivElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
export class AudioShortcodeWidget extends WidgetType {
    constructor(attrs: any, nodeFrom: any, rawText: any);
    attrs: any;
    nodeFrom: any;
    rawText: any;
    toDOM(view: any): HTMLDivElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
export class ComponentShortcodeWidget extends WidgetType {
    constructor(attrs: any, nodeFrom: any, bodyText: any, rawText: any);
    attrs: any;
    nodeFrom: any;
    bodyText: any;
    rawText: any;
    toDOM(view: any): HTMLDivElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
export class FigureShortcodeWidget extends WidgetType {
    constructor(attrs: any, nodeFrom: any, bodyText: any, rawText: any);
    attrs: any;
    nodeFrom: any;
    bodyText: any;
    rawText: any;
    toDOM(view: any): HTMLDivElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
export class ShortcodePlugin extends TravenPlugin {
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
