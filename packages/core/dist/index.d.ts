/**
 * Convenience helper to render Markdown to HTML using default Traven plugins and parser extensions.
 * @param {string} markdownText
 * @param {import("./plugins/TravenPlugin.js").TravenPlugin[]} [extraPlugins] - Optional host plugins (grammar + render).
 * @returns {string} Compiled HTML
 */
export function renderMarkdown(markdownText: string, extraPlugins?: import("./plugins/TravenPlugin.js").TravenPlugin[]): string;
export { getCM } from "@replit/codemirror-vim";
export { TravenEditorElement } from "./TravenEditorElement.js";
export { TravenRenderer } from "./renderer/index.js";
export { TravenPlugin } from "./plugins/TravenPlugin.js";
export { syntaxTree } from "@codemirror/language";
export { TravenEditor, DEFAULT_TOOLBAR } from "./TravenEditor.js";
export { Decoration, WidgetType, Decoration as Decorations } from "@codemirror/view";
