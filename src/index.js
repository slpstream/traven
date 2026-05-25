import { EditorState, Extension, Annotation, Prec } from "@codemirror/state";
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
  foldGutter
} from "@codemirror/language";
import { classHighlighter } from "@lezer/highlight";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough, TaskList } from "@lezer/markdown";
import { yamlFrontmatter } from "@codemirror/lang-yaml";
import { undo, redo } from "@codemirror/commands";
import { search, openSearchPanel } from "@codemirror/search";
import { buildToolbar } from "./toolbar/toolbar.js";
import { TOOL_REGISTRY } from "./toolbar/tools.js";
import { wysiwymPlugin } from "./wysiwym.js";
import { delimiterSkipKeymap } from "./delimiter-skip.js";
import { imageDecorationPlugin, imageHandlerExtension } from "./images.js";

const syncAnnotation = Annotation.define();

export const DEFAULT_TOOLBAR = [
  "undo",
  "redo",
  "|",
  "bold",
  "italic",
  "strikethrough",
  "code",
  "|",
  "heading",
  "|",
  "bulletlist",
  "numberedlist",
  "blockquote",
  "hr",
  "|",
  "codeblock",
  "|",
  "datetime",
  "search",
  "fullscreen",
  "clear",
  "uppercase",
  "lowercase",
  "capitalize",
  "gotoline",
  "link",
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
 */

export class TravenEditor {
  /** @type {EditorView} */
  #view;
  /** @type {EditorView|null} */
  #rawView = null;
  /** @type {Object.<string, Function[]>} */
  #listeners = {};

  /**
   * @param {TravenOptions} options
   */
  constructor(options) {
    if (!options.element) {
      throw new Error("TravenEditor requires a parent element option.");
    }

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
      yamlFrontmatter({ content: markdown({ extensions: [Strikethrough, TaskList, { remove: ["SetextHeading"] }] }) }),
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

    // Optional raw editor setup
    if (options.sourceElement) {
      const rawExtensions = [
        ...buildBaseSetup({
          lineNumbers: showSourceLineNumbers,
          foldGutter: showSourceLineNumbers
        }),
        ...(wrapSourceLines ? [EditorView.lineWrapping] : []),
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
        })
      ];

      this.#rawView = new EditorView({
        parent: options.sourceElement,
        state: EditorState.create({
          doc: options.initialValue || "",
          extensions: rawExtensions
        })
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
   * Formats selection or line as a list (ordered or unordered).
   * @param {"ol" | "ul"} type
   */
  insertList(type) {
    const view = this.#view;
    const state = view.state;
    const { from, to } = state.selection.main;

    const isOL = type === 'ol';
    const getPrefix = (index) => isOL ? `${index + 1}. ` : '- ';

    if (from === to) {
      const pos = from;
      const line = state.doc.lineAt(pos);
      const text = line.text;
      const ulMatch = text.match(/^(-\s+)/);
      const olMatch = text.match(/^(\d+\.\s+)/);

      if (ulMatch) {
        const matchText = ulMatch[0];
        if (!isOL) {
          view.dispatch({ changes: { from: line.from, to: line.from + matchText.length, insert: '' } });
        } else {
          view.dispatch({ changes: { from: line.from, to: line.from + matchText.length, insert: '1. ' } });
        }
      } else if (olMatch) {
        const matchText = olMatch[0];
        if (isOL) {
          view.dispatch({ changes: { from: line.from, to: line.from + matchText.length, insert: '' } });
        } else {
          view.dispatch({ changes: { from: line.from, to: line.from + matchText.length, insert: '- ' } });
        }
      } else {
        const insertPrefix = getPrefix(0);
        view.dispatch({ changes: { from: line.from, to: line.from, insert: insertPrefix } });
      }
    } else {
      let selectedText = state.sliceDoc(from, to);
      const lines = selectedText.split(/\r?\n/);

      const listLines = lines.map((lineText, idx) => {
        const cleanLine = lineText.replace(/^([-\d+\.\s]+)/, '');
        return `${getPrefix(idx)}${cleanLine}`;
      });
      const insertion = listLines.join('\n');

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
   * Returns the primary CodeMirror EditorView instance.
   * @returns {EditorView}
   */
  getView() {
    return this.#view;
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
   * @param {"change" | "save"} event
   * @param {function(string): void} callback
   */
  on(event, callback) {
    if (!this.#listeners[event]) {
      this.#listeners[event] = [];
    }
    this.#listeners[event].push(callback);
  }

  /**
   * @param {string} event
   * @param {string} value
   */
  #trigger(event, value) {
    if (this.#listeners[event]) {
      this.#listeners[event].forEach((cb) => cb(value));
    }
  }

  /**
   * Destroy the editor instance and clean up listeners.
   */
  destroy() {
    this.#view.destroy();
    if (this.#rawView) {
      this.#rawView.destroy();
    }
    this.#listeners = {};
  }
}
