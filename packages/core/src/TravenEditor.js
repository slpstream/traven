// @ts-check
import { EditorState, Annotation, Prec, Compartment } from "@codemirror/state";
import {
  EditorView,
  lineNumbers as cmLineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import {
  history,
  defaultKeymap,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  foldKeymap,
  syntaxHighlighting,
  bracketMatching,
  foldGutter,
  syntaxTree,
} from "@codemirror/language";
import { classHighlighter } from "@lezer/highlight";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Strikethrough, TaskList, Table, Autolink } from "@lezer/markdown";
import { Highlight } from "./highlight-parser.js";
import { Shortcode } from "./shortcode-parser.js";
import { VideoShortcode } from "./video-parser.js";
import { AudioShortcode } from "./audio-parser.js";
import { FigureShortcode } from "./figure-parser.js";
import { ComponentShortcode } from "./component-parser.js";
import { MathExtension, ensureKatex, configureKatex } from "./math-parser.js";
import {
  configureMermaid,
  renderMermaidSync,
  initMermaid,
} from "./mermaid-parser.js";
import { TravenRenderer } from "./renderer/index.js";
import { yamlFrontmatter } from "@codemirror/lang-yaml";
import { undo, redo } from "@codemirror/commands";
import { search, openSearchPanel } from "@codemirror/search";
import { buildToolbar } from "./toolbar/toolbar.js";
import { TOOL_REGISTRY } from "./toolbar/tools.js";
import {
  wysiwymPlugin,
  getListPrefixAt,
  getListStrippingRanges,
  isInCodeBlock,
} from "./wysiwym.js";
import { TravenPluginsFacet, travenViewPlugin, TravenPlugin,
  HeadingPlugin,
  HrPlugin,
  QuotePlugin,
  InlinePlugin,
  LinkPlugin,
  ListPlugin,
  CodePlugin
} from "./plugins/index.js";
import { delimiterSkipKeymap } from "./delimiter-skip.js";
import { imageDecorationPlugin, imageHandlerExtension } from "./images.js";
import { vim } from "@replit/codemirror-vim";
import { viewToEditor } from "./bridge.js";
import { sanitizeUrl, parseVideoUrl } from "./security.js";
import DEFAULT_COMPONENTS from "./components-default.json";
import "./style.css";
import "../assets/toolbars/toolbar-default.css";
import "../assets/skins/skin-starter.css";
import { resolveToolbarMode } from "./toolbar/mode.js";
import { loadStyles } from "./toolbar/load-styles.js";
import { buildSlimRail, buildStatsWidget } from "./toolbar/slim-rail.js";
import {
  selectionBubbleExtension,
  gutterInserterExtension,
} from "./toolbar/floating-toolbar.js";

// Ensure styles are bundled
loadStyles();

const syncAnnotation = Annotation.define();
const vimCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

export const DEFAULT_TOOLBAR = [
  "undo",
  "redo",
  "|",
  "bold",
  "italic",
  "strikethrough",
  "highlight",
  "code",
  "codeblock",
  "|",
  "heading",
  "|",
  "bulletlist",
  "numberedlist",
  "tasklist",
  "blockquote",
  "hr",
  "table",
  "component",
  "figure",
  "|",
  "datetime",
  "search",
  "link",
  "image",
  "video",
  "audio",
  "fullscreen",
  "clear",
  "uppercase",
  "lowercase",
  "capitalize",
  "removeformatting",
  "gotoline",
  "help",
];

/**
 * Builds a custom modular base setup similar to CodeMirror's basicSetup
 * but allowing selective inclusion of line numbers, gutters, and folders.
 */
function buildBaseSetup(options = {}) {
  const exts = [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    syntaxHighlighting(classHighlighter),
    bracketMatching(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      indentWithTab,
    ]),
  ];

  if (options.lineNumbers) {
    exts.push(cmLineNumbers());
    exts.push(highlightActiveLineGutter());
  }

  if (options.foldGutter) {
    exts.push(foldGutter());
  }

  return exts;
}

/**
 * @typedef {Object} ComponentAttribute
 * @property {string} name - Attribute name
 * @property {string} type - Attribute type (e.g., "text", "boolean")
 * @property {string} [label] - UI label
 * @property {string} [placeholder] - Placeholder text
 *
 * @typedef {Object} ComponentSchema
 * @property {string} name - Component name
 * @property {ComponentAttribute[]} [attributes] - Defined attribute schemas
 *
 * @typedef {string | ComponentSchema} ComponentOption
 */

/**
 * @typedef {Object} TravenOptions
 * @property {HTMLElement} element - The DOM container to mount the editor in.
 * @property {HTMLElement} [sourceElement] - Optional container to mount the raw source editor in.
 * @property {string} initialValue - The initial markdown document string.
 * @property {boolean} [lineNumbers=false] - Show line numbers in the primary editor.
 * @property {boolean} [sourceLineNumbers=false] - Show line numbers in the raw source editor.
 * @property {boolean} [lineWrapping=true] - Enable soft line wrapping in the primary editor.
 * @property {boolean} [sourceLineWrapping=true] - Enable soft line wrapping in the raw source editor.
 * @property {function(string): void} [onChange] - Callback fired on document changes.
 * @property {function(string): void} [onSave] - Callback fired on manual save command (Cmd+S / Ctrl+S).
 * @property {function(File): Promise<string>} [onUploadImage] - Callback handling image uploads.
 * @property {"light" | "dark"} [theme] - Visual style theme.
 * @property {string} [caretColor] - Configurable caret color override.
 * @property {Array<string>|boolean} [toolbar=false] - Toolbar configuration array or false.
 * @property {ComponentOption[]} [components] - Pre-defined custom components options array.
 * @property {string|boolean} [componentsUrl="assets/components.json"] - URL/path to load components schema, or false.
 * @property {any} [katex] - Configure/enable KaTeX math formatting option.
 * @property {Object.<string, string>} [keybindings] - Custom keybindings map.
 * @property {boolean} [readOnly] - Set editor to read-only mode.
 * @property {boolean} [vimMode] - Enable Vim mode.
 * @property {function({words: number, characters: number, readTime: number}): void} [onStatsUpdate] - Callback when stats are updated.
 * @property {string} [toolbarMode] - Effective mode for toolbar layout ("static" | "floating" | "hybrid").
 * @property {string} [bubbleHotkey] - Key binding to open selection bubble.
 * @property {string} [gutterHotkey] - Key binding to open gutter plus menu.
 * @property {boolean} [gutterInserter=true] - Enable or disable the gutter block insertion sidebar. Set to false to remove the "+" gutter column that shifts content right.
 * @property {number} [bubbleAppearDelay=200] - Delay in ms between pointer settling on a stable selection and the selection bubble appearing. Set to 0 to restore the previous eager-appear behavior.
 * @property {boolean} [autoLoadStyles=true] - Auto-inject core CSS from CDN/local bundle. Set to false for strict CSP environments.
 * @property {any} [codeLanguages] - Optional CodeMirror LanguageDescription array (e.g. from @codemirror/language-data) or matching function to enable syntax highlighting in fenced code blocks without bloating the core bundle.
 */

export class TravenEditor {
  /** @type {EditorView} */
  #view;
  /** @type {EditorView|null} */
  #rawView = null;
  /** @type {Object.<string, Function[]>} */
  #listeners = {};
  /** @type {TravenOptions} */
  #options;
  /** @type {Function|null} */
  #customRenderer = null;
  /** @type {ComponentOption[]} */
  #components;
  /** @type {HTMLElement|null} */
  #announcer = null;
  /** @type {TravenRenderer} */
  #renderer;

  /**
   * @param {TravenOptions} options
   */
  constructor(options) {
    if (!options.element) {
      throw new Error("TravenEditor requires a parent element option.");
    }
    this.#options = options;

    // Create visually hidden screen reader announcer
    if (typeof document !== "undefined") {
      this.#announcer = document.createElement("div");
      this.#announcer.className = "traven-sr-announcer";
      this.#announcer.setAttribute("aria-live", "polite");
      this.#announcer.setAttribute("aria-atomic", "true");
      // Style it to be visually hidden but accessible to screen readers
      Object.assign(this.#announcer.style, {
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: "0",
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: "0",
      });
      options.element.appendChild(this.#announcer);
    }

    if (options.autoLoadStyles !== false) {
      if (
        typeof document !== "undefined" &&
        !document.getElementById("traven-core-styles")
      ) {
        try {
          const cssUrl = new URL("./traven.css", import.meta.url).href;
          const link = document.createElement("link");
          link.id = "traven-core-styles";
          link.rel = "stylesheet";
          link.href = cssUrl;

          const existingSkin = document.getElementById("editor-skin-link");
          if (existingSkin) {
            existingSkin.before(link);
          } else {
            document.head.insertBefore(link, document.head.firstChild);
          }
        } catch (e) {
          console.warn(
            "Traven: Could not auto-inject CSS. If styling looks broken, manually <link> dist/traven.css",
          );
        }
      }
    }

    // Initialize component name schema options with fallbacks
    this.#components = DEFAULT_COMPONENTS;
    if (
      options.components &&
      Array.isArray(options.components) &&
      options.components.length > 0
    ) {
      this.#components = options.components;
    } else if (options.componentsUrl !== false) {
      const url =
        typeof options.componentsUrl === "string"
          ? options.componentsUrl
          : new URL("../assets/components.json", import.meta.url).href;
      fetch(url)
        .then((res) => {
          if (!res.ok) {
            throw new Error(
              `Failed to load component schema: status ${res.status}`,
            );
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            this.#components = data;
          } else {
            console.warn(
              `Component schema from ${url} is empty or invalid. Falling back to default presets.`,
            );
          }
        })
        .catch((err) => {
          const isDefaultUrlParseError =
            !options.componentsUrl &&
            (err instanceof TypeError ||
              err instanceof SyntaxError ||
              (err && (err.name === "TypeError" || err.name === "SyntaxError")));
          if (!isDefaultUrlParseError) {
            console.warn(
              `Failed to fetch component schema from ${url}. Falling back to default presets:`,
              err,
            );
          }
        });
    }

    // Configure KaTeX loading (e.g. from CDN if options.katex is set)
    configureKatex(options.katex);
    // Asynchronously ensure KaTeX resources are loaded
    ensureKatex();

    const showLineNumbers = !!options.lineNumbers;
    const showSourceLineNumbers = !!options.sourceLineNumbers;
    const wrapLines = options.lineWrapping !== false;
    const wrapSourceLines = options.sourceLineWrapping !== false;

    const mode = resolveToolbarMode(options);

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

    const mdParser = /** @type {import("@lezer/markdown").MarkdownParser} */ (markdownLanguage.parser);
    const activePlugins = [
      new HeadingPlugin(),
      new HrPlugin(),
      new QuotePlugin(),
      new InlinePlugin(),
      new LinkPlugin(),
      new ListPlugin(),
      new CodePlugin()
    ];
    this.#renderer = new TravenRenderer(mdParser.configure(parserExtensions), activePlugins);

    const extensions = [
      ...buildBaseSetup({
        lineNumbers: showLineNumbers,
        foldGutter: showLineNumbers,
      }),
      ...(wrapLines ? [EditorView.lineWrapping] : []),
      readOnlyCompartment.of(EditorState.readOnly.of(!!options.readOnly)),
      yamlFrontmatter({
        content: markdown({
          ...(options.codeLanguages
            ? { codeLanguages: options.codeLanguages }
            : {}),
          extensions: parserExtensions,
        }),
      }),
      TravenPluginsFacet.of(activePlugins),
      travenViewPlugin,
      wysiwymPlugin(),
      delimiterSkipKeymap(),
      imageDecorationPlugin(),

      // Update listener to track doc changes and sync to raw editor
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const val = update.state.doc.toString();
          if (options.onChange) {
            options.onChange(val);
          }
          this.#trigger("change", val);

          // Propagate change to raw editor if it exists and transaction is not a sync loopback
          if (
            this.#rawView &&
            !update.transactions.some((tr) => tr.annotation(syncAnnotation))
          ) {
            this.#rawView.dispatch({
              changes: update.changes,
              annotations: syncAnnotation.of(true),
            });
          }

          this.#triggerStatsUpdate();
        }
      }),

      // Optimistic image upload and drop/paste handling
      imageHandlerExtension(),

      // Search panel (provides Ctrl+F keybinding and search UI)
      search(),

      // Selection bubble and gutter block insertion extensions
      ...(mode === "floating" || mode === "hybrid"
        ? [
          selectionBubbleExtension(this, {
            hotkey: options.bubbleHotkey || "Mod-.",
            appearDelay: options.bubbleAppearDelay ?? 200,
          }),
          ...(options.gutterInserter !== false
            ? [gutterInserterExtension(this, {
                hotkey: options.gutterHotkey || "Mod-Shift-Enter",
              })]
            : []),
        ]
        : []),
    ];

    // Caret color configuration
    const defaultCaret =
      options.caretColor || (options.theme === "dark" ? "#ffffff" : "#000000");
    const themeExtension = EditorView.theme({
      ".cm-cursor": { borderLeftColor: `${defaultCaret} !important` },
      ".cm-fat-cursor": { backgroundColor: `${defaultCaret} !important` },
    });
    extensions.push(themeExtension);

    // Vim Keybindings support
    const initialVim = options.vimMode ? vim() : [];
    extensions.push(vimCompartment.of(initialVim));

    // Save keymap handler (Ctrl+S / Cmd+S)
    const saveHandler = EditorView.domEventHandlers({
      keydown: (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          const docVal = this.getValue();
          if (options.onSave) {
            options.onSave(docVal);
          }
          this.#trigger("save", docVal);
          return true;
        }
        return false;
      },
    });
    extensions.push(saveHandler);

    // Dynamic keyboard shortcuts keymap registration
    const keymapBindings = [];
    const customKeybindings = options.keybindings || {};
    for (const key of Object.keys(TOOL_REGISTRY)) {
      const tool = TOOL_REGISTRY[key];
      const bindingStr =
        key in customKeybindings ? customKeybindings[key] : tool.keybinding;
      if (bindingStr) {
        keymapBindings.push({
          key: bindingStr,
          run: () => {
            const buttonEl =
              options.element &&
                typeof options.element.querySelector === "function"
                ? options.element.querySelector(`.toolbar-btn.btn-${key}`)
                : null;
            tool.action(this, buttonEl);
            return true;
          },
        });
      }
    }
    if (keymapBindings.length > 0) {
      extensions.push(Prec.high(keymap.of(keymapBindings)));
    }

    this.#view = new EditorView({
      parent: options.element,
      state: EditorState.create({
        doc: options.initialValue || "",
        extensions,
      }),
    });

    // Register this editor instance in the view↔editor bridge
    // so that widget classes (e.g. TableWidget) can resolve the
    // TravenEditor from an EditorView without circular imports.
    viewToEditor.set(this.#view, this);

    // Render and prepend toolbar based on mode
    if (mode === "static") {
      if (options.toolbar && Array.isArray(options.toolbar)) {
        const toolbarEl = buildToolbar(
          this,
          options.toolbar,
          options.keybindings,
        );
        options.element.prepend(toolbarEl);
      }
    } else if (mode === "hybrid") {
      if (options.toolbar && Array.isArray(options.toolbar)) {
        const toolbarEl = buildToolbar(
          this,
          options.toolbar,
          options.keybindings,
        );
        toolbarEl.classList.add("traven-hybrid-toolbar");
        options.element.prepend(toolbarEl);

        const statsEl = buildStatsWidget(this);
        toolbarEl.appendChild(statsEl);
      }
    } else if (mode === "floating") {
      if (options.toolbar !== false) {
        const railEl = buildSlimRail(this, options.keybindings);
        options.element.prepend(railEl);
      }
    }

    if (options.theme === "dark") {
      this.#view.dom.classList.add("cm-wysiwym-dark");
    }

    // Optional raw editor setup
    if (options.sourceElement) {
      const rawExtensions = [
        ...buildBaseSetup({
          lineNumbers: showSourceLineNumbers,
          foldGutter: showSourceLineNumbers,
        }),
        ...(wrapSourceLines ? [EditorView.lineWrapping] : []),
        readOnlyCompartment.of(EditorState.readOnly.of(!!options.readOnly)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // Propagate change back to primary editor
            if (
              !update.transactions.some((tr) => tr.annotation(syncAnnotation))
            ) {
              this.#view.dispatch({
                changes: update.changes,
                annotations: syncAnnotation.of(true),
              });
            }
          }
        }),
        vimCompartment.of(options.vimMode ? vim() : []),
      ];

      this.#rawView = new EditorView({
        parent: options.sourceElement,
        state: EditorState.create({
          doc: options.initialValue || "",
          extensions: rawExtensions,
        }),
      });

      if (options.theme === "dark") {
        this.#rawView.dom.classList.add("cm-wysiwym-dark");
      }
    }

    // Trigger initial stats calculation asynchronously to allow event listeners to bind first
    Promise.resolve().then(() => {
      this.#triggerStatsUpdate();
    });

    // Wait for fonts to load to prevent layout jumps on first paint
    if (
      typeof document !== "undefined" &&
      document.fonts &&
      document.fonts.ready
    ) {
      document.fonts.ready.then(() => {
        if (this.#view) {
          this.#view.requestMeasure();
        }
        if (this.#rawView) {
          this.#rawView.requestMeasure();
        }
      });
    }
  }

  // --- Public API Methods ---

  /**
   * Triggers history undo on the currently focused editor.
   */
  undo() {
    if (this.#rawView && this.#rawView.hasFocus) {
      undo(this.#rawView);
    } else {
      undo(this.#view);
    }
  }

  /**
   * Triggers history redo on the currently focused editor.
   */
  redo() {
    if (this.#rawView && this.#rawView.hasFocus) {
      redo(this.#rawView);
    } else {
      redo(this.#view);
    }
  }

  getValue() {
    if (!this.#view) {
      return this.#options ? this.#options.initialValue || "" : "";
    }
    return this.#view.state.doc.toString();
  }

  /**
   * @param {string} value - The new content to replace the entire document.
   */
  setValue(value) {
    this.#view.dispatch({
      changes: { from: 0, to: this.#view.state.doc.length, insert: value },
    });
  }

  /**
   * Focuses the primary editor.
   */
  focus() {
    this.#view.focus();
  }

  /**
   * Sets the editor to read-only or read-write mode dynamically.
   * @param {boolean} readOnly
   */
  setReadOnly(readOnly) {
    this.#view.dispatch({
      effects: readOnlyCompartment.reconfigure(
        EditorState.readOnly.of(readOnly),
      ),
    });
    if (this.#rawView) {
      this.#rawView.dispatch({
        effects: readOnlyCompartment.reconfigure(
          EditorState.readOnly.of(readOnly),
        ),
      });
    }
    this.#announce(readOnly ? "Editor is now read only" : "Editor is now editable");
  }

  /**
   * Returns whether the editor is currently in read-only mode.
   * @returns {boolean}
   */
  isReadOnly() {
    return this.#view.state.readOnly;
  }

  /**
   * Returns the currently selected text.
   * @returns {string}
   */
  getSelection() {
    const range = this.#view.state.selection.main;
    return this.#view.state.sliceDoc(range.from, range.to);
  }

  /**
   * Sets the selection range in the editor.
   * @param {number} anchor - The anchor of the selection.
   * @param {number} [head] - The head of the selection. Defaults to anchor (caret position).
   */
  setSelection(anchor, head = anchor) {
    this.#view.dispatch({
      selection: { anchor, head },
    });
    this.#view.focus();
  }

  /**
   * Replaces the current selection with the given text.
   * If nothing is selected, inserts at cursor position.
   * @param {string} text - The text to insert.
   */
  replaceSelection(text) {
    const range = this.#view.state.selection.main;
    this.#view.dispatch({
      changes: { from: range.from, to: range.to, insert: text },
      selection: { anchor: range.from + text.length },
    });
    this.#view.focus();
  }

  /**
   * Sets the editor theme dynamically.
   * @param {"light" | "dark"} theme
   */
  setTheme(theme) {
    if (theme === "dark") {
      this.#view.dom.classList.add("cm-wysiwym-dark");
      if (this.#rawView) {
        this.#rawView.dom.classList.add("cm-wysiwym-dark");
      }
    } else {
      this.#view.dom.classList.remove("cm-wysiwym-dark");
      if (this.#rawView) {
        this.#rawView.dom.classList.remove("cm-wysiwym-dark");
      }
    }
    this.#announce(`Theme changed to ${theme}`);
  }

  /**
   * Toggles Vim keybindings dynamically.
   * @param {boolean} enabled
   */
  setVimMode(enabled) {
    const extension = enabled ? vim() : [];
    this.#view.dispatch({
      effects: vimCompartment.reconfigure(extension),
    });
    if (this.#rawView) {
      this.#rawView.dispatch({
        effects: vimCompartment.reconfigure(extension),
      });
    }
    this.#announce(enabled ? "Vim keybindings enabled" : "Vim keybindings disabled");
  }

  /**
   * Returns the total character count of the document.
   * @returns {number}
   */
  getCharacterCount() {
    return this.getValue().length;
  }

  /**
   * Returns the total word count of the document.
   * @returns {number}
   */
  getWordCount() {
    const text = this.getValue().trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }

  /**
   * Returns the estimated reading time of the document in minutes.
   * @returns {number}
   */
  getReadTime() {
    const words = this.getWordCount();
    return Math.ceil(words / 200);
  }

  /**
   * Returns a snapshot of the current editor state optimized for external agents.
   * Includes the full raw markdown, split frontmatter/body, current selection,
   * cursor position, and document statistics.
   * @returns {{ markdown: string, frontmatter: string, body: string, selection: string, cursor: { line: number, column: number }, lineCount: number, stats: { words: number, characters: number, readTime: number } }}
   */
  getMarkdownState() {
    const state = this.#view.state;
    const range = state.selection.main;
    const cursorLine = state.doc.lineAt(range.head);
    const { frontmatter, body } = this.#parseFrontmatter();

    return {
      markdown: state.doc.toString(),
      frontmatter,
      body,
      selection: state.sliceDoc(range.from, range.to),
      cursor: {
        line: cursorLine.number,
        column: range.head - cursorLine.from,
      },
      lineCount: state.doc.lines,
      stats: {
        words: this.getWordCount(),
        characters: this.getCharacterCount(),
        readTime: this.getReadTime(),
      },
    };
  }

  /**
   * Configure Mermaid diagram rendering for this editor instance.
   * Similar to configureKatex, this allows loading Mermaid from a CDN.
   *
   * @param {boolean|string|object} options - Configuration options:
   *   - `true`: Enable with default CDN URL (v11.4.0)
   *   - `string`: Custom CDN URL for mermaid.js
   *   - `object`: Configuration object with optional `js` property for custom URL
   *   - `false` / `undefined`: Disable Mermaid
   */
  static configureMermaid(options) {
    configureMermaid(options);
  }

  /**
   * Initialize mermaid diagrams in a container element after content is rendered.
   * This should be called after getContentHtml() output is inserted into the DOM.
   *
   * @param {HTMLElement} container - Container element to scan for mermaid diagrams
   * @returns {Promise<void>}
   */
  static async initMermaid(container) {
    await initMermaid(container);
  }

  /**
   * Registers a custom markdown rendering function.
   * @param {function(string): string} renderFn - The rendering function.
   */
  registerRenderer(renderFn) {
    if (typeof renderFn !== "function") {
      throw new Error("registerRenderer expects a function.");
    }
    this.#customRenderer = renderFn;
  }

  /**
   * Returns the rendered HTML of the current document content.
   * @returns {string} HTML representation of the document.
   */
  getContentHtml() {
    const val = this.getValue();
    if (this.#customRenderer) {
      return this.#customRenderer(val);
    }
    return this.#renderer.compile(val);
  }

  /**
   * Inserts formatting syntax around selected text or placeholder.
   * @param {string} before - Text to prepend.
   * @param {string} after - Text to append.
   * @param {string} [placeholder] - Text placeholder if no range is selected.
   */
  insertSnippet(before, after, placeholder = "") {
    const range = this.#view.state.selection.main;
    const hadSelection = !range.empty;
    let selectedText = this.#view.state.sliceDoc(range.from, range.to);

    let lead = "";
    let tail = "";

    if (hadSelection) {
      const matchLead = selectedText.match(/^(\s+)/);
      if (matchLead) {
        lead = matchLead[1];
        selectedText = selectedText.slice(lead.length);
      }
      const matchTail = selectedText.match(/(\s+)$/);
      if (matchTail) {
        tail = matchTail[1];
        selectedText = selectedText.slice(0, selectedText.length - tail.length);
      }
    }

    if (!selectedText && placeholder) {
      selectedText = placeholder;
    }

    const insertion = `${lead}${before}${selectedText}${after}${tail}`;

    this.#view.dispatch({
      changes: { from: range.from, to: range.to, insert: insertion },
      selection:
        placeholder && !hadSelection
          ? {
            anchor: range.from + lead.length + before.length,
            head:
              range.from + lead.length + before.length + selectedText.length,
          }
          : {
            anchor:
              range.from +
              lead.length +
              before.length +
              selectedText.length +
              after.length,
          },
    });
    this.#view.focus();
  }

  /**
   * Inserts the current date and time (YYYY-MM-DD HH:MM) at the cursor or selection.
   */
  insertDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day} ${hours}:${minutes}`;
    this.insertSnippet("", "", dateStr);
  }

  /**
   * Clears all document content and refocuses the editor.
   */
  clear() {
    this.setValue("");
    this.#view.focus();
  }

  /**
   * Converts the current selection to UPPERCASE.
   * Preserves the selection bounds after transformation.
   */
  toUpperCase() {
    const range = this.#view.state.selection.main;
    if (range.empty) return;
    const selected = this.#view.state.sliceDoc(range.from, range.to);
    const transformed = selected.toUpperCase();
    this.#view.dispatch({
      changes: { from: range.from, to: range.to, insert: transformed },
      selection: { anchor: range.from, head: range.from + transformed.length },
    });
    this.#view.focus();
  }

  /**
   * Converts the current selection to lowercase.
   * Preserves the selection bounds after transformation.
   */
  toLowerCase() {
    const range = this.#view.state.selection.main;
    if (range.empty) return;
    const selected = this.#view.state.sliceDoc(range.from, range.to);
    const transformed = selected.toLowerCase();
    this.#view.dispatch({
      changes: { from: range.from, to: range.to, insert: transformed },
      selection: { anchor: range.from, head: range.from + transformed.length },
    });
    this.#view.focus();
  }

  /**
   * Capitalizes the first letter of each word in the current selection.
   * Preserves the selection bounds after transformation.
   */
  capitalizeWords() {
    const range = this.#view.state.selection.main;
    if (range.empty) return;
    const selected = this.#view.state.sliceDoc(range.from, range.to);
    const capitalized = selected.replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
    this.#view.dispatch({
      changes: { from: range.from, to: range.to, insert: capitalized },
      selection: { anchor: range.from, head: range.from + capitalized.length },
    });
    this.#view.focus();
  }

  /**
   * Strips block-level and inline Markdown formatting from the current selection,
   * excluding links and images which are kept intact.
   */
  removeFormatting() {
    const range = this.#view.state.selection.main;
    if (range.empty) return;
    const state = this.#view.state;
    const startLineNum = state.doc.lineAt(range.from).number;
    const endLineNum = state.doc.lineAt(range.to).number;
    const listRanges = getListStrippingRanges(state, range.from, range.to);

    const processedLines = [];

    for (let l = startLineNum; l <= endLineNum; l++) {
      const line = state.doc.line(l);

      const lineSelStart = Math.max(line.from, range.from);
      const lineSelEnd = Math.min(line.to, range.to);
      let lineText = state.sliceDoc(lineSelStart, lineSelEnd);

      if (
        /^\s*```\w*$/.test(line.text) ||
        /^\s*([-*_])\1{2,}\s*$/.test(line.text)
      ) {
        continue;
      }

      const stripRange = listRanges.find((r) => {
        return r.from >= line.from && r.to <= line.to;
      });

      if (stripRange) {
        const stripStartOffset = Math.max(0, stripRange.from - lineSelStart);
        const stripEndOffset = Math.min(
          lineText.length,
          stripRange.to - lineSelStart,
        );
        if (stripEndOffset > stripStartOffset) {
          lineText =
            lineText.slice(0, stripStartOffset) +
            lineText.slice(stripEndOffset);
        }
      }

      lineText = lineText.replace(/^\s*(>\s*)+/, "");
      lineText = lineText.replace(/^\s*#{1,6}\s+/, "");

      processedLines.push(lineText);
    }

    let text = processedLines.join("\n");

    // 2. Process inline formatting (excluding links and images)
    // Strip bold/italic emphasis (longest delimiters first)
    text = text.replace(/(\*{3}|_{3})(.+?)\1/g, "$2");
    text = text.replace(/(\*{2}|_{2})(.+?)\1/g, "$2");
    text = text.replace(/(\*|_)(.+?)\1/g, "$2");
    // Strip strikethrough: ~~text~~
    text = text.replace(/~~(.+?)~~/g, "$1");
    // Strip highlights: ==text==
    text = text.replace(/==(.+?)==/g, "$1");
    // Strip inline code: `text`
    text = text.replace(/`([^`]+)`/g, "$1");

    this.#view.dispatch({
      changes: { from: range.from, to: range.to, insert: text },
      selection: { anchor: range.from, head: range.from + text.length },
    });
    this.#view.focus();
  }

  /**
   * Toggles fullscreen mode on the editor's parent container.
   * Targets the nearest .editor-wrapper ancestor (toolbar + editor),
   * falling back to the immediate parent element.
   */
  toggleFullscreen() {
    const container =
      this.#view.dom.closest(".editor-wrapper") || this.#view.dom.parentElement;
    container.classList.toggle("is-fullscreen");
    const isFullscreen = container.classList.contains("is-fullscreen");
    this.#announce(isFullscreen ? "Fullscreen enabled" : "Fullscreen disabled");
    // Reflow CM's coordinate measurements after layout change
    this.#view.requestMeasure();
    this.#view.focus();
  }

  /**
   * Opens the CodeMirror search panel.
   */
  openSearch() {
    openSearchPanel(this.#view);
  }

  /**
   * Moves the cursor to the specified line number and scrolls it into view.
   * @param {number} lineNumber - 1-indexed line number. Clamped to document bounds.
   */
  goToLine(lineNumber) {
    const n = Math.max(1, Math.min(lineNumber, this.#view.state.doc.lines));
    const line = this.#view.state.doc.line(n);
    this.#view.dispatch({
      selection: { anchor: line.from },
      scrollIntoView: true,
    });
    this.#view.focus();
  }

  /**
   * Wraps the current selection in a markdown code block.
   */
  insertCodeBlock() {
    const view = this.#view;
    const state = view.state;
    const { from, to } = state.selection.main;
    const hadSelection = from !== to;

    let selectionText = hadSelection ? state.sliceDoc(from, to) : "";

    const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : "\n";
    const prefixSpacing = charBefore !== "\n" ? "\n" : "";

    const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : "\n";
    const suffixSpacing = charAfter !== "\n" ? "\n" : "";

    let finalInsert = "";
    let newAnchor = 0;
    let newHead = 0;

    if (!hadSelection) {
      const insertion = "```\n\n```";
      finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;
      newAnchor = from + prefixSpacing.length + 4;
      newHead = newAnchor;
    } else {
      let middleText = selectionText;
      if (!middleText.startsWith("\n")) {
        middleText = "\n" + middleText;
      }
      if (!middleText.endsWith("\n")) {
        middleText = middleText + "\n";
      }

      const standardInsertion = `\`\`\`${middleText}\`\`\`;`;
      // Strip trailing semicolon from template if any (standardInsertion definition: `\`\`\`${middleText}\`\`\``)
      // Corrected inline:
      const standardInsertCorrected = `\`\`\`${middleText}\`\`\``;
      finalInsert = `${prefixSpacing}${standardInsertCorrected}${suffixSpacing}`;
      newAnchor = from + prefixSpacing.length;
      newHead = newAnchor + standardInsertCorrected.length;
    }

    view.dispatch({
      changes: { from, to, insert: finalInsert },
      selection: { anchor: newAnchor, head: newHead },
    });
    view.focus();
  }

  /**
   * Inserts a horizontal rule, handling spacing.
   */
  insertHR() {
    const view = this.#view;
    const state = view.state;
    const { from, to } = state.selection.main;

    const insertion = "---";

    const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : "\n";
    const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : "\n";

    const secondCharBefore =
      from > 1 ? state.sliceDoc(from - 2, from - 1) : "\n";

    let prefixSpacing = "";
    if (charBefore !== "\n") {
      prefixSpacing = "\n\n";
    } else if (secondCharBefore !== "\n") {
      prefixSpacing = "\n";
    }

    let suffixSpacing = "";
    if (charAfter !== "\n") {
      suffixSpacing = "\n";
    }

    const finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;

    view.dispatch({
      changes: { from, to, insert: finalInsert },
      selection: { anchor: from + prefixSpacing.length + insertion.length },
    });
    view.focus();
  }

  /**
   * Inserts a block of markdown at the specified position with proper blank-line spacing.
   * Handles edge cases at document start/end and avoids doubling existing blank lines.
   * @param {string} text - The markdown block to insert.
   * @param {"before" | "after" | "start" | "end"} [position="after"] - Where to insert relative to cursor line or document bounds.
   */
  insertBlock(text, position = "after") {
    const state = this.#view.state;
    let insertPos;

    if (position === "end") {
      insertPos = state.doc.length;
    } else if (position === "start") {
      insertPos = 0;
    } else if (position === "before") {
      const line = state.doc.lineAt(state.selection.main.head);
      insertPos = line.from;
    } else {
      // "after" — end of current line
      const line = state.doc.lineAt(state.selection.main.head);
      insertPos = line.to;
    }

    // Ensure blank-line separation from surrounding content
    let prefix = "";
    let suffix = "";

    if (insertPos > 0) {
      const charBefore = state.sliceDoc(insertPos - 1, insertPos);
      if (charBefore !== "\n") {
        prefix = "\n\n";
      } else if (insertPos > 1) {
        const twoBack = state.sliceDoc(insertPos - 2, insertPos - 1);
        if (twoBack !== "\n") {
          prefix = "\n";
        }
      }
    }

    if (insertPos < state.doc.length) {
      const charAfter = state.sliceDoc(insertPos, insertPos + 1);
      if (charAfter !== "\n") {
        suffix = "\n\n";
      } else if (insertPos < state.doc.length - 1) {
        const twoAfter = state.sliceDoc(insertPos + 1, insertPos + 2);
        if (twoAfter !== "\n") {
          suffix = "\n";
        }
      }
    }

    const insertion = `${prefix}${text}${suffix}`;
    this.#view.dispatch({
      changes: { from: insertPos, to: insertPos, insert: insertion },
      selection: { anchor: insertPos + insertion.length },
    });
    this.#view.focus();
  }

  /**
   * Inserts a standard 3x3 markdown table template, handling surrounding spacing.
   */
  insertTable() {
    const view = this.#view;
    const state = view.state;
    const { from, to } = state.selection.main;

    const insertion =
      `| Header 1 | Header 2 | Header 3 |\n` +
      `|----------|----------|----------|\n` +
      `| Cell 1   | Cell 2   | Cell 3   |\n` +
      `| Cell 4   | Cell 5   | Cell 6   |`;

    const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : "\n";
    const secondCharBefore =
      from > 1 ? state.sliceDoc(from - 2, from - 1) : "\n";

    let prefixSpacing = "";
    if (charBefore !== "\n") {
      prefixSpacing = "\n\n";
    } else if (secondCharBefore !== "\n") {
      prefixSpacing = "\n";
    }

    const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : "\n";
    let suffixSpacing = "";
    if (charAfter !== "\n") {
      suffixSpacing = "\n";
    }

    const finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;

    // Select the "Header 1" text for easy editing.
    // "Header 1" starts after the leading "| " (length 2) of the table insertion.
    const selStart = from + prefixSpacing.length + 2;
    const selEnd = selStart + 8; // length of "Header 1"

    view.dispatch({
      changes: { from, to, insert: finalInsert },
      selection: { anchor: selStart, head: selEnd },
    });
    view.focus();
  }

  /**
   * Sets or toggles heading level for the active line.
   * @param {number} level - Heading level (1 to 6).
   */
  setHeading(level) {
    const view = this.#view;
    const state = view.state;
    const pos = state.selection.main.head;
    const line = state.doc.lineAt(pos);
    const existingPrefix = line.text.match(/^(#{1,6}\s*)/)?.[0] || "";

    const prefix = level > 0 ? "#".repeat(level) + " " : "";

    if (existingPrefix === prefix) {
      view.dispatch({
        changes: {
          from: line.from,
          to: line.from + existingPrefix.length,
          insert: "",
        },
      });
    } else {
      view.dispatch({
        changes: {
          from: line.from,
          to: line.from + existingPrefix.length,
          insert: prefix,
        },
      });
    }
    view.focus();
  }

  /**
   * Formats selection or line as blockquote.
   */
  insertBlockquote() {
    const view = this.#view;
    const state = view.state;
    const { from, to } = state.selection.main;

    if (from === to) {
      const pos = from;
      const line = state.doc.lineAt(pos);
      const existingPrefix = line.text.match(/^(>\s*)/)?.[0] || "";

      if (existingPrefix) {
        view.dispatch({
          changes: {
            from: line.from,
            to: line.from + existingPrefix.length,
            insert: "",
          },
        });
      } else {
        view.dispatch({
          changes: { from: line.from, to: line.from, insert: "> " },
        });
      }
    } else {
      let selectedText = state.sliceDoc(from, to);
      const lines = selectedText.split(/\r?\n/);
      const quotedLines = lines.map((line) => `> ${line}`);
      let insertion = quotedLines.join("\n");

      const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : "\n";
      const charAfter =
        to < state.doc.length ? state.sliceDoc(to, to + 1) : "\n";
      const secondCharBefore =
        from > 1 ? state.sliceDoc(from - 2, from - 1) : "\n";
      const secondCharAfter =
        to < state.doc.length - 1 ? state.sliceDoc(to + 1, to + 2) : "\n";

      let prefixSpacing = "";
      if (charBefore !== "\n") {
        prefixSpacing = "\n\n";
      } else if (secondCharBefore !== "\n") {
        prefixSpacing = "\n";
      }

      let suffixSpacing = "";
      if (charAfter !== "\n") {
        suffixSpacing = "\n\n";
      } else if (secondCharAfter !== "\n") {
        suffixSpacing = "\n";
      }

      const finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;

      view.dispatch({
        changes: { from, to, insert: finalInsert },
        selection: {
          anchor: from + prefixSpacing.length,
          head: from + prefixSpacing.length + insertion.length,
        },
      });
    }
    view.focus();
  }

  /**
   * Formats selection or line as a list (ordered, unordered, or task/checklist).
   * @param {"ol" | "ul" | "task"} type
   */
  insertList(type) {
    const view = this.#view;
    const state = view.state;
    const { from, to } = state.selection.main;

    // Do nothing if we are inside a code block
    if (isInCodeBlock(state, from)) {
      return;
    }

    const isOL = type === "ol";
    const isTask = type === "task";
    const getPrefix = (index) => {
      if (isOL) return `${index + 1}. `;
      if (isTask) return `- [ ] `;
      return "- ";
    };

    if (from === to) {
      const pos = from;
      const line = state.doc.lineAt(pos);
      const listInfo = getListPrefixAt(state, line.from);

      if (listInfo) {
        if (listInfo.type === type) {
          // Toggle off: replace list prefix with ""
          view.dispatch({
            changes: {
              from: listInfo.from,
              to: listInfo.from + listInfo.prefixLen,
              insert: "",
            },
          });
        } else {
          // Change type: replace list prefix with getPrefix(0)
          view.dispatch({
            changes: {
              from: listInfo.from,
              to: listInfo.from + listInfo.prefixLen,
              insert: getPrefix(0),
            },
          });
        }
      } else {
        // Insert prefix after indentation
        const indentStr = line.text.match(/^\s*/)?.[0] || "";
        view.dispatch({
          changes: {
            from: line.from + indentStr.length,
            to: line.from + indentStr.length,
            insert: getPrefix(0),
          },
        });
      }
    } else {
      const changes = [];
      const startLineNum = state.doc.lineAt(from).number;
      const endLineNum = state.doc.lineAt(to).number;

      for (let l = startLineNum; l <= endLineNum; l++) {
        const line = state.doc.line(l);
        const idx = l - startLineNum;
        const listInfo = getListPrefixAt(state, line.from);
        const newPrefix = getPrefix(idx);

        if (listInfo) {
          // Replace existing marker with newPrefix
          changes.push({
            from: listInfo.from,
            to: listInfo.from + listInfo.prefixLen,
            insert: newPrefix,
          });
        } else {
          // Insert newPrefix after indentation
          const indentStr = line.text.match(/^\s*/)?.[0] || "";
          changes.push({
            from: line.from + indentStr.length,
            to: line.from + indentStr.length,
            insert: newPrefix,
          });
        }
      }

      const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : "\n";
      const charAfter =
        to < state.doc.length ? state.sliceDoc(to, to + 1) : "\n";
      const secondCharBefore =
        from > 1 ? state.sliceDoc(from - 2, from - 1) : "\n";
      const secondCharAfter =
        to < state.doc.length - 1 ? state.sliceDoc(to + 1, to + 2) : "\n";

      let prefixSpacing = "";
      if (charBefore !== "\n") {
        prefixSpacing = "\n\n";
      } else if (secondCharBefore !== "\n") {
        prefixSpacing = "\n";
      }

      let suffixSpacing = "";
      if (charAfter !== "\n") {
        suffixSpacing = "\n\n";
      } else if (secondCharAfter !== "\n") {
        suffixSpacing = "\n";
      }

      if (prefixSpacing) {
        changes.push({ from, to: from, insert: prefixSpacing });
      }
      if (suffixSpacing) {
        changes.push({ from: to, to: to, insert: suffixSpacing });
      }

      const changeSet = state.changes(changes);
      const newFrom = changeSet.mapPos(from, 1);
      const newTo = changeSet.mapPos(to, 1);

      view.dispatch({
        changes,
        selection: { anchor: newFrom, head: newTo },
      });
    }
    view.focus();
  }

  /**
   * Returns the primary CodeMirror EditorView instance.
   * @returns {EditorView}
   */
  getView() {
    return this.#view;
  }

  /**
   * Returns the configured image upload handler, or null if not set.
   * @returns {function(File): Promise<string> | null}
   */
  getUploadHandler() {
    // @ts-ignore
    return this.onUploadImage || this.#options.onUploadImage || this.#options.element?.onUploadImage || null;
  }

  /**
   * Returns the list of component names.
   * @returns {ComponentOption[]}
   */
  getComponents() {
    return this.#components;
  }

  /**
   * Programmatically trigger the save callback with the current value.
   */
  triggerSave() {
    const docVal = this.getValue();
    this.#trigger("save", docVal);
  }

  /**
   * Add event listener.
   * @param {"change" | "save" | "statsUpdate"} event
   * @param {function(any): void} callback
   */
  on(event, callback) {
    if (!this.#listeners[event]) {
      this.#listeners[event] = [];
    }
    this.#listeners[event].push(callback);
  }

  /**
   * Calculates current document stats and fires callbacks and listeners.
   */
  #triggerStatsUpdate() {
    const stats = {
      words: this.getWordCount(),
      characters: this.getCharacterCount(),
      readTime: this.getReadTime(),
    };
    if (this.#options.onStatsUpdate) {
      this.#options.onStatsUpdate(stats);
    }
    this.#trigger("statsUpdate", stats);
  }

  /**
   * @param {string} event
   * @param {any} value
   */
  #trigger(event, value) {
    if (this.#listeners[event]) {
      this.#listeners[event].forEach((cb) => cb(value));
    }
  }

  /**
   * Screen reader announcer helper.
   * @param {string} msg
   */
  #announce(msg) {
    if (this.#announcer) {
      this.#announcer.textContent = "";
      setTimeout(() => {
        if (this.#announcer) {
          this.#announcer.textContent = msg;
        }
      }, 50);
    }
  }

  /**
   * Parses the document to extract frontmatter YAML content (without --- delimiters)
   * and the body markdown separately, using the Lezer syntax tree.
   * @returns {{ frontmatter: string, body: string }}
   */
  #parseFrontmatter() {
    const md = this.#view.state.doc.toString();
    const tree = syntaxTree(this.#view.state);
    let frontmatterTo = 0;
    tree.iterate({
      from: 0,
      to: Math.min(md.length, 500),
      enter(node) {
        if (node.name === "Frontmatter" && node.from === 0) {
          let dashCount = 0;
          const c = node.node.cursor();
          if (c.firstChild()) {
            do {
              if (c.name === "DashLine") {
                dashCount++;
              }
            } while (c.nextSibling());
          }
          if (dashCount >= 2) {
            frontmatterTo = node.to;
            return false;
          }
        }
      },
    });

    if (frontmatterTo > 0 && frontmatterTo <= md.length) {
      const raw = md.slice(0, frontmatterTo);
      // Extract YAML content between --- delimiters, stripping the fences themselves
      const yamlMatch = raw.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---/);
      const frontmatter = yamlMatch ? yamlMatch[1] : "";
      const body = md.slice(frontmatterTo).replace(/^\r?\n/, "");
      return { frontmatter, body };
    }

    return { frontmatter: "", body: md };
  }



  /**
  /**
   * Destroy the editor instance and clean up listeners.
   */
  destroy() {
    viewToEditor.delete(this.#view);
    if (this.#rawView) {
      viewToEditor.delete(this.#rawView);
      this.#rawView.destroy();
    }
    this.#view.destroy();
    this.#listeners = {};
  }
}

