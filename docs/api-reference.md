# API Reference

This document provides a detailed reference of the options, methods, formatting helpers, and events available on the `TravenEditor` instance.

---

## `new TravenEditor(options)`

Initializes a new editor instance.

### Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `element` | `HTMLElement` | *(Required)* | The DOM element inside which the WYSIWYM editor will mount. |
| `sourceElement` | `HTMLElement` | `null` | Optional DOM element to mount the secondary raw editor for live sync. |
| `initialValue` | `string` | `""` | The starting Markdown document string. |
| `lineNumbers` | `boolean` | `false` | Show line numbers and folding gutters in the primary editor. |
| `sourceLineNumbers`| `boolean` | `false` | Show line numbers and gutters in the raw sync editor. |
| `lineWrapping` | `boolean` | `true` | Enable soft line wrapping in the primary editor. |
| `sourceLineWrapping`| `boolean` | `true` | Enable soft line wrapping in the raw sync editor. |
| `onChange` | `function` | `null` | Callback fired on change: `(value: string) => void`. |
| `onSave` | `function` | `null` | Callback fired on Save command (Cmd+S / Ctrl+S): `(value: string) => void`. |
| `onUploadImage` | `function` | `null` | Callback returning a promise of the uploaded image's URL: `(file: File) => Promise<string>`. |
| `onSuggestLinks` | `function` | `null` | Optional host callback for Insert Link modal autocomplete: `(query: string) => Promise<{ title: string, url: string, slug?: string }[]>`. When omitted, the modal stays text + URL only. Also powers Expand/Embed slug typeahead when those plugin tools are loaded. |
| `imageAspectOptions` | `Array<{ value: string, label: string }>` | `null` | Optional host-declared aspect choices for the Edit/Insert Image modal. When set and non-empty, advanced mode shows an Aspect pill row between Layout and CSS Class; selected values are managed as `class` tokens on `[image class="…"]`. Omit or pass `[]` to leave the modal unchanged. |
| `onListHeadings` | `function` | `null` | Optional host callback for Expand/Embed Heading dropdown: `(slug: string) => Promise<{ title: string, level?: number }[]>`. When set (and `onListExpandTargets` is omitted), the expand-embed insert modal uses a `<select>` (Whole post + sections) instead of free-text. |
| `onListExpandTargets` | `function` | `null` | Optional richer Expand/Embed target picker: `(slug: string) => Promise<{ summary?: string\|null, deck?: string\|null, headings: { title: string, level?: number }[] }>`. When set, the modal offers Whole post \| Summary (if summary non-empty) \| Deck (if deck non-empty) \| section headings. Preferred over `onListHeadings`. |
| `onStatsUpdate` | `function` | `null` | Callback fired when document stats change: `(stats: { words: number, characters: number, readTime: number }) => void`. |
| `theme` | `"light" \| "dark"`| `"light"` | Configures baseline cursor theme variables and dark mode class triggers. |
| `caretColor` | `string` | `""` | Custom hex color for the editor caret overrides. |
| `toolbar` | `Array<string> \| boolean`| `false` | A list of tool key strings defining the toolbar buttons layout, or `false` to disable the toolbar. |
| `bubbleToolbar` | `Array<string>` | *(DEFAULT_BUBBLE_TOOLBAR)* | Optional tool keys for the selection bubble. Omit to keep the default bubble. Registered host tools (`extraTools` / `registerTools`) must also appear here to show on the bubble. Separators (`"|"`) are skipped. |
| `toolbarScope` | `string` | `"default"` | Optional localStorage scope for toolbar config persistence. Use distinct values for multi-editor pages. |
| `vimMode` | `boolean` | `false` | Enables Vim keybindings and normal mode emulation in both editing panes. |
| `readOnly` | `boolean` | `false` | Enables read-only mode for both primary and secondary editor panes. |
| `keybindings` | `object` | `{}` | Key-value pairs overriding default tool keybindings (e.g. `{ bold: "Ctrl-Shift-b" }`). |
| `katex` | `boolean \| string \| object` | `false` | Configures KaTeX loading. If `false` (default), only uses local preloaded `window.katex`. If `true`, loads from JSDelivr CDN. If a string or object, defines custom self-hosted paths (e.g. `{ js: "path/to/katex.js", css: "path/to/katex.css" }`). |
| `components` | `Array<string \| object>` | *(Default presets)* | Pre-defined custom component schemas. |
| `componentsUrl` | `string \| boolean` | `"assets/components.json"` | Path/URL to load custom component schemas, or `false` to disable. |
| `toolbarMode` | `"static" \| "floating" \| "hybrid"` | `"static"` | Presentation layout mode for the toolbar. |
| `bubbleHotkey` | `string` | `"Mod-."` | Keyboard hotkey to open the selection bubble. |
| `gutterHotkey` | `string` | `"Mod-Shift-Enter"` | Keyboard hotkey to open the gutter plus menu. |
| `bubbleAppearDelay`| `number` | `200` | Delay in ms between selection and selection bubble appearance. |
| `autoLoadStyles` | `boolean` | `true` | Auto-inject core CSS from CDN/local bundle. Set to `false` for strict CSP environments. |
| `codeLanguages` | `Array` | `null` | CodeMirror LanguageDescription array to enable syntax highlighting in fenced code blocks. |
| `sanitizeHtml` | `function` | `null` | Optional custom HTML sanitization function: `(html: string) => string`. If provided, it takes precedence and `window.DOMPurify` auto-detection is skipped. |

---

## Public Methods

### `getValue()`
Returns the complete document content as a Markdown string.
*   **Returns:** `string`

### `setValue(value)`
Replaces the entire document content with a new Markdown string.
*   **Parameters:** `value` (`string`)

### `focus()`
Programmatically focuses the primary editor view.

### `setReadOnly(readOnly)`
Sets the editor to read-only or read-write mode dynamically.
*   **Parameters:** `readOnly` (`boolean`): Whether the editor should be read-only.

### `isReadOnly()`
Returns whether the editor is currently in read-only mode.
*   **Returns:** `boolean`

### `getSelection()`
Returns the currently selected text in the primary editor.
*   **Returns:** `string`

### `setSelection(anchor, head)`
Sets the selection range in the editor and focuses it.
*   **Parameters:**
    *   `anchor` (`number`): The starting character index of the selection.
    *   `head` (`number`, optional): The ending character index of the selection. Defaults to `anchor`.

### `replaceSelection(text)`
Replaces the current selection with the given text. If nothing is selected, inserts the text at the current cursor position.
*   **Parameters:** `text` (`string`)


### `insertSnippet(before, after, placeholder)`
Wraps the current text selection with markdown characters. If no text is selected, inserts a formatted placeholder string.
*   **Parameters:**
    *   `before` (`string`): Prefix tags (e.g. `**`).
    *   `after` (`string`): Suffix tags (e.g. `**`).
    *   `placeholder` (`string`): Text displayed inside tags if selection is empty.

### `undo()`
Triggers history undo on the currently focused editor (WYSIWYM or raw).

### `redo()`
Triggers history redo on the currently focused editor (WYSIWYM or raw).

### `setTheme(theme)`
Dynamically toggles light or dark mode styling across the editors.
*   **Parameters:** `theme` (`"light" | "dark"`)

### `setVimMode(enabled)`
Dynamically toggles Vim mode emulation at runtime.
*   **Parameters:** `enabled` (`boolean`)

### `getCharacterCount()`
Returns the total character length of the active document.
*   **Returns:** `number`

### `getWordCount()`
Returns the total word count of the active document.
*   **Returns:** `number`

### `getReadTime()`
Returns the estimated reading time of the active document in minutes.
*   **Returns:** `number`

### `getMarkdownState()`
Returns a comprehensive snapshot of the current editor state optimized for external AI agents. It automatically extracts and parses YAML frontmatter without delimiters.
*   **Returns:** `object` with the following structure:
    *   `markdown` (`string`): The full raw document content.
    *   `frontmatter` (`string`): The raw YAML frontmatter content, stripped of `---` delimiters.
    *   `body` (`string`): The markdown content excluding the frontmatter block.
    *   `selection` (`string`): The currently selected text.
    *   `cursor` (`object`): `{ line: number, column: number }` (1-indexed line).
    *   `lineCount` (`number`): Total number of lines.
    *   `stats` (`object`): `{ words: number, characters: number, readTime: number }`.

### `registerRenderer(renderFn)`
Registers a custom Markdown compilation function to render custom HTML previews.
*   **Parameters:** `renderFn` (`(markdown: string) => string`)

### `getContentHtml()`
Returns the compiled HTML representation of the document, using the registered custom renderer or the built-in fallback parser. 

If the `sanitizeHtml` configuration option is provided, it is used to sanitize the HTML output. Otherwise, if `window.DOMPurify` is loaded on the page, it will automatically sanitize the HTML before returning. If neither is available, it returns the raw unescaped compiled HTML.
*   **Returns:** `string`

### `getView()`
Exposes the primary CodeMirror `EditorView` instance.
*   **Returns:** `EditorView`

### `triggerSave()`
Programmatically invokes the registered save callback with current values.

### `on(event, callback)`
Registers an event listener callback.
*   **Parameters:**
    *   `event` (`"change" | "save" | "statsUpdate"`): The event name.
    *   `callback` (`function`): The callback function:
        *   For `"change"` / `"save"`: receives `(value: string)` (the updated Markdown document).
        *   For `"statsUpdate"`: receives a stats object: `{ words: number, characters: number, readTime: number }`.

**Example:**
```javascript
editor.on("statsUpdate", (stats) => {
  console.log(`Words: ${stats.words}, Characters: ${stats.characters}, Read Time: ${stats.readTime} min`);
});
```

### `getUploadHandler()`
Returns the configured image upload handler, or `null` if not configured.
*   **Returns:** `(file: File) => Promise<string>` or `null`

### `getSuggestLinks()`
Returns the configured link-suggestion handler for the Insert Link modal, or `null` if not configured.
*   **Returns:** `(query: string) => Promise<{ title: string, url: string, slug?: string }[]>` or `null`

### `getImageAspectOptions()`
Returns host-declared image aspect options for the Edit/Insert Image modal, or `null` if not configured / empty.
*   **Returns:** `{ value: string, label: string }[]` or `null`

### `getListHeadings()`
Returns the configured heading-list handler for the Expand/Embed insert modal, or `null` if not configured.
*   **Returns:** `(slug: string) => Promise<{ title: string, level?: number }[]>` or `null`

### `getListExpandTargets()`
Returns the configured expand-target handler (summary + deck + headings) for the Expand/Embed insert modal, or `null` if not configured. Prefer this over `getListHeadings()` when the host can supply frontmatter summary and/or deck.
*   **Returns:** `(slug: string) => Promise<{ summary?: string|null, deck?: string|null, headings: { title: string, level?: number }[] }>` or `null`

### `getComponents()`
Returns the list of currently registered component schemas.
*   **Returns:** `Array<string | object>`

### `destroy()`
Cleans up event listeners and destroys CodeMirror instances.

### `rebuildToolbar()`
Tears down and rebuilds the static/hybrid toolbar using the current saved user preferences from `localStorage`.

### `getToolbarConfig()`
Returns the integrator's original toolbar configuration array. Used by the settings modal to scope which tools are configurable.
*   **Returns:** `string[]`

### `getToolbarScope()`
Returns the toolbar `localStorage` scope key.
*   **Returns:** `string|undefined`

---

## Editing & Formatting Helpers

Traven exposes several built-in commands to manipulate text selections programmatically:

### `clear()`
Wipes the entire document content and focuses the primary editor.

### `toUpperCase()`
Converts the active selection to uppercase, preserving the selected text boundary.

### `toLowerCase()`
Converts the active selection to lowercase, preserving the selected text boundary.

### `capitalizeWords()`
Capitalizes the first letter of every word in the active selection.

### `removeFormatting()`
Strips all inline styles (bold, italic, code backticks, strikethrough, highlights) and block formatting (lists, taskboxes, headings, blockquotes, horizontal rules) from the selection.

### `toggleFullscreen()`
Toggles fullscreen class `.is-fullscreen` on the editor's parent container and recalculates layout coordinates.

### `openSearch()`
Opens the built-in CodeMirror find-and-replace search panel.

### `goToLine(lineNumber)`
Navigates the cursor to the specified 1-indexed line number and scrolls it into view.
*   **Parameters:** `lineNumber` (`number`)

### `insertCodeBlock()`
Wraps the selection in a fenced code block (`` ``` ``) with appropriate line spacing.

### `insertBlock(text, position)`
Inserts a block of markdown text at a semantic position, automatically handling leading and trailing blank-line spacing to prevent formatting collisions.
*   **Parameters:**
    *   `text` (`string`): The markdown content to insert.
    *   `position` (`"before" | "after" | "start" | "end"`, optional): Where to insert the block relative to the cursor or document bounds. Defaults to `"after"`.

### `insertHR()`
Inserts a standalone markdown horizontal rule line (`---`) at the cursor.

### `insertTable()`
Inserts a pre-formatted 3x3 Markdown table template at the cursor, and selects the first header text.

### `setHeading(level)`
Toggles or applies a heading level (`1` to `6`) prefix to the active line. Pass `0` to strip headings.
*   **Parameters:** `level` (`number`)

### `insertBlockquote()`
Converts the active selection or line into a markdown blockquote block (`> `).

### `insertDateTime()`
Inserts the current date and time string at the cursor.

### `insertList(type)`
Converts the active selection or line into a list of the specified type.
*   **Parameters:** `type` (`"ul" | "ol" | "task"`)

---

## Static Methods

### `TravenEditor.configureMermaid(options)`
Configures Mermaid diagram loading globally.
*   **Parameters:**
    *   `options` (`boolean | string | object`):
        *   `true`: Enable Mermaid loading from standard CDN (v11.4.0).
        *   `string`: Enable with a custom CDN script URL.
        *   `object`: Configuration object containing optional `js` URL property.
        *   `false`: Disable Mermaid.

### `TravenEditor.initMermaid(container)`
Scans the specified container element and renders any uninitialized Mermaid diagrams.
*   **Parameters:**
    *   `container` (`HTMLElement`): The DOM container element to scan.
*   **Returns:** `Promise<void>`

---

## Standalone Markdown Compiler API

Traven provides standalone utilities for compiling Markdown directly to HTML outside of the editor environment.

> [!WARNING]
> **Security Caveat**: The standalone compiler does **not** sanitize HTML output. Since Traven supports raw HTML blocks (`HTMLBlock`) and inline tags (`HTMLTag`), any HTML inserted in the input Markdown will be rendered unescaped in the final HTML output. If you are rendering untrusted user-submitted Markdown, you must run the resulting HTML through a secure HTML sanitizer library (e.g., `DOMPurify`) before injecting it into the page.
> 
> **Note**: Unlike the editor's `getContentHtml()` API, the standalone `renderMarkdown` and `TravenRenderer` functions do not support the `sanitizeHtml` option or perform automatic `window.DOMPurify` detection.

### `renderMarkdown(markdownText)`
A convenience helper function to compile a Markdown string directly into HTML with all default Traven plugins, extensions, and shortcodes active.
*   **Parameters:** `markdownText` (`string`): The raw Markdown text to render.
*   **Returns:** `string` (The compiled HTML)
*   **Frontmatter**: Automatically parses and strips YAML frontmatter metadata blocks from the compiled output.

**Example:**
```javascript
import { renderMarkdown } from "@freedomware/traven";

const html = renderMarkdown("# Hello World\n\n- Item 1\n- item 2");
```

### `new TravenRenderer(parser, plugins)`
The core compiler class used by Traven to translate parsed Lezer syntax trees into HTML nodes.
*   **Parameters:**
    *   `parser` (`MarkdownParser`): A configured Lezer Markdown parser (such as the one returned by `yamlFrontmatter` wrapper).
    *   `plugins` (`Array<TravenPlugin>`): A list of Traven plugins to allow custom render overrides.
*   **Methods:**
    *   `compile(markdownText)`: Compiles the Markdown text and returns a `string`.


