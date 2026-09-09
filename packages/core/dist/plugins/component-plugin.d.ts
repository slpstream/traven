/**
 * @param {Record<string, string>} attrs
 * @returns {string}
 */
export function normalizeComponentName(attrs: Record<string, string>): string;
/** Editor widget for `<Image />`. DOM class: `.cm-wysiwym-image-container`. */
export class ImageShortcodeWidget extends WidgetType {
    constructor(attrs: any, nodeFrom: any, rawText: any);
    attrs: any;
    nodeFrom: any;
    rawText: any;
    toDOM(view: any): HTMLDivElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
/** Editor widget for `<Video />`. DOM class: `.cm-wysiwym-video-container`. */
export class VideoShortcodeWidget extends WidgetType {
    constructor(attrs: any, nodeFrom: any, rawText: any);
    attrs: any;
    nodeFrom: any;
    rawText: any;
    toDOM(view: any): HTMLDivElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
/** Editor widget for `<Audio />`. DOM class: `.cm-wysiwym-audio-container`. */
export class AudioShortcodeWidget extends WidgetType {
    constructor(attrs: any, nodeFrom: any, rawText: any);
    attrs: any;
    nodeFrom: any;
    rawText: any;
    toDOM(view: any): HTMLDivElement;
    eq(other: any): boolean;
    ignoreEvent(): boolean;
}
/** Editor widget for `<Quote>`, `<Callout>`, `<Component>`, and other paired tags. DOM class: `.cm-wysiwym-component`. */
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
/** Editor widget for `<Figure>`. DOM class: `.cm-wysiwym-figure`. */
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
/**
 * WYSIWYM folding for capitalized MDX tags (`<Image />`, `<Quote>`, …).
 * Widget DOM classes use `cm-wysiwym-*-container` / `cm-wysiwym-component`;
 * JS class names keep the historical `*ShortcodeWidget` identifiers.
 */
export class ComponentPlugin extends TravenPlugin {
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
