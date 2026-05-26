<p align="center">
  <img src="assets/images/traven.png" alt="Traven Editor" width="400">
</p>

<p align="center">
  <strong>A standalone, lightweight, framework-agnostic WYSIWYM Markdown Editor built on CodeMirror 6.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/version-0.1.0-orange.svg" alt="Version 0.1.0">
  <img src="https://img.shields.io/badge/dependency-CodeMirror_6-6aa00.svg" alt="CodeMirror 6">
</p>

---

## What is Traven?

**Traven Editor** is a non-brittle WYSIWYM (What You See Is What You Mean) Markdown editor designed to be embedded directly into custom CMS systems, administrative dashboards, and web forms. Built on the **CodeMirror 6** editing engine, Traven delivers a high-fidelity editing experience while outputting clean, raw Markdown.

Traven is highly modular and straightforward to customize or extend. If you need a powerful, flexible and mostly unopinionated Markdown editor that adapts to the layout, theme, and behavior of an existing project, its configuration options and decoupled styling make integration fast and easy.

### Naming & Philosophy

**"B. Traven"** was the self-chosen nym of the privacy-first author behind *The Treasure of the Sierra Madre*, who spent his career proving that the work outlasts the author, communicating with publishers pseudonymously and letting his writing speak for itself. For a framework-agnostic, open-source editor meant to be embedded, customized, and stay quietly out of the limelight, the name fits.

---

## Key Features

*   **WYSIWYM Collapsing**: Formatting syntax markers (like `**` for bold and `*` for italic) display dynamically only when the cursor is inside the formatted text. When the cursor leaves, they transition smoothly into clean, styled blocks.
*   **Optimistic Media Uploads**: Drag and drop or paste image files directly into the editor. The view immediately embeds an optimistic spinner loader and replaces it with the final URL once your upload handler resolves.
*   **Decoupled Styling (Skins)**: Theme aesthetics (colors, padding, borders) are decoupled from the JavaScript logic. Swap between the neutral **Default Skin** and optional skins such as a **Dark Skin** and a contemporary **Colorful Skin** by changing a single `<link>` stylesheet, with no rebuilding required.
*   **Bidirectional Raw Sync**: Easily bind a secondary raw Markdown viewer/editor in split-screen layouts. Changes flow incrementally between editors, maintaining cursor positions and separate histories without circular synchronization loops.
*   **Smart Keyboard Utilities**: Includes keyboard helpers that prevent cursors from getting trapped inside collapsed markdown delimiters during arrow navigation.
*   **Vim Emulation Mode**: Toggleable Vim normal/visual/insert mode keybindings dynamically at runtime.
*   **Real-Time Statistics**: Out-of-the-box support for tracking words, characters, and estimated reading times with statistics update event listeners.
*   **Dynamic HTML Preview Rendering**: Features a compilation hook for registering custom Markdown renderers to generate structural, skin-synced HTML previews.
*   **Zero Peer Dependencies**: Bundles CodeMirror and Vim emulation modules internally using `esbuild`. Simply drop in the compiled script and a stylesheet to start editing.

---

## Installation & Setup

### 1. Direct Include (Recommended for CMSs)

Copy `dist/traven.js` and your preferred skin stylesheet (from `assets/skins/`) into your host project directory, and include them:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Traven Integration</title>
  
  <!-- Load the stylesheet skin -->
  <link rel="stylesheet" href="assets/skins/skin-default.css">
  <link rel="stylesheet" href="assets/toolbars/toolbar-default.css">
</head>
<body>

  <!-- Parent containers for mounting -->
  <div class="editor-container">
    <div id="editor-mount"></div>
  </div>

  <script type="module">
    import { TravenEditor } from "./dist/traven.js";

    // Defer initialization until fonts are ready for CodeMirror coordinate caching
    document.fonts.ready.then(() => {
      const editor = new TravenEditor({
        element: document.getElementById("editor-mount"),
        initialValue: "# Hello Traven\n\nEdit **this bold text** to see delimiters appear!",
        lineNumbers: true
      });
    });
  </script>
</body>
</html>
```

---

## API Reference

### `new TravenEditor(options)`

Initializes a new editor instance.

#### Options

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
| `onStatsUpdate` | `function` | `null` | Callback fired when document stats change: `(stats: { words: number, characters: number, readTime: number }) => void`. |
| `theme` | `"light" \| "dark"`| `"light"` | Configures baseline cursor theme variables and dark mode class triggers. |
| `caretColor` | `string` | `""` | Custom hex color for the editor caret overrides. |
| `toolbar` | `Array<string> \| boolean`| `false` | A list of tool key strings defining the toolbar buttons layout, or `false` to disable the toolbar. |
| `vimMode` | `boolean` | `false` | Enables Vim keybindings and normal mode emulation in both editing panes. |
| `readOnly` | `boolean` | `false` | Enables read-only mode for both primary and secondary editor panes. |
| `keybindings` | `object` | `{}` | Key-value pairs overriding default tool keybindings (e.g. `{ bold: "Ctrl-Shift-b" }`). |

---

### Public Methods

#### `getValue()`
Returns the complete document content as a Markdown string.
*   **Returns:** `string`

#### `setValue(value)`
Replaces the entire document content with a new Markdown string.
*   **Parameters:** `value` (`string`)

#### `focus()`
Programmatically focuses the primary editor view.

#### `setReadOnly(readOnly)`
Sets the editor to read-only or read-write mode dynamically.
*   **Parameters:** `readOnly` (`boolean`): Whether the editor should be read-only.

#### `isReadOnly()`
Returns whether the editor is currently in read-only mode.
*   **Returns:** `boolean`

#### `getSelection()`
Returns the currently selected text in the primary editor.
*   **Returns:** `string`

#### `setSelection(anchor, head)`
Sets the selection range in the editor and focuses it.
*   **Parameters:**
    *   `anchor` (`number`): The starting character index of the selection.
    *   `head` (`number`, optional): The ending character index of the selection. Defaults to `anchor`.


#### `insertSnippet(before, after, placeholder)`
Wraps the current text selection with markdown characters. If no text is selected, inserts a formatted placeholder string.
*   **Parameters:**
    *   `before` (`string`): Prefix tags (e.g. `**`).
    *   `after` (`string`): Suffix tags (e.g. `**`).
    *   `placeholder` (`string`): Text displayed inside tags if selection is empty.

#### `undo()`
Triggers history undo on the currently focused editor (WYSIWYM or raw).

#### `redo()`
Triggers history redo on the currently focused editor (WYSIWYM or raw).

#### `setTheme(theme)`
Dynamically toggles light or dark mode styling across the editors.
*   **Parameters:** `theme` (`"light" | "dark"`)

#### `setVimMode(enabled)`
Dynamically toggles Vim mode emulation at runtime.
*   **Parameters:** `enabled` (`boolean`)

#### `getCharacterCount()`
Returns the total character length of the active document.
*   **Returns:** `number`

#### `getWordCount()`
Returns the total word count of the active document.
*   **Returns:** `number`

#### `getReadTime()`
Returns the estimated reading time of the active document in minutes.
*   **Returns:** `number`

#### `registerRenderer(renderFn)`
Registers a custom Markdown compilation function to render custom HTML previews.
*   **Parameters:** `renderFn` (`(markdown: string) => string`)

#### `getContentHtml()`
Returns the compiled HTML representation of the document, using the registered custom renderer or the built-in fallback parser.
*   **Returns:** `string`

#### `getView()`
Exposes the primary CodeMirror `EditorView` instance.
*   **Returns:** `EditorView`

#### `triggerSave()`
Programmatically invokes the registered save callback with current values.

#### `on(event, callback)`
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

#### `destroy()`
Cleans up event listeners and destroys CodeMirror instances.

---

### Editing & Formatting Helpers

Traven exposes several built-in commands to manipulate text selections programmatically:

#### `clear()`
Wipes the entire document content and focuses the primary editor.

#### `toUpperCase()`
Converts the active selection to uppercase, preserving the selected text boundary.

#### `toLowerCase()`
Converts the active selection to lowercase, preserving the selected text boundary.

#### `capitalizeWords()`
Capitalizes the first letter of every word in the active selection.

#### `removeFormatting()`
Strips all inline styles (bold, italic, code backticks, strikethrough, highlights) and block formatting (lists, taskboxes, headings, blockquotes, horizontal rules) from the selection.

#### `toggleFullscreen()`
Toggles fullscreen class `.is-fullscreen` on the editor's parent container and recalculates layout coordinates.

#### `openSearch()`
Opens the built-in CodeMirror find-and-replace search panel.

#### `goToLine(lineNumber)`
Navigates the cursor to the specified 1-indexed line number and scrolls it into view.
*   **Parameters:** `lineNumber` (`number`)

#### `insertCodeBlock()`
Wraps the selection in a fenced code block (`` ``` ``) with appropriate line spacing.

#### `insertHR()`
Inserts a standalone markdown horizontal rule line (`---`) at the cursor.

#### `insertTable()`
Inserts a pre-formatted 3x3 Markdown table template at the cursor, and selects the first header text.

#### `setHeading(level)`
Toggles or applies a heading level (`1` to `6`) prefix to the active line. Pass `0` to strip headings.
*   **Parameters:** `level` (`number`)

#### `insertBlockquote()`
Converts the active selection or line into a markdown blockquote block (`> `).

#### `insertList(type)`
Converts the active selection or line into a list of the specified type.
*   **Parameters:** `type` (`"ul" | "ol" | "task"`)

---

## Integration Patterns

Traven supports two main options for handling YAML Frontmatter metadata (e.g. `title`, `tags`):

### Approach A: Freeform Editing (Inline)
Useful for markdown-first environments (like Obsidian or wikis) where authors prefer typing raw YAML manually.
*   **Usage**: Pass the raw file directly into `TravenEditor`. The editor automatically highlights the frontmatter boundaries `---`, styles the keys, and collapses them when focus is lost.

### Approach B: Structured Forms (Split-Before / Join-After) — *Recommended for CMSs*
Recommended for databases and dashboard layouts. Metadata (Title, Author, Status, Date) is typed into standard, validated HTML form fields, while Traven is initialized **only** with the Markdown body content. This prevents users from breaking frontmatter syntax formatting.

#### Split/Join Helper Recipe (JavaScript)

Add these utilities to your integration pipeline to split content before loading, and join it on save:

```javascript
/**
 * Splits a raw Markdown file into its YAML block and body Markdown content.
 * Supports Windows (\r\n) line endings.
 */
export function splitFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { yaml: "", markdown: raw };
  }
  return { yaml: match[1], markdown: match[2] };
}

/**
 * Recombines a YAML metadata block and body Markdown back into a single file string.
 */
export function joinFrontmatter(yaml, markdown) {
  const trimmedYaml = yaml.trim();
  return trimmedYaml ? `---\n${trimmedYaml}\n---\n${markdown}` : markdown;
}
```

---

## Customization & Styling

Skins are configured as plain CSS files, letting developers override colors and layout elements without running build systems.

### SWAPPING THEMES
Simply swap the styling link in your HTML document:
```html
<!-- For a slate, clean typography-focused feel: -->
<link rel="stylesheet" href="assets/skins/skin-default.css">

<!-- For a warm, rust-tinted brand feel: -->
<link rel="stylesheet" href="assets/skins/skin-colorful.css">

<!-- For a premium slate dark theme feel: -->
<link rel="stylesheet" href="assets/skins/skin-dark.css">
```

### CUSTOMIZING THE TOOLBAR

You can customize the toolbar layout by passing an array of tool keys to the constructor's `toolbar` option, or hide buttons using CSS overrides.

#### Available Toolbar Stylesheets

Alternative pre-configured toolbar presentation sheets are available in `assets/toolbars/` and can be loaded dynamically or statically to swap editor layouts:
*   `toolbar-default.css`: The default clean toolbar skin.
*   `toolbar-compact.css` / `toolbar-compact-dark.css`: Slim layouts with reduced padding.
*   `toolbar-reduced.css` / `toolbar-reduced-dark.css`: Ultra-minimalist layouts for simplified interfaces.

#### Toolbar Buttons & Selectors Reference

Each button generated in the toolbar is assigned a generic `.toolbar-btn` class, along with a button-specific class matching its key name (e.g. `.btn-bold`):

| Tool Key | CSS Selector | Action Description | Default Keyboard Shortcut |
| :--- | :--- | :--- | :--- |
| `undo` | `.btn-undo` | Undo last operation | `Ctrl+Z` (`Cmd+Z` on Mac) |
| `redo` | `.btn-redo` | Redo last undone operation | `Ctrl+Y` (`Cmd+Y` on Mac) |
| `bold` | `.btn-bold` | Bold text (`**bold text**`) | `Ctrl+B` (`Cmd+B` on Mac) |
| `italic` | `.btn-italic` | Italic text (`*italic text*`) | `Ctrl+I` (`Cmd+I` on Mac) |
| `strikethrough` | `.btn-strikethrough` | Strikethrough text (`~~strikethrough~~`) | `Ctrl+Shift+S` (`Cmd+Shift+S` on Mac) |
| `code` | `.btn-code` | Inline code backticks (`` `code` ``) | - |
| `codeblock` | `.btn-codeblock` | Wrap selection in fenced code block (`` ``` ``) | - |
| `heading` | `.btn-heading` | Dropdown selector for Heading 1 to Heading 6 | - |
| `bulletlist` | `.btn-bulletlist` | Format line or selection as unordered list (`- `) | - |
| `numberedlist` | `.btn-numberedlist` | Format line or selection as ordered list (`1. `) | - |
| `tasklist` | `.btn-tasklist` | Format line or selection as checklist (`- [ ] `) | `Ctrl+Shift+C` (`Cmd+Shift+C` on Mac) |
| `blockquote` | `.btn-blockquote` | Format line or selection as blockquote (`> `) | - |
| `hr` | `.btn-hr` | Insert horizontal rule line (`---`) | - |
| `table` | `.btn-table` | Insert standard 3x3 table template | - |
| `datetime` | `.btn-datetime` | Insert current Date & Time (YYYY-MM-DD HH:MM) | - |
| `search` | `.btn-search` | Open CodeMirror search panel | `Ctrl+F` (`Cmd+F` on Mac) |
| `fullscreen` | `.btn-fullscreen` | Toggle editor container fullscreen mode | - |
| `clear` | `.btn-clear` | Clear all document content | - |
| `uppercase` | `.btn-uppercase` | Convert selection to UPPERCASE | - |
| `lowercase` | `.btn-lowercase` | Convert selection to lowercase | - |
| `capitalize` | `.btn-capitalize` | Capitalize selection words | - |
| `removeformatting` | `.btn-removeformatting` | Remove Markdown styling from selection | - |
| `gotoline` | `.btn-gotoline` | Prompt for line number and navigate | `Ctrl+G` (`Cmd+G` on Mac) |
| `link` | `.btn-link` | Insert link using link modal dialog | `Ctrl+K` (`Cmd+K` on Mac) |
| `help` | `.btn-help` | Open keyboard shortcuts help modal | `Ctrl+/` (`Cmd+/` on Mac) |

#### Hiding Buttons via CSS
To hide buttons or re-style them, override classes in your local stylesheets:
```css
/* Hide the Heading and Redo buttons from the toolbar */
.toolbar-btn.btn-heading,
.toolbar-btn.btn-redo {
  display: none;
}
```

---

## Custom Shortcodes Architecture (Roadmap)

Traven is structured to allow easy parsing of custom shortcodes (e.g., `[gallery ids="1,2"]` or `{{ youtube id="xyz" }}`). Custom shortcode rendering utilizes the decoupled architecture:

1.  **Scanner (`src/wysiwym.js`)**: Matches shortcode delimiters using regex scans.
2.  **Replacement Widget (`src/index.js`)**: Injects a custom CodeMirror `WidgetType` returning custom interactive preview elements when the cursor is outside the shortcode range.
3.  **Themes (`assets/skins/*.css`)**: Defines visual tokens (e.g. background margins, border styles) for classes like `.cm-wysiwym-shortcode-widget`.

---

## Development

Install development packages to test and build modifications:

```bash
# Install bundler dependencies
npm install

# Run bundling build (produces dist/traven.js and dist/traven.css)
npm run build

# Start esbuild watch mode for live development
npm run watch
```

To view the included integration demos, serve the project files on a local PHP-capable server (e.g. `php -S localhost:8000`).

---

## License

Traven is open-source software licensed under the [MIT License](LICENSE).
