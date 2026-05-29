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
  keymap
} from "@codemirror/view";
import {
  history,
  defaultKeymap,
  historyKeymap,
  indentWithTab
} from "@codemirror/commands";
import {
  foldKeymap,
  syntaxHighlighting,
  bracketMatching,
  foldGutter,
  syntaxTree
} from "@codemirror/language";
import { classHighlighter } from "@lezer/highlight";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough, TaskList, Table, Autolink } from "@lezer/markdown";
import { Highlight } from "./highlight-parser.js";
import { Shortcode } from "./shortcode-parser.js";
import { ComponentShortcode } from "./component-parser.js";
import { MathExtension, ensureKatex, configureKatex } from "./math-parser.js";
import { yamlFrontmatter } from "@codemirror/lang-yaml";
import { undo, redo } from "@codemirror/commands";
import { search, openSearchPanel } from "@codemirror/search";
import { buildToolbar } from "./toolbar/toolbar.js";
import { TOOL_REGISTRY } from "./toolbar/tools.js";
import { wysiwymPlugin, getListPrefixAt, getListStrippingRanges, isInCodeBlock } from "./wysiwym.js";
import { delimiterSkipKeymap } from "./delimiter-skip.js";
import { imageDecorationPlugin, imageHandlerExtension } from "./images.js";
import { vim } from "@replit/codemirror-vim";
import { viewToEditor } from "./bridge.js";
import { sanitizeUrl } from "./security.js";
import DEFAULT_COMPONENTS from "./components-default.json";
import "./style.css";

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
  "|",
  "datetime",
  "search",
  "link",
  "image",
  "fullscreen",
  "clear",
  "uppercase",
  "lowercase",
  "capitalize",
  "removeformatting",
  "gotoline",
  "help"
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
      indentWithTab
    ])
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
 * @property {string[]} [components] - Pre-defined custom components options array.
 * @property {string|boolean} [componentsUrl="assets/components.json"] - URL/path to load components schema, or false.
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
  /** @type {string[]} */
  #components;

  /**
   * @param {TravenOptions} options
   */
  constructor(options) {
    if (!options.element) {
      throw new Error("TravenEditor requires a parent element option.");
    }
    this.#options = options;

    // Initialize component name schema options with fallbacks
    this.#components = DEFAULT_COMPONENTS;
    if (options.components && Array.isArray(options.components) && options.components.length > 0) {
      this.#components = options.components;
    } else if (options.componentsUrl !== false) {
      const url = options.componentsUrl || "assets/components.json";
      fetch(url)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to load component schema: status ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            this.#components = data;
          } else {
            console.warn(`Component schema from ${url} is empty or invalid. Falling back to default presets.`);
          }
        })
        .catch(err => {
          console.warn(`Failed to fetch component schema from ${url}. Falling back to default presets:`, err);
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

    // Render and prepend toolbar if provided in constructor options
    if (options.toolbar && Array.isArray(options.toolbar)) {
      const toolbarEl = buildToolbar(this, options.toolbar, options.keybindings);
      options.element.prepend(toolbarEl);
    }

    const extensions = [
      ...buildBaseSetup({
        lineNumbers: showLineNumbers,
        foldGutter: showLineNumbers
      }),
      ...(wrapLines ? [EditorView.lineWrapping] : []),
      readOnlyCompartment.of(EditorState.readOnly.of(!!options.readOnly)),
      yamlFrontmatter({ content: markdown({ extensions: [Strikethrough, TaskList, Table, Autolink, Highlight, Shortcode, ComponentShortcode, MathExtension, { remove: ["SetextHeading"] }] }) }),
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
          if (this.#rawView && !update.transactions.some(tr => tr.annotation(syncAnnotation))) {
            this.#rawView.dispatch({
              changes: update.changes,
              annotations: syncAnnotation.of(true)
            });
          }

          this.#triggerStatsUpdate();
        }
      }),

      // Optimistic image upload and drop/paste handling
      imageHandlerExtension(options.onUploadImage),

      // Search panel (provides Ctrl+F keybinding and search UI)
      search()
    ];

    // Caret color configuration
    const defaultCaret = options.caretColor || (options.theme === "dark" ? "#ffffff" : "#000000");
    const themeExtension = EditorView.theme({
      ".cm-cursor": { borderLeftColor: `${defaultCaret} !important` },
      ".cm-fat-cursor": { backgroundColor: `${defaultCaret} !important` }
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
      }
    });
    extensions.push(saveHandler);

    // Dynamic keyboard shortcuts keymap registration
    const keymapBindings = [];
    const customKeybindings = options.keybindings || {};
    for (const key of Object.keys(TOOL_REGISTRY)) {
      const tool = TOOL_REGISTRY[key];
      const bindingStr = key in customKeybindings ? customKeybindings[key] : tool.keybinding;
      if (bindingStr) {
        keymapBindings.push({
          key: bindingStr,
          run: () => {
            const buttonEl = options.element && typeof options.element.querySelector === "function"
              ? options.element.querySelector(`.toolbar-btn.btn-${key}`)
              : null;
            tool.action(this, buttonEl);
            return true;
          }
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
        extensions
      })
    });

    // Register this editor instance in the view↔editor bridge
    // so that widget classes (e.g. TableWidget) can resolve the
    // TravenEditor from an EditorView without circular imports.
    viewToEditor.set(this.#view, this);

    if (options.theme === "dark") {
      this.#view.dom.classList.add("cm-wysiwym-dark");
    }

    // Optional raw editor setup
    if (options.sourceElement) {
      const rawExtensions = [
        ...buildBaseSetup({
          lineNumbers: showSourceLineNumbers,
          foldGutter: showSourceLineNumbers
        }),
        ...(wrapSourceLines ? [EditorView.lineWrapping] : []),
        readOnlyCompartment.of(EditorState.readOnly.of(!!options.readOnly)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // Propagate change back to primary editor
            if (!update.transactions.some(tr => tr.annotation(syncAnnotation))) {
              this.#view.dispatch({
                changes: update.changes,
                annotations: syncAnnotation.of(true)
              });
            }
          }
        }),
        vimCompartment.of(options.vimMode ? vim() : [])
      ];

      this.#rawView = new EditorView({
        parent: options.sourceElement,
        state: EditorState.create({
          doc: options.initialValue || "",
          extensions: rawExtensions
        })
      });

      if (options.theme === "dark") {
        this.#rawView.dom.classList.add("cm-wysiwym-dark");
      }
    }

    // Trigger initial stats calculation asynchronously to allow event listeners to bind first
    Promise.resolve().then(() => {
      this.#triggerStatsUpdate();
    });
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

  /**
   * @returns {string} The full document content as a Markdown string.
   */
  getValue() {
    return this.#view.state.doc.toString();
  }

  /**
   * @param {string} value - The new content to replace the entire document.
   */
  setValue(value) {
    this.#view.dispatch({
      changes: { from: 0, to: this.#view.state.doc.length, insert: value }
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
      effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly))
    });
    if (this.#rawView) {
      this.#rawView.dispatch({
        effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly))
      });
    }
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
      selection: { anchor, head }
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
  }

  /**
   * Toggles Vim keybindings dynamically.
   * @param {boolean} enabled
   */
  setVimMode(enabled) {
    const extension = enabled ? vim() : [];
    this.#view.dispatch({
      effects: vimCompartment.reconfigure(extension)
    });
    if (this.#rawView) {
      this.#rawView.dispatch({
        effects: vimCompartment.reconfigure(extension)
      });
    }
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
    return this.#fallbackRender(val);
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
      selection: placeholder && !hadSelection
        ? { anchor: range.from + lead.length + before.length, head: range.from + lead.length + before.length + selectedText.length }
        : { anchor: range.from + lead.length + before.length + selectedText.length + after.length }
    });
    this.#view.focus();
  }

  /**
   * Inserts the current date and time (YYYY-MM-DD HH:MM) at the cursor or selection.
   */
  insertDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day} ${hours}:${minutes}`;
    this.insertSnippet('', '', dateStr);
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
      selection: { anchor: range.from, head: range.from + transformed.length }
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
      selection: { anchor: range.from, head: range.from + transformed.length }
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
      selection: { anchor: range.from, head: range.from + capitalized.length }
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

      if (/^\s*```\w*$/.test(line.text) || /^\s*([-*_])\1{2,}\s*$/.test(line.text)) {
        continue;
      }

      const stripRange = listRanges.find(r => {
        return r.from >= line.from && r.to <= line.to;
      });

      if (stripRange) {
        const stripStartOffset = Math.max(0, stripRange.from - lineSelStart);
        const stripEndOffset = Math.min(lineText.length, stripRange.to - lineSelStart);
        if (stripEndOffset > stripStartOffset) {
          lineText = lineText.slice(0, stripStartOffset) + lineText.slice(stripEndOffset);
        }
      }

      lineText = lineText.replace(/^\s*(>\s*)+/, '');
      lineText = lineText.replace(/^\s*#{1,6}\s+/, '');

      processedLines.push(lineText);
    }

    let text = processedLines.join('\n');

    // 2. Process inline formatting (excluding links and images)
    // Strip bold/italic emphasis (longest delimiters first)
    text = text.replace(/(\*{3}|_{3})(.+?)\1/g, '$2');
    text = text.replace(/(\*{2}|_{2})(.+?)\1/g, '$2');
    text = text.replace(/(\*|_)(.+?)\1/g, '$2');
    // Strip strikethrough: ~~text~~
    text = text.replace(/~~(.+?)~~/g, '$1');
    // Strip highlights: ==text==
    text = text.replace(/==(.+?)==/g, '$1');
    // Strip inline code: `text`
    text = text.replace(/`([^`]+)`/g, '$1');

    this.#view.dispatch({
      changes: { from: range.from, to: range.to, insert: text },
      selection: { anchor: range.from, head: range.from + text.length }
    });
    this.#view.focus();
  }



  /**
   * Toggles fullscreen mode on the editor's parent container.
   * Targets the nearest .editor-wrapper ancestor (toolbar + editor),
   * falling back to the immediate parent element.
   */
  toggleFullscreen() {
    const container = this.#view.dom.closest('.editor-wrapper')
                   || this.#view.dom.parentElement;
    container.classList.toggle('is-fullscreen');
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
      scrollIntoView: true
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

    let selectionText = hadSelection ? state.sliceDoc(from, to) : '';

    const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : '\n';
    const prefixSpacing = charBefore !== '\n' ? '\n' : '';

    const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : '\n';
    const suffixSpacing = charAfter !== '\n' ? '\n' : '';

    let finalInsert = '';
    let newAnchor = 0;
    let newHead = 0;

    if (!hadSelection) {
      const insertion = '```\n\n```';
      finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;
      newAnchor = from + prefixSpacing.length + 4;
      newHead = newAnchor;
    } else {
      let middleText = selectionText;
      if (!middleText.startsWith('\n')) {
        middleText = '\n' + middleText;
      }
      if (!middleText.endsWith('\n')) {
        middleText = middleText + '\n';
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
      selection: { anchor: newAnchor, head: newHead }
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

    const insertion = '---';

    const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : '\n';
    const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : '\n';

    const secondCharBefore = from > 1 ? state.sliceDoc(from - 2, from - 1) : '\n';

    let prefixSpacing = '';
    if (charBefore !== '\n') {
      prefixSpacing = '\n\n';
    } else if (secondCharBefore !== '\n') {
      prefixSpacing = '\n';
    }

    let suffixSpacing = '';
    if (charAfter !== '\n') {
      suffixSpacing = '\n';
    }

    const finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;

    view.dispatch({
      changes: { from, to, insert: finalInsert },
      selection: { anchor: from + prefixSpacing.length + insertion.length }
    });
    view.focus();
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

    const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : '\n';
    const secondCharBefore = from > 1 ? state.sliceDoc(from - 2, from - 1) : '\n';

    let prefixSpacing = '';
    if (charBefore !== '\n') {
      prefixSpacing = '\n\n';
    } else if (secondCharBefore !== '\n') {
      prefixSpacing = '\n';
    }

    const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : '\n';
    let suffixSpacing = '';
    if (charAfter !== '\n') {
      suffixSpacing = '\n';
    }

    const finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;

    // Select the "Header 1" text for easy editing.
    // "Header 1" starts after the leading "| " (length 2) of the table insertion.
    const selStart = from + prefixSpacing.length + 2;
    const selEnd = selStart + 8; // length of "Header 1"

    view.dispatch({
      changes: { from, to, insert: finalInsert },
      selection: { anchor: selStart, head: selEnd }
    });
    view.focus();
  }

  /**
   * Sets or toggles heading level for the active line.
   * @param {number} level - Heading level (1 to 6).
   */
  setHeading(level) {
    const view  = this.#view;
    const state = view.state;
    const pos   = state.selection.main.head;
    const line  = state.doc.lineAt(pos);
    const existingPrefix = line.text.match(/^(#{1,6}\s*)/)?.[0] || '';

    const prefix = level > 0 ? '#'.repeat(level) + ' ' : '';

    if (existingPrefix === prefix) {
      view.dispatch({
        changes: { from: line.from, to: line.from + existingPrefix.length, insert: '' }
      });
    } else {
      view.dispatch({
        changes: { from: line.from, to: line.from + existingPrefix.length, insert: prefix }
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
      const existingPrefix = line.text.match(/^(>\s*)/)?.[0] || '';

      if (existingPrefix) {
        view.dispatch({
          changes: { from: line.from, to: line.from + existingPrefix.length, insert: '' }
        });
      } else {
        view.dispatch({
          changes: { from: line.from, to: line.from, insert: '> ' }
        });
      }
    } else {
      let selectedText = state.sliceDoc(from, to);
      const lines = selectedText.split(/\r?\n/);
      const quotedLines = lines.map(line => `> ${line}`);
      let insertion = quotedLines.join('\n');

      const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : '\n';
      const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : '\n';
      const secondCharBefore = from > 1 ? state.sliceDoc(from - 2, from - 1) : '\n';
      const secondCharAfter = to < state.doc.length - 1 ? state.sliceDoc(to + 1, to + 2) : '\n';

      let prefixSpacing = '';
      if (charBefore !== '\n') {
        prefixSpacing = '\n\n';
      } else if (secondCharBefore !== '\n') {
        prefixSpacing = '\n';
      }

      let suffixSpacing = '';
      if (charAfter !== '\n') {
        suffixSpacing = '\n\n';
      } else if (secondCharAfter !== '\n') {
        suffixSpacing = '\n';
      }

      const finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;

      view.dispatch({
        changes: { from, to, insert: finalInsert },
        selection: { anchor: from + prefixSpacing.length, head: from + prefixSpacing.length + insertion.length }
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

    const isOL = type === 'ol';
    const isTask = type === 'task';
    const getPrefix = (index) => {
      if (isOL) return `${index + 1}. `;
      if (isTask) return `- [ ] `;
      return '- ';
    };

    if (from === to) {
      const pos = from;
      const line = state.doc.lineAt(pos);
      const listInfo = getListPrefixAt(state, line.from);

      if (listInfo) {
        if (listInfo.type === type) {
          // Toggle off: replace list prefix with ""
          view.dispatch({
            changes: { from: listInfo.from, to: listInfo.from + listInfo.prefixLen, insert: '' }
          });
        } else {
          // Change type: replace list prefix with getPrefix(0)
          view.dispatch({
            changes: { from: listInfo.from, to: listInfo.from + listInfo.prefixLen, insert: getPrefix(0) }
          });
        }
      } else {
        // Insert prefix after indentation
        const indentStr = line.text.match(/^\s*/)?.[0] || "";
        view.dispatch({
          changes: { from: line.from + indentStr.length, to: line.from + indentStr.length, insert: getPrefix(0) }
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
            insert: newPrefix
          });
        } else {
          // Insert newPrefix after indentation
          const indentStr = line.text.match(/^\s*/)?.[0] || "";
          changes.push({
            from: line.from + indentStr.length,
            to: line.from + indentStr.length,
            insert: newPrefix
          });
        }
      }

      const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : '\n';
      const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : '\n';
      const secondCharBefore = from > 1 ? state.sliceDoc(from - 2, from - 1) : '\n';
      const secondCharAfter = to < state.doc.length - 1 ? state.sliceDoc(to + 1, to + 2) : '\n';

      let prefixSpacing = '';
      if (charBefore !== '\n') {
        prefixSpacing = '\n\n';
      } else if (secondCharBefore !== '\n') {
        prefixSpacing = '\n';
      }

      let suffixSpacing = '';
      if (charAfter !== '\n') {
        suffixSpacing = '\n\n';
      } else if (secondCharAfter !== '\n') {
        suffixSpacing = '\n';
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
        selection: { anchor: newFrom, head: newTo }
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
    return this.#options.onUploadImage || null;
  }

  /**
   * Returns the list of component names.
   * @returns {string[]}
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
      readTime: this.getReadTime()
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
   * Helper method to strip frontmatter from raw markdown content using Lezer's parsed syntax tree.
   * @param {string} md - The raw markdown content.
   * @returns {string} The markdown content without frontmatter.
   */
  #stripFrontmatter(md) {
    if (!this.#view) return md;
    const tree = syntaxTree(this.#view.state);
    let frontmatterTo = 0;
    tree.iterate({
      from: 0,
      to: Math.min(md.length, 500), // Only scan the document head
      enter(node) {
        if (node.name === "Frontmatter" && node.from === 0) {
          // A valid frontmatter block must contain both opening and closing DashLine nodes.
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
            return false; // stop iteration
          }
        }
      }
    });
    return frontmatterTo > 0 ? md.slice(frontmatterTo).replace(/^\r?\n/, "") : md;
  }

  /**
   * Simple fallback Markdown parser to HTML.
   * @param {string} md
   * @returns {string}
   */
  #fallbackRender(md) {
    // 1. Strip YAML frontmatter if present
    let content = this.#stripFrontmatter(md);

    // Extract component shortcodes to protect them and compile recursively
    const componentPlaceholders = [];
    const componentRegex = /\[(component|quote|pullquote|blockquote)((?:\s+[^\]]*|=\s*(?:"[^"]*"|'[^']*'|[^\s\]]+)(?:\s+[^\]]*)?)?)\]([\s\S]*?)\[\/\1\]/g;
    let prevContent;
    do {
      prevContent = content;
      content = content.replace(componentRegex, (match, tagName, attrsStr, body) => {
        const index = componentPlaceholders.length;
        
        const attrs = {};
        if (tagName === "component" && attrsStr.startsWith("=")) {
          const valMatch = attrsStr.match(/^=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/);
          if (valMatch) {
            attrs.name = valMatch[1] !== undefined ? valMatch[1] : (valMatch[2] !== undefined ? valMatch[2] : valMatch[3]);
          }
        }
        const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=]+))/g;
        let m;
        while ((m = attrRegex.exec(attrsStr)) !== null) {
          attrs[m[1]] = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : (m[4] || ""));
        }
        
        let compName = attrs.name || "";
        if (!compName) {
          if (tagName === "quote" || tagName === "blockquote") {
            compName = "blockquote";
          } else if (tagName === "pullquote") {
            compName = "pullquote";
          } else {
            compName = tagName;
          }
        }
        if (compName === "quote") {
          compName = "blockquote";
        }
        
        const compiledBody = this.#fallbackRender(body);
        
        let rendered = "";
        if (compName === "blockquote") {
          const author = attrs.author || "";
          const source = attrs.source || "";
          let citeHtml = "";
          if (author || source) {
            let citeText = "— ";
            if (author && source) {
              citeText += `${author}, ${source}`;
            } else {
              citeText += author || source;
            }
            citeHtml = `<footer><cite>${citeText}</cite></footer>`;
          }
          rendered = `<blockquote class="traven-component-blockquote">${compiledBody}${citeHtml}</blockquote>`;
        } else if (compName === "pullquote") {
          rendered = `<blockquote class="traven-component-pullquote">${compiledBody}</blockquote>`;
        } else {
          rendered = `<div class="traven-component traven-component-${compName}">${compiledBody}</div>`;
        }
        
        componentPlaceholders.push(rendered);
        return `\n\nCOMPONENT-PLACEHOLDER-INDEX-${index}\n\n`;
      });
    } while (content !== prevContent);
    
    // Extract fenced code blocks to avoid splitting them on empty lines or parsing inline elements inside
    const codeBlocks = [];
    content = content.replace(/^```\s*([a-zA-Z0-9_\-]*)([^\r\n]*)\r?\n([\s\S]*?)\r?\n```\s*$/gm, (match, lang, meta, code) => {
      const index = codeBlocks.length;
      const classAttr = lang ? ` class="language-${lang}"` : "";
      const escapedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      codeBlocks.push(`<pre><code${classAttr}>${escapedCode}</code></pre>`);
      return `\n\nCODEBLOCKPLACEHOLDER${index}\n\n`;
    });

    // Extract math blocks early to avoid conflict with markdown parsing/escaping
    const mathBlocks = [];
    // 1. Display math blocks ($$ ... $$)
    content = content.replace(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$/g, (match, math) => {
      const index = mathBlocks.length;
      let rendered = "";
      if (typeof window !== "undefined" && window.katex) {
        rendered = window.katex.renderToString(math, { displayMode: true, throwOnError: false });
      } else {
        rendered = `<div class="katex-display-fallback">$$${math}$$</div>`;
      }
      mathBlocks.push({ rendered, isDisplay: true });
      return `\n\nMATHBLOCKPLACEHOLDER${index}\n\n`;
    });

    // 2. Inline math ($ ... $)
    content = content.replace(/(?<!\\)\$((?!\s)[^\$\n\r]+?(?<!\s)(?<!\\))\$/g, (match, math) => {
      const index = mathBlocks.length;
      let rendered = "";
      if (typeof window !== "undefined" && window.katex) {
        rendered = window.katex.renderToString(math, { displayMode: false, throwOnError: false });
      } else {
        rendered = `<span class="katex-inline-fallback">$${math}$</span>`;
      }
      mathBlocks.push({ rendered, isDisplay: false });
      return `MATHBLOCKPLACEHOLDER${index}`;
    });

    // 1.5. Convert autolinks <url> before HTML escaping destroys the angle brackets
    content = content.replace(/<(https?:\/\/[^\s>]+)>/g, '[$1]($1)');

    // 1.6. Protect existing markdown links, image shortcodes, and inline code from being double-processed
    const inlineCodePlaceholders = [];
    content = content.replace(/(`[^`\n]+`)/g, (match) => {
      const index = inlineCodePlaceholders.length;
      inlineCodePlaceholders.push(match);
      return `__INLINE_CODE_PLACEHOLDER_${index}__`;
    });

    const shortcodePlaceholders = [];
    content = content.replace(/(\[image\s+[^\]]+\])/g, (match) => {
      const index = shortcodePlaceholders.length;
      shortcodePlaceholders.push(match);
      return `__IMAGE_SHORTCODE_PLACEHOLDER_${index}__`;
    });

    const linkPlaceholders = [];
    content = content.replace(/(!?\[[^\]]*\]\([^)]+\))/g, (match) => {
      const index = linkPlaceholders.length;
      linkPlaceholders.push(match);
      return `__LINK_PLACEHOLDER_${index}__`;
    });

    // 1.7. Convert naked URLs (http://, https://, www.)
    content = content.replace(/\b(https?:\/\/[^\s()<>]+|www\.[^\s()<>]+)\b/g, (match) => {
      // Clean up trailing punctuation if they are not balanced inside parentheses
      let cleanUrl = match;
      let trailing = "";
      const puncMatch = cleanUrl.match(/[.,;:?!)]+$/);
      if (puncMatch) {
        const punc = puncMatch[0];
        if (punc.endsWith(')') && (cleanUrl.match(/\(/g) || []).length >= (cleanUrl.match(/\)/g) || []).length) {
          // parentheses are balanced, do not strip
        } else {
          cleanUrl = cleanUrl.slice(0, -punc.length);
          trailing = punc;
        }
      }
      const href = cleanUrl.startsWith('www.') ? `https://${cleanUrl}` : cleanUrl;
      return `[${cleanUrl}](${href})${trailing}`;
    });

    // 1.8. Convert naked emails
    content = content.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, (match) => {
      return `[${match}](mailto:${match})`;
    });

    // 1.9. Restore protected placeholders
    content = content.replace(/__LINK_PLACEHOLDER_(\d+)__/g, (match, index) => {
      return linkPlaceholders[parseInt(index)];
    });
    content = content.replace(/__IMAGE_SHORTCODE_PLACEHOLDER_(\d+)__/g, (match, index) => {
      return shortcodePlaceholders[parseInt(index)];
    });
    content = content.replace(/__INLINE_CODE_PLACEHOLDER_(\d+)__/g, (match, index) => {
      return inlineCodePlaceholders[parseInt(index)];
    });

    // 2. Escape HTML characters to prevent XSS in fallback
    content = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 3. Convert headings & horizontal rules
    content = content.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
    content = content.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    content = content.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
    content = content.replace(/^#### (.*?)$/gm, "<h4>$1</h4>");
    content = content.replace(/^##### (.*?)$/gm, "<h5>$1</h5>");
    content = content.replace(/^###### (.*?)$/gm, "<h6>$1</h6>");
    content = content.replace(/^(\-\-\-|\*\*\*|\_\_\_)$/gm, "<hr>");
    
    // 4. Convert blockquotes (restore escaped gt)
    content = content.replace(/^&gt; (.*?)$/gm, "<blockquote>$1</blockquote>");

    // 4.5. Convert GFM tables
    const tableLines = content.split("\n");
    const processedTableLines = [];
    let inTable = false;
    let tableRows = [];

    const renderTableHtml = (rows) => {
      if (rows.length < 2) return rows.join("\n");
      const headerRow = rows[0];
      const separatorRow = rows[1];
      const isSeparator = /^[|\s:-]+$/.test(separatorRow);
      if (!isSeparator) return rows.join("\n");

      const parseCells = (rowText) => {
        let clean = rowText.trim();
        if (clean.startsWith("|")) clean = clean.slice(1);
        if (clean.endsWith("|")) clean = clean.slice(0, -1);
        return clean.split("|").map(cell => cell.trim());
      };

      // Parse GFM column alignments
      const separators = parseCells(separatorRow);
      const alignments = separators.map(sep => {
        const left = sep.startsWith(":");
        const right = sep.endsWith(":");
        if (left && right) return "center";
        if (right) return "right";
        if (left) return "left";
        return "";
      });

      const headers = parseCells(headerRow);
      let html = "<table>\n<thead>\n<tr>\n";
      headers.forEach((h, k) => {
        const align = alignments[k];
        const styleAttr = align ? ` style="text-align: ${align};"` : "";
        html += `<th${styleAttr}>${h}</th>\n`;
      });
      html += "</tr>\n</thead>\n<tbody>\n";

      for (let j = 2; j < rows.length; j++) {
        const cells = parseCells(rows[j]);
        html += "<tr>\n";
        for (let k = 0; k < headers.length; k++) {
          const align = alignments[k];
          const styleAttr = align ? ` style="text-align: ${align};"` : "";
          html += `<td${styleAttr}>${cells[k] || ""}</td>\n`;
        }
        html += "</tr>\n";
      }
      html += "</tbody>\n</table>";
      return html;
    };

    for (let i = 0; i < tableLines.length; i++) {
      const line = tableLines[i];
      const trimmed = line.trim();
      const isTableRow = trimmed.startsWith("|") && trimmed.length > 1;

      if (isTableRow) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(trimmed);
      } else {
        if (inTable) {
          processedTableLines.push(renderTableHtml(tableRows));
          inTable = false;
        }
        processedTableLines.push(line);
      }
    }
    if (inTable) {
      processedTableLines.push(renderTableHtml(tableRows));
    }
    content = processedTableLines.join("\n");

    // 5. Convert lists using an HTML5-compliant state-machine parser
    const listStack = [];
    const getIndentLength = (str) => str.replace(/\t/g, "    ").length;
    
    const lines = content.split("\n");
    const processedLines = [];
    
    for (const line of lines) {
      const listMatch = line.match(/^(\s*)(?:([-*+])|(\d+)\.)\s+(.*)$/);
      if (listMatch) {
        const indentStr = listMatch[1];
        const indent = getIndentLength(indentStr);
        const isOrdered = !!listMatch[3];
        const type = isOrdered ? "ol" : "ul";
        const rest = listMatch[4];
        
        // Parse checkboxes/task lists
        let checkboxHtml = "";
        let itemContent = rest;
        const taskMatch = rest.match(/^\[([ xX])\]\s+(.*)$/);
        if (taskMatch) {
          const checked = taskMatch[1].toLowerCase() === "x";
          checkboxHtml = `<input type="checkbox" disabled${checked ? " checked" : ""}> `;
          itemContent = taskMatch[2];
        }
        
        if (listStack.length === 0) {
          // Open new outer list
          listStack.push({ type, indent, hasOpenItem: true });
          processedLines.push(`<${type}>`);
          processedLines.push(`<li>${checkboxHtml}${itemContent}`);
        } else {
          let top = listStack[listStack.length - 1];
          if (indent > top.indent) {
            // Nest a new list inside the current open list item
            listStack.push({ type, indent, hasOpenItem: true });
            processedLines.push(`<${type}>`);
            processedLines.push(`<li>${checkboxHtml}${itemContent}`);
          } else {
            // Close nested lists if the indent is smaller
            while (listStack.length > 0 && listStack[listStack.length - 1].indent > indent) {
              const popped = listStack.pop();
              if (popped.hasOpenItem) {
                processedLines.push("</li>");
              }
              processedLines.push(`</${popped.type}>`);
            }
            
            if (listStack.length === 0) {
              listStack.push({ type, indent, hasOpenItem: true });
              processedLines.push(`<${type}>`);
              processedLines.push(`<li>${checkboxHtml}${itemContent}`);
            } else {
              top = listStack[listStack.length - 1];
              if (top.type !== type) {
                // Transition list type (e.g. ul -> ol) at same indent level
                listStack.pop();
                if (top.hasOpenItem) {
                  processedLines.push("</li>");
                }
                processedLines.push(`</${top.type}>`);
                listStack.push({ type, indent, hasOpenItem: true });
                processedLines.push(`<${type}>`);
                processedLines.push(`<li>${checkboxHtml}${itemContent}`);
              } else {
                // Add another item at the same indentation level
                if (top.hasOpenItem) {
                  processedLines.push("</li>");
                }
                top.hasOpenItem = true;
                processedLines.push(`<li>${checkboxHtml}${itemContent}`);
              }
            }
          }
        }
      } else {
        // Not a list item: close all open list tags
        while (listStack.length > 0) {
          const popped = listStack.pop();
          if (popped.hasOpenItem) {
            processedLines.push("</li>");
          }
          processedLines.push(`</${popped.type}>`);
        }
        processedLines.push(line);
      }
    }
    
    // Close any remaining list tags at end of content
    while (listStack.length > 0) {
      const popped = listStack.pop();
      if (popped.hasOpenItem) {
        processedLines.push("</li>");
      }
      processedLines.push(`</${popped.type}>`);
    }
    content = processedLines.join("\n");

    // 6. Convert inline elements (images, links, bold, italic, code)
    content = content.replace(/\[image\s+([^\]]+)\]/g, (match, attrsStr) => {
      const attrs = {};
      const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=]+))/g;
      let m;
      while ((m = attrRegex.exec(attrsStr)) !== null) {
        attrs[m[1]] = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : (m[4] || ""));
      }
      const src = sanitizeUrl(attrs.src || "");
      const caption = attrs.caption || "";
      const alt = attrs.alt || caption;
      const align = attrs.align || "center";
      const size = attrs.size || "medium";
      const customClass = attrs.class ? ` ${attrs.class}` : "";

      if (caption) {
        return `<figure class="traven-image-figure align-${align} size-${size}${customClass}"><img src="${src}" alt="${alt}" class="traven-image-shortcode"><figcaption class="traven-image-caption">${caption}</figcaption></figure>`;
      } else {
        return `<img src="${src}" alt="${alt}" class="traven-image-shortcode align-${align} size-${size}${customClass}">`;
      }
    });
    content = content.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => `<img src="${sanitizeUrl(src)}" alt="${alt}" class="traven-image-shortcode align-center size-medium">`);
    content = content.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => `<a href="${sanitizeUrl(url)}" target="_blank">${text}</a>`);
    content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    content = content.replace(/__(.*?)__/g, "<strong>$1</strong>");
    content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");
    content = content.replace(/_(.*?)_/g, "<em>$1</em>");
    content = content.replace(/==(.*?)==/g, "<mark>$1</mark>");
    content = content.replace(/~~(.*?)~~/g, "<del>$1</del>");
    content = content.replace(/`(.*?)`/g, "<code>$1</code>");

    // 7. Convert paragraphs (blank lines split)
    const blocks = content.split(/\n{2,}/);
    const htmlBlocks = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      
      // If it's a code block placeholder, don't wrap in <p>
      if (trimmed.startsWith("CODEBLOCKPLACEHOLDER")) {
        return trimmed;
      }
      
      // If it's a display math placeholder, don't wrap in <p>
      if (trimmed.startsWith("MATHBLOCKPLACEHOLDER")) {
        const idx = parseInt(trimmed.substring("MATHBLOCKPLACEHOLDER".length));
        if (mathBlocks[idx] && mathBlocks[idx].isDisplay) {
          return trimmed;
        }
      }

      // If it's a component placeholder, don't wrap in <p>
      if (trimmed.startsWith("COMPONENT-PLACEHOLDER-INDEX-")) {
        return trimmed;
      }
      
      // If it's already an HTML block tag, image, or hr, don't wrap in <p>
      if (/^<(h[1-6]|blockquote|ul|ol|li|img|hr|table|pre|figure)/i.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    });

    content = htmlBlocks.filter(Boolean).join("\n");

    // Restore math blocks
    for (let i = 0; i < mathBlocks.length; i++) {
      content = content.replace(`MATHBLOCKPLACEHOLDER${i}`, () => mathBlocks[i].rendered);
    }

    // Restore fenced code blocks
    for (let i = 0; i < codeBlocks.length; i++) {
      content = content.replace(`CODEBLOCKPLACEHOLDER${i}`, () => codeBlocks[i]);
    }

    // Restore component placeholders
    let restored;
    do {
      restored = false;
      content = content.replace(/COMPONENT-PLACEHOLDER-INDEX-(\d+)/g, (match, index) => {
        restored = true;
        return componentPlaceholders[parseInt(index)];
      });
    } while (restored);

    return content;
  }

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

export { getCM } from "@replit/codemirror-vim";
