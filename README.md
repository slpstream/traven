<p align="center">
  <img src="assets/images/traven.png" alt="Traven Editor" width="400">
</p>

<p align="center">
  <strong>A standalone, lightweight, framework-agnostic WYSIWYM Markdown Editor</strong>
</p>
<p align="center">
  Add Traven Editor to any website:
  LaTeX, table editor, image modal, shortcode system, audio, video, custom Lezer extensions, 
  four skins, five demos, six toolbars, full documentation
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/version-0.1.9-orange.svg" alt="Version 0.1.9">
  <img src="https://img.shields.io/badge/engine-CodeMirror_6-6aa00.svg" alt="CodeMirror 6 Engine">
  <img src="https://img.shields.io/badge/peer_dependencies-none-blue.svg" alt="Zero Peer Dependencies">
</p>

---

## The Typora-like Markdown editor you can embed anywhere

**Traven Editor** is a non-brittle WYSIWYM (What You See Is What You Mean) Markdown editor for embedding directly into custom CMS systems, administrative dashboards, web forms and apps. Built on the **CodeMirror 6** editing engine, Traven delivers a high-fidelity editing experience while outputting clean, raw Markdown.

Traven is highly modular and straightforward to customize or extend. If you need a powerful, flexible and mostly unopinionated Markdown editor that adapts to the layout, theme, and behavior of an existing project, its theming and configuration options and decoupled styling make integration fast and easy.

### Naming & Philosophy

**"B. Traven"** was the self-chosen nym of the privacy-first author behind *The Treasure of the Sierra Madre*, who spent his career proving that the work outlasts its author, communicating with publishers pseudonymously and letting his writing speak for itself. For a framework-agnostic, open-source editor meant to be embedded, customized, and stay quietly out of the limelight, the name fits.

---

## Live Demos

Go to **[Traven.dev](https://traven.dev)** to try the Traven framework-agnostic WYSIWYM editor with live previews in different demo sandboxes. 

Mix and match different combinations of toolbar buttons, skins, and editor layouts to see the flexibility of how Traven can be themed and configured to fit any setting where JavaScript works.

---

## Key Features

*   **WYSIWYM Collapsing**: Formatting syntax markers (like `**` for bold and `*` for italic) display dynamically only when the cursor is inside the formatted text. When the cursor leaves, they transition smoothly into clean, styled blocks.
*   **Optimistic Media Uploads**: Drag and drop or paste image files directly into the editor. The view immediately embeds an optimistic spinner loader and replaces it with the final URL once your upload handler resolves.
*   **Decoupled Styling (Skins)**: Theme aesthetics (colors, padding, borders) are decoupled from the JavaScript logic. Swap between the neutral **Default Skin** and optional skins such as a **Dark Skin** and a contemporary **Colorful Skin** by changing a single `<link>` stylesheet, with no rebuilding required.
*   **Custom Shortcode System**: Built-in support for modular `[image]`, `[video]`, `[audio]`, `[figure]`, and nested block `[component]` shortcodes (with blockquote, pullquote, info, warning, highlight, and youtube aliases). These automatically fold into WYSIWYM interactive widgets inside the editor while compiling into clean semantic HTML structure.
*   **Bidirectional Raw Sync**: Easily bind a secondary raw Markdown viewer/editor in split-screen layouts. Changes flow incrementally between editors, maintaining cursor positions and separate histories without circular synchronization loops.
*   **Smart Keyboard Utilities**: Includes keyboard helpers that prevent cursors from getting trapped inside collapsed markdown delimiters during arrow navigation.
*   **Vim Emulation Mode**: Toggleable Vim normal/visual/insert mode keybindings dynamically at runtime.
*   **Real-Time Statistics**: Out-of-the-box support for tracking words, characters, and estimated reading times with statistics update event listeners.
*   **Dynamic HTML Preview Rendering**: Features a compilation hook for registering custom Markdown renderers to generate structural, skin-synced HTML previews.
*   **LaTeX Math Rendering**: Native support for inline (`$ ... $`) and display (`$$ ... $$`) LaTeX equations. Math is dynamically parsed via custom Lezer syntax extensions and rendered asynchronously using KaTeX (supporting pre-loaded global instances, locally-hosted files, or optional CDN assets). Delimiters collapse gracefully, and equations automatically update in both the WYSIWYM editing canvas and the fallback HTML preview.
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
| `katex` | `boolean \| string \| object` | `false` | Configures KaTeX loading. If `false` (default), only uses local preloaded `window.katex`. If `true`, loads from JSDelivr CDN. If a string or object, defines custom self-hosted paths (e.g. `{ js: "path/to/katex.js", css: "path/to/katex.css" }`). |

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
*   `toolbar-default.css`: The default clean toolbar skin, containing the full set of all available buttons.
*   `toolbar-compact.css` / `toolbar-compact-dark.css`: Slim layouts with reduced padding.
*   `toolbar-reduced.css` / `toolbar-reduced-dark.css`: Ultra-minimalist layouts for simplified interfaces.
*   `toolbar-expandable.css` / `toolbar-expandable-dark.css`: A dynamic "2-in-1" toolbar that toggles between core buttons and the full set when expanded.

#### Toolbar Buttons & Selectors Reference

Each button generated in the toolbar is assigned a generic `.toolbar-btn` class, along with a button-specific class matching its key name (e.g. `.btn-bold`):

| Tool Key | CSS Selector | Action Description | Default Keyboard Shortcut |
| :--- | :--- | :--- | :--- |
| `undo` | `.btn-undo` | Undo last operation | `Ctrl+Z` (`Cmd+Z` on Mac) |
| `redo` | `.btn-redo` | Redo last undone operation | `Ctrl+Y` (`Cmd+Y` on Mac) |
| `bold` | `.btn-bold` | Bold text (`**bold text**`) | `Ctrl+B` (`Cmd+B` on Mac) |
| `italic` | `.btn-italic` | Italic text (`*italic text*`) | `Ctrl+I` (`Cmd+I` on Mac) |
| `strikethrough` | `.btn-strikethrough` | Strikethrough text (`~~strikethrough~~`) | `Ctrl+Shift+S` (`Cmd+Shift+S` on Mac) |
| `highlight` | `.btn-highlight` | Highlight text (`==highlight==`) | - |
| `code` | `.btn-code` | Inline code backticks (`` `code` ``) | - |
| `heading` | `.btn-heading` | Dropdown selector for Heading 1 to Heading 6 | - |
| `bulletlist` | `.btn-bulletlist` | Format line or selection as unordered list (`- `) | - |
| `numberedlist` | `.btn-numberedlist` | Format line or selection as ordered list (`1. `) | - |
| `tasklist` | `.btn-tasklist` | Format line or selection as checklist (`- [ ] `) | `Ctrl+Shift+C` (`Cmd+Shift+C` on Mac) |
| `blockquote` | `.btn-blockquote` | Format line or selection as blockquote (`> `) | - |
| `hr` | `.btn-hr` | Insert horizontal rule line (`---`) | - |
| `codeblock` | `.btn-codeblock` | Wrap selection in fenced code block (`` ``` ``) | - |
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
| `image` | `.btn-image` | Insert image via URL or file upload modal | - |
| `video` | `.btn-video` | Insert video shortcode via modal | - |
| `audio` | `.btn-audio` | Insert audio shortcode via modal | - |
| `component` | `.btn-component` | Insert `[component]` shortcode block via modal | - |
| `figure` | `.btn-figure` | Insert `[figure]` shortcode block via modal | - |
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

## Custom Shortcodes Architecture

Traven supports custom shortcodes to extend the standard Markdown syntax. By default, it features native support for custom `[image]`, `[video]`, `[audio]`, and `[figure]` shortcodes, as well as a block-level `[component]` shortcode with blockquote/pullquote aliases:

### Custom `[image]` Shortcode
Traven includes an advanced, optional `[image]` shortcode (e.g. `[image src="..." alt="..." align="center" size="medium" class="my-custom-class"]`) designed for modular, responsive layouts:
* **Fully Backwards-Compatible**: The custom shortcode is completely optional. Traven remains fully backwards-compatible and non-breaking for standard legacy Markdown syntax (`![alt](src)`). Existing standard images continue to render and compile flawlessly.
* **Toolbar Toggle**: The "Insert Image" toolbar modal contains a sliders-icon toggle to switch between Advanced mode (generating the custom `[image]` shortcode with support for captions, custom CSS classes, sizing, and alignment settings) and Legacy mode (producing standard `![alt](src)` Markdown).
* **Decoupled Presentation Styling**: The fallback renderer compiles the shortcode to clean semantic HTML (an `<img>` tag with class attributes and no inline `style=""` declarations). Layout formatting (width, display, float, margin) is delegated entirely to the skin stylesheets (e.g. `assets/skins/skin-default.css`) via `.align-[alignment]` and `.size-[size]` selector classes.

### Custom `[video]` Shortcode
Traven includes native, optional support for a custom `[video src="..." align="center" size="medium" caption="My Video" class="custom-video"]` shortcode for embedding video media:
* **Multiple Platforms Supported**: Detects and compiles YouTube and Vimeo URLs into responsive embedded `<iframe>` elements. Direct links to video files (e.g. `.mp4`, `.webm`, `.ogg`) are compiled into native `<video controls>` HTML tags.
* **YouTube Shorthand Alias**: For authoring ease, `[youtube src="..."]` can be used as a shorthand alias for the video shortcode, automatically defaulting to YouTube embedding (supporting both full YouTube URLs and raw YouTube IDs directly).
* **WYSIWYM Widget folding**: When the cursor is outside the shortcode, the text folds into an interactive preview card displaying the detected platform logo/name, source URL, and caption. Clicking the edit icon on the card opens the Video Modal.
* **Decoupled Styling**: Compiles into semantic HTML containers (`<figure>` or `<div>`) and tags with no inline styles. Alignment and sizing layouts (e.g. `.align-right`, `.size-large`, `.traven-video-figure`) are controlled entirely via CSS skins.

### Custom `[audio]` Shortcode
Traven includes native, optional support for a custom `[audio src="..." align="center" size="medium" caption="My Audio" class="custom-audio"]` shortcode for embedding audio media:
* **Native Audio Elements**: Compiles audio files (e.g. `.mp3`, `.wav`, `.ogg`) into standard `<audio controls>` HTML tags.
* **WYSIWYM Widget folding**: When the cursor is outside, folds into an interactive preview card displaying the audio icon, source URL, and caption.
* **Decoupled Styling**: Renders inside layout-safe container classes (`.traven-audio-container`, `.traven-audio-figure`) with zero inline styles.

### Custom `[figure]` Shortcode
Traven includes native support for an optional block-level `[figure align="center" size="medium" caption="My Figure Caption" class="custom-figure"]...[/figure]` shortcode system:
* **Nested Block-Level Content**: Designed as a pair-tag shortcode that can wrap any block elements (such as images, tables, code blocks, or custom markdown content) inside a captioned block.
* **WYSIWYM Widget Folding**: When the cursor is outside, the opening/closing shortcode tags collapse, displaying a styled preview panel with the caption at the bottom and an edit/modal trigger icon.
* **Decoupled Styling**: Compiles into standard semantic HTML `<figure>` containers (with classes like `.traven-figure`, `.align-[alignment]`, and `.size-[size]`) and `<figcaption class="traven-figure-caption">` with zero inline styles.

### Custom `[component]` & Blockquote/Notice/Highlight Aliases
Traven includes native support for a pair-tag `[component]...[/component]` shortcode system, designed to handle structural block-level content:
* **Flexible Syntax**: Supported formats:
  - Canonical: `[component name="blockquote" author="James Baldwin" source="The Fire Next Time"]Not everything that is faced can be changed...[/component]`
  - Short Attribute Fallback: `[component="blockquote" author="..." source="..."]...[/component]`
* **Shorthand Aliases**: For writing convenience, Traven translates shorthand tags under the hood:
  - Blockquote Alias: `[quote author="..." source="..."]...[/quote]` or `[blockquote author="..." source="..."]...[/blockquote]`
  - Pullquote Alias: `[pullquote]...[/pullquote]`
  - Notice Block Aliases: `[info]...[/info]` and `[warning]...[/warning]`
  - Inline Highlight Alias: `[highlight]...[/highlight]` (an alias for `==highlight==` that compiles to `<mark>...</mark>`)
* **WYSIWYM Widget Folding**: In the editor, when the cursor is outside the tag range, the tag delimiters collapse. For block components, it renders a styled preview block with an edit/modal trigger. For the inline `[highlight]` tag, it applies smooth inline background color markers.
* **Clean Fallback HTML Output**: The fallback compiler renders these shortcodes into standard HTML structure with **zero inline styles**:
  - **Blockquotes**: `<blockquote class="traven-component-blockquote">...<footer><cite>— Author, Source</cite></footer></blockquote>`
  - **Pullquotes**: `<blockquote class="traven-component-pullquote">...</blockquote>`
  - **Notice Blocks**: `<div class="traven-component traven-component-info">...</div>` / `<div class="traven-component traven-component-warning">...</div>`
  - **Highlights**: `<mark>...</mark>`
  - **Generic/Unknown Blocks (e.g. `[component="card"]`)**: Compiles to a standard wrapper `<div class="traven-component traven-component-[name]">...</div>`, allowing theme authors to style them independently.

Developers can also extend Traven to support other custom shortcodes using its decoupled architecture:

1.  **Grammar & Parser (`src/component-parser.js`)**: Extends the Lezer Markdown parser to detect tag pairs, attributes, and values.
2.  **Replacement Widget (`src/wysiwym.js`)**: Injects a custom CodeMirror `WidgetType` returning custom interactive preview elements when the cursor is outside the shortcode range.
3.  **Themes (`assets/skins/*.css`)**: Defines visual tokens (e.g. background colors, border styles, hand-drawn styles) for classes like `.cm-wysiwym-component-shortcode`.

---

## Development

Install development packages to test and build modifications:

```bash
# Install bundler dependencies
npm install

# Run bundling build (produces dist/traven.js and dist/traven.css)
npm run build

# Optional tests
npm run test

# Start esbuild watch mode for live development
npm run watch
```

To view the included integration demos, serve the project files on a local PHP-capable server (e.g. `php -S localhost:8000`).

---

## License

Traven is open-source software licensed under the [MIT License](LICENSE).
