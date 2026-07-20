export const DEFAULT_TOOLBAR: string[];
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
 * @property {function(string): Promise<{title: string, url: string, slug?: string}[]>} [onSuggestLinks] - Optional host callback for link-modal autocomplete. When set, typing in the URL field requests suggestions (e.g. site pages). Hosts that omit it keep the classic text+URL modal.
 * @property {import("./plugins/TravenPlugin.js").TravenPlugin[]} [plugins] - Additional TravenPlugin instances registered at init (grammar, decorations, keymap, extensions, HTML render). Core built-ins always load; host plugins are appended.
 * @property {Object.<string, object>} [extraTools] - Optional host/plugin toolbar tool definitions merged via registerTools() at init. Must also list keys in `toolbar` to show buttons (never added to DEFAULT_TOOLBAR).
 * @property {"light" | "dark"} [theme] - Visual style theme.
 * @property {string} [caretColor] - Configurable caret color override.
 * @property {Array<string>|boolean} [toolbar=false] - Toolbar configuration array or false.
 * @property {string} [toolbarScope] - Optional localStorage scope for toolbar config persistence. Defaults to "default". Use distinct values for multi-editor pages.
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
 * @property {(html: string) => string} [sanitizeHtml] - Optional custom HTML sanitization function. If provided, it takes precedence and window.DOMPurify auto-detection is skipped. If the sanitizer throws an error, it propagates to the caller.
 */
export class TravenEditor {
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
    static configureMermaid(options: boolean | string | object): void;
    /**
     * Initialize mermaid diagrams in a container element after content is rendered.
     * This should be called after getContentHtml() output is inserted into the DOM.
     *
     * @param {HTMLElement} container - Container element to scan for mermaid diagrams
     * @returns {Promise<void>}
     */
    static initMermaid(container: HTMLElement): Promise<void>;
    /**
     * @param {TravenOptions} options
     */
    constructor(options: TravenOptions);
    /**
     * Returns the integrator's original toolbar configuration array.
     * Used by the settings modal to scope which tools are configurable.
     * @returns {string[]}
     */
    getToolbarConfig(): string[];
    /**
     * Returns the toolbar localStorage scope key.
     * @returns {string|undefined}
     */
    getToolbarScope(): string | undefined;
    /**
     * Tears down and rebuilds the static/hybrid toolbar using the current
     * saved user preferences from localStorage.
     */
    rebuildToolbar(): void;
    /**
     * Triggers history undo on the currently focused editor.
     */
    undo(): void;
    /**
     * Triggers history redo on the currently focused editor.
     */
    redo(): void;
    getValue(): string;
    /**
     * @param {string} value - The new content to replace the entire document.
     */
    setValue(value: string): void;
    /**
     * Focuses the primary editor.
     */
    focus(): void;
    /**
     * Sets the editor to read-only or read-write mode dynamically.
     * @param {boolean} readOnly
     */
    setReadOnly(readOnly: boolean): void;
    /**
     * Returns whether the editor is currently in read-only mode.
     * @returns {boolean}
     */
    isReadOnly(): boolean;
    /**
     * Returns the currently selected text.
     * @returns {string}
     */
    getSelection(): string;
    /**
     * Sets the selection range in the editor.
     * @param {number} anchor - The anchor of the selection.
     * @param {number} [head] - The head of the selection. Defaults to anchor (caret position).
     */
    setSelection(anchor: number, head?: number): void;
    /**
     * Replaces the current selection with the given text.
     * If nothing is selected, inserts at cursor position.
     * @param {string} text - The text to insert.
     */
    replaceSelection(text: string): void;
    /**
     * Sets the editor theme dynamically.
     * @param {"light" | "dark"} theme
     */
    setTheme(theme: "light" | "dark"): void;
    /**
     * Toggles Vim keybindings dynamically.
     * @param {boolean} enabled
     */
    setVimMode(enabled: boolean): void;
    /**
     * Returns the total character count of the document.
     * @returns {number}
     */
    getCharacterCount(): number;
    /**
     * Returns the total word count of the document.
     * @returns {number}
     */
    getWordCount(): number;
    /**
     * Returns the estimated reading time of the document in minutes.
     * @returns {number}
     */
    getReadTime(): number;
    /**
     * Returns a snapshot of the current editor state optimized for external agents.
     * Includes the full raw markdown, split frontmatter/body, current selection,
     * cursor position, and document statistics.
     * @returns {{ markdown: string, frontmatter: string, body: string, selection: string, cursor: { line: number, column: number }, lineCount: number, stats: { words: number, characters: number, readTime: number } }}
     */
    getMarkdownState(): {
        markdown: string;
        frontmatter: string;
        body: string;
        selection: string;
        cursor: {
            line: number;
            column: number;
        };
        lineCount: number;
        stats: {
            words: number;
            characters: number;
            readTime: number;
        };
    };
    /**
     * Registers a custom markdown rendering function.
     * @param {function(string): string} renderFn - The rendering function.
     */
    registerRenderer(renderFn: (arg0: string) => string): void;
    /**
     * Returns the rendered HTML of the current document content.
     * @returns {string} HTML representation of the document.
     */
    getContentHtml(): string;
    /**
     * Inserts formatting syntax around selected text or placeholder.
     * @param {string} before - Text to prepend.
     * @param {string} after - Text to append.
     * @param {string} [placeholder] - Text placeholder if no range is selected.
     */
    insertSnippet(before: string, after: string, placeholder?: string): void;
    /**
     * Inserts the current date and time (YYYY-MM-DD HH:MM) at the cursor or selection.
     */
    insertDateTime(): void;
    /**
     * Clears all document content and refocuses the editor.
     */
    clear(): void;
    /**
     * Converts the current selection to UPPERCASE.
     * Preserves the selection bounds after transformation.
     */
    toUpperCase(): void;
    /**
     * Converts the current selection to lowercase.
     * Preserves the selection bounds after transformation.
     */
    toLowerCase(): void;
    /**
     * Capitalizes the first letter of each word in the current selection.
     * Preserves the selection bounds after transformation.
     */
    capitalizeWords(): void;
    /**
     * Strips block-level and inline Markdown formatting from the current selection,
     * excluding links and images which are kept intact.
     */
    removeFormatting(): void;
    /**
     * Toggles fullscreen mode on the editor's parent container.
     * Targets the nearest .editor-wrapper ancestor (toolbar + editor),
     * falling back to the immediate parent element.
     */
    toggleFullscreen(): void;
    /**
     * Opens the CodeMirror search panel.
     */
    openSearch(): void;
    /**
     * Moves the cursor to the specified line number and scrolls it into view.
     * @param {number} lineNumber - 1-indexed line number. Clamped to document bounds.
     */
    goToLine(lineNumber: number): void;
    /**
     * Wraps the current selection in a markdown code block.
     */
    insertCodeBlock(): void;
    /**
     * Inserts a horizontal rule, handling spacing.
     */
    insertHR(): void;
    /**
     * Inserts a block of markdown at the specified position with proper blank-line spacing.
     * Handles edge cases at document start/end and avoids doubling existing blank lines.
     * @param {string} text - The markdown block to insert.
     * @param {"before" | "after" | "start" | "end"} [position="after"] - Where to insert relative to cursor line or document bounds.
     */
    insertBlock(text: string, position?: "before" | "after" | "start" | "end"): void;
    /**
     * Inserts a standard 3x3 markdown table template, handling surrounding spacing.
     */
    insertTable(): void;
    /**
     * Sets or toggles heading level for the active line.
     * @param {number} level - Heading level (1 to 6).
     */
    setHeading(level: number): void;
    /**
     * Formats selection or line as blockquote.
     */
    insertBlockquote(): void;
    /**
     * Formats selection or line as a list (ordered, unordered, or task/checklist).
     * @param {"ol" | "ul" | "task"} type
     */
    insertList(type: "ol" | "ul" | "task"): void;
    /**
     * Returns the primary CodeMirror EditorView instance.
     * @returns {EditorView}
     */
    getView(): EditorView;
    /**
     * Returns the configured image upload handler, or null if not set.
     * @returns {function(File): Promise<string> | null}
     */
    getUploadHandler(): (arg0: File) => Promise<string> | null;
    /**
     * Returns the configured link-suggestion handler, or null if not set.
     * Used by the Insert Link modal for host-provided title/URL autocomplete.
     * @returns {function(string): Promise<{title: string, url: string, slug?: string}[]> | null}
     */
    getSuggestLinks(): (arg0: string) => Promise<{
        title: string;
        url: string;
        slug?: string;
    }[]> | null;
    /**
     * Returns the list of component names.
     * @returns {ComponentOption[]}
     */
    getComponents(): ComponentOption[];
    /**
     * Programmatically trigger the save callback with the current value.
     */
    triggerSave(): void;
    /**
     * Add event listener.
     * @param {"change" | "save" | "statsUpdate"} event
     * @param {function(any): void} callback
     */
    on(event: "change" | "save" | "statsUpdate", callback: (arg0: any) => void): void;
    /**
    /**
     * Destroy the editor instance and clean up listeners.
     */
    destroy(): void;
    #private;
}
export type ComponentAttribute = {
    /**
     * - Attribute name
     */
    name: string;
    /**
     * - Attribute type (e.g., "text", "boolean")
     */
    type: string;
    /**
     * - UI label
     */
    label?: string;
    /**
     * - Placeholder text
     */
    placeholder?: string;
};
export type ComponentSchema = {
    /**
     * - Component name
     */
    name: string;
    /**
     * - Defined attribute schemas
     */
    attributes?: ComponentAttribute[];
};
export type ComponentOption = string | ComponentSchema;
export type TravenOptions = {
    /**
     * - The DOM container to mount the editor in.
     */
    element: HTMLElement;
    /**
     * - Optional container to mount the raw source editor in.
     */
    sourceElement?: HTMLElement;
    /**
     * - The initial markdown document string.
     */
    initialValue: string;
    /**
     * - Show line numbers in the primary editor.
     */
    lineNumbers?: boolean;
    /**
     * - Show line numbers in the raw source editor.
     */
    sourceLineNumbers?: boolean;
    /**
     * - Enable soft line wrapping in the primary editor.
     */
    lineWrapping?: boolean;
    /**
     * - Enable soft line wrapping in the raw source editor.
     */
    sourceLineWrapping?: boolean;
    /**
     * - Callback fired on document changes.
     */
    onChange?: (arg0: string) => void;
    /**
     * - Callback fired on manual save command (Cmd+S / Ctrl+S).
     */
    onSave?: (arg0: string) => void;
    /**
     * - Callback handling image uploads.
     */
    onUploadImage?: (arg0: File) => Promise<string>;
    /**
     * - Optional host callback for link-modal autocomplete. When set, typing in the URL field requests suggestions (e.g. site pages). Hosts that omit it keep the classic text+URL modal.
     */
    onSuggestLinks?: (arg0: string) => Promise<{
        title: string;
        url: string;
        slug?: string;
    }[]>;
    /**
     * - Additional TravenPlugin instances registered at init (grammar, decorations, keymap, extensions, HTML render). Core built-ins always load; host plugins are appended.
     */
    plugins?: import("./plugins/TravenPlugin.js").TravenPlugin[];
    /**
     * - Optional host/plugin toolbar tool definitions merged via registerTools() at init. Must also list keys in `toolbar` to show buttons (never added to DEFAULT_TOOLBAR).
     */
    extraTools?: {
        [x: string]: any;
    };
    /**
     * - Visual style theme.
     */
    theme?: "light" | "dark";
    /**
     * - Configurable caret color override.
     */
    caretColor?: string;
    /**
     * - Toolbar configuration array or false.
     */
    toolbar?: Array<string> | boolean;
    /**
     * - Optional localStorage scope for toolbar config persistence. Defaults to "default". Use distinct values for multi-editor pages.
     */
    toolbarScope?: string;
    /**
     * - Pre-defined custom components options array.
     */
    components?: ComponentOption[];
    /**
     * - URL/path to load components schema, or false.
     */
    componentsUrl?: string | boolean;
    /**
     * - Configure/enable KaTeX math formatting option.
     */
    katex?: any;
    /**
     * - Custom keybindings map.
     */
    keybindings?: {
        [x: string]: string;
    };
    /**
     * - Set editor to read-only mode.
     */
    readOnly?: boolean;
    /**
     * - Enable Vim mode.
     */
    vimMode?: boolean;
    /**
     * - Callback when stats are updated.
     */
    onStatsUpdate?: (arg0: {
        words: number;
        characters: number;
        readTime: number;
    }) => void;
    /**
     * - Effective mode for toolbar layout ("static" | "floating" | "hybrid").
     */
    toolbarMode?: string;
    /**
     * - Key binding to open selection bubble.
     */
    bubbleHotkey?: string;
    /**
     * - Key binding to open gutter plus menu.
     */
    gutterHotkey?: string;
    /**
     * - Enable or disable the gutter block insertion sidebar. Set to false to remove the "+" gutter column that shifts content right.
     */
    gutterInserter?: boolean;
    /**
     * - Delay in ms between pointer settling on a stable selection and the selection bubble appearing. Set to 0 to restore the previous eager-appear behavior.
     */
    bubbleAppearDelay?: number;
    /**
     * - Auto-inject core CSS from CDN/local bundle. Set to false for strict CSP environments.
     */
    autoLoadStyles?: boolean;
    /**
     * - Optional CodeMirror LanguageDescription array (e.g. from
     */
    codeLanguages?: any;
};
import { EditorView } from "@codemirror/view";
