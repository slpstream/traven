/**
 * Convenience helper to render Markdown to HTML using default Traven plugins and parser extensions.
 * @param {string} markdownText
 * @returns {string} Compiled HTML
 */
export function renderMarkdown(markdownText: string): string;
export { getCM } from "@replit/codemirror-vim";
export { TravenEditorElement } from "./TravenEditorElement.js";
export { TravenRenderer } from "./renderer/index.js";
export { TravenEditor, DEFAULT_TOOLBAR } from "./TravenEditor.js";
