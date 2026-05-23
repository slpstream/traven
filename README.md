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

**Traven** is a premium, distraction-free WYSIWYM (What You See Is What You Mean) Markdown editor designed to be embedded directly into custom CMS systems, administrative dashboards, and web forms. Built on the modern **CodeMirror 6** editing engine, Traven delivers a high-fidelity editing experience while outputting clean, raw Markdown.

### Naming & Philosophy

The project is named in honor of **B. Traven**, the famously anonymous author of *The Treasure of the Sierra Madre*. B. Traven spent his career proving that the work outlasts the author, communicating with publishers anonymously and letting his texts speak for themselves. For a framework-agnostic, open-source editor meant to be embedded, customized, and handed to the commons, we couldn't think of a better patron saint.

---

## Key Features

*   **WYSIWYM Collapsing**: Formatting syntax markers (like `**` for bold and `*` for italic) display dynamically only when the cursor is inside the formatted text. When the cursor leaves, they transition smoothly into clean, styled blocks.
*   **Optimistic Media Uploads**: Drag and drop or paste image files directly into the editor. The view immediately embeds an optimistic spinner loader and replaces it with the final URL once your upload handler resolves.
*   **Decoupled Styling (Skins)**: Theme aesthetics (colors, padding, borders) are decoupled from the JavaScript logic. Swap between the neutral **Default Skin** and optional skins such as a **Dark Skin** and a contemporary **Colorful Skin** by changing a single `<link>` stylesheet, with no rebuilding required.
*   **Bidirectional Raw Sync**: Easily bind a secondary raw Markdown viewer/editor in split-screen layouts. Changes flow incrementally between editors, maintaining cursor positions and separate histories without circular synchronization loops.
*   **Smart Keyboard Utilities**: Includes keyboard helpers that prevent cursors from getting trapped inside collapsed markdown delimiters during arrow navigation.
*   **Zero Peer Dependencies**: Bundles CodeMirror modules internally using `esbuild`. Simply drop in the compiled script and a stylesheet to start editing.

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
  
  <!-- Atkinson Hyperlegible Next is the recommended font for high legibility -->
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&display=swap" rel="stylesheet">
  
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
| `onChange` | `function` | `null` | Callback fired on change: `(value: string) => void`. |
| `onSave` | `function` | `null` | Callback fired on Save command (Cmd+S / Ctrl+S): `(value: string) => void`. |
| `onUploadImage` | `function` | `null` | Callback returning a promise of the uploaded image's URL: `(file: File) => Promise<string>`. |
| `theme` | `"light" \| "dark"`| `"light"` | Configures baseline cursor theme variables. |
| `caretColor` | `string` | `""` | Custom hex color for the editor caret overrides. |

---

### Public Methods

#### `getValue()`
Returns the complete document content as a Markdown string.
*   **Returns:** `string`

#### `setValue(value)`
Replaces the entire document content with a new Markdown string.
*   **Parameters:** `value` (`string`)

#### `insertSnippet(before, after, placeholder)`
Wraps the current text selection with markdown characters. If no text is selected, inserts a formatted placeholder string.
*   **Parameters:**
    *   `before` (`string`): Prefix tags (e.g. `**`).
    *   `after` (`string`): Suffix tags (e.g. `**`).
    *   `placeholder` (`string`): Text displayed inside tags if selection is empty.

#### `undo()`
Triggers history undo on the currently focused editor.

#### `redo()`
Triggers history redo on the currently focused editor.

#### `triggerSave()`
Programmatically invokes the registered save callback with current values.

#### `on(event, callback)`
Registers an event listener callback.
*   **Parameters:**
    *   `event` (`"change" | "save"`): The event name.
    *   `callback` (`function(string): void`): Callback receiving the updated content string.

#### `destroy()`
Cleans up event listeners and destroys CodeMirror instances.

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
All toolbar buttons are tagged with specific classes. To hide buttons or re-style them, override classes in your local stylesheets:
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
