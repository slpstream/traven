import { EditorState, Extension, Annotation } from "@codemirror/state";
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
import { yamlFrontmatter } from "@codemirror/lang-yaml";
import { undo, redo } from "@codemirror/commands";
import { wysiwymPlugin } from "./wysiwym.js";
import { delimiterSkipKeymap } from "./delimiter-skip.js";
import { imageDecorationPlugin, imageHandlerExtension } from "./images.js";

const syncAnnotation = Annotation.define();

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
 * @property {function(string): void} [onChange] - Callback fired on document changes.
 * @property {function(string): void} [onSave] - Callback fired on manual save command (Cmd+S / Ctrl+S).
 * @property {function(File): Promise<string>} [onUploadImage] - Callback handling image uploads.
 * @property {"light" | "dark"} [theme] - Visual style theme.
 * @property {string} [caretColor] - Configurable caret color override.
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

    const extensions = [
      ...buildBaseSetup({
        lineNumbers: showLineNumbers,
        foldGutter: showLineNumbers
      }),
      yamlFrontmatter({ content: markdown() }),
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
      imageHandlerExtension(options.onUploadImage)
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
