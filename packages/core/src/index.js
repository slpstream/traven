import { markdownLanguage } from "@codemirror/lang-markdown";
import { Strikethrough, TaskList, Table, Autolink, Subscript, Superscript } from "@lezer/markdown";
import { Highlight } from "./highlight-parser.js";
import { Shortcode } from "./shortcode-parser.js";
import { VideoShortcode } from "./video-parser.js";
import { AudioShortcode } from "./audio-parser.js";
import { FigureShortcode } from "./figure-parser.js";
import { ComponentShortcode } from "./component-parser.js";
import { MathExtension } from "./math-parser.js";
import { TravenRenderer } from "./renderer/index.js";
import {
  HeadingPlugin,
  HrPlugin,
  QuotePlugin,
  InlinePlugin,
  LinkPlugin,
  ListPlugin,
  CodePlugin,
  FrontmatterPlugin,
  MathPlugin,
  MermaidPlugin,
  TablePlugin,
  ShortcodePlugin,
  HTMLPlugin
} from "./plugins/index.js";

import { yamlFrontmatter } from "@codemirror/lang-yaml";
import { markdown } from "@codemirror/lang-markdown";

export { TravenEditor, DEFAULT_TOOLBAR } from "./TravenEditor.js";
export { getCM } from "@replit/codemirror-vim";
export { TravenEditorElement } from "./TravenEditorElement.js";
export { TravenRenderer } from "./renderer/index.js";
export { TravenPlugin } from "./plugins/TravenPlugin.js";
/** Re-exported so host plugins share the same CodeMirror instance as the editor bundle. */
export { Decoration, WidgetType } from "@codemirror/view";
export { Decoration as Decorations } from "@codemirror/view";
export { syntaxTree } from "@codemirror/language";

/**
 * Convenience helper to render Markdown to HTML using default Traven plugins and parser extensions.
 * @param {string} markdownText
 * @param {import("./plugins/TravenPlugin.js").TravenPlugin[]} [extraPlugins] - Optional host plugins (grammar + render).
 * @returns {string} Compiled HTML
 */
export function renderMarkdown(markdownText, extraPlugins = []) {
  const hostPlugins = Array.isArray(extraPlugins)
    ? extraPlugins.filter((p) => p && typeof p === "object")
    : [];

  const parserExtensions = [
    Strikethrough,
    TaskList,
    Table,
    Autolink,
    Highlight,
    Subscript,
    Superscript,
    Shortcode,
    VideoShortcode,
    AudioShortcode,
    FigureShortcode,
    ComponentShortcode,
    MathExtension,
    { remove: ["SetextHeading"] },
  ];

  for (const plugin of hostPlugins) {
    if (typeof plugin.getMarkdownConfig === "function") {
      const cfg = plugin.getMarkdownConfig();
      if (cfg) parserExtensions.push(cfg);
    }
  }

  const activePlugins = [
    new HeadingPlugin(),
    new HrPlugin(),
    new QuotePlugin(),
    new InlinePlugin(),
    new LinkPlugin(),
    new ListPlugin(),
    new CodePlugin(),
    new FrontmatterPlugin(),
    new MathPlugin(),
    new MermaidPlugin(),
    new TablePlugin(),
    new ShortcodePlugin(),
    new HTMLPlugin(),
    ...hostPlugins,
  ];

  const baseLang = yamlFrontmatter({
    content: markdown({ extensions: parserExtensions })
  });
  const renderer = new TravenRenderer(baseLang.language.parser, activePlugins);
  return renderer.compile(markdownText);
}


