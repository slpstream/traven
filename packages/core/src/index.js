import { markdownLanguage } from "@codemirror/lang-markdown";
import { Strikethrough, TaskList, Table, Autolink } from "@lezer/markdown";
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

export { TravenEditor, DEFAULT_TOOLBAR } from "./TravenEditor.js";
export { getCM } from "@replit/codemirror-vim";
export { TravenEditorElement } from "./TravenEditorElement.js";
export { TravenRenderer } from "./renderer/index.js";

/**
 * Convenience helper to render Markdown to HTML using default Traven plugins and parser extensions.
 * @param {string} markdownText
 * @returns {string} Compiled HTML
 */
export function renderMarkdown(markdownText) {
  const parserExtensions = [
    Strikethrough,
    TaskList,
    Table,
    Autolink,
    Highlight,
    Shortcode,
    VideoShortcode,
    AudioShortcode,
    FigureShortcode,
    ComponentShortcode,
    MathExtension,
    { remove: ["SetextHeading"] },
  ];

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
    new HTMLPlugin()
  ];

  const mdParser = /** @type {import("@lezer/markdown").MarkdownParser} */ (markdownLanguage.parser);
  const renderer = new TravenRenderer(mdParser.configure(parserExtensions), activePlugins);
  return renderer.compile(markdownText);
}


