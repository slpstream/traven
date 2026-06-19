# Developer Knowledgebase

A reference for developer onboarding and technical context for developers wanting to customize or expand the Traven WYSIWYM Markdown Editor.

---

## 1. Repository Architecture & Layout

Traven is designed to be a lightweight, framework-agnostic editor component. It is compiled to standard ES Modules (ESM) with zero runtime peer-dependencies:

* **[package.json](../../package.json)**: Bundler settings (`esbuild`), script pipelines (`npm run build`/`watch`), and versioned CodeMirror 6 packages.
* **[packages/core/src/index.js](../../packages/core/src/index.js)**: Public API surface exposed via the `TravenEditor` class (mounts CodeMirror, encapsulates state lifecycle, inserts snippets, and fires events).
* **[packages/core/assets/skins/](../../packages/core/assets/skins/)**: Decoupled stylesheets (`skin-starter.css`, `skin-light.css`, `skin-colorful.css`, `skin-dark.css`, `skin-editorial.css`, `skin-modern.css`, `skin-academic.css`, `skin-custom.css`) containing editor visual theme configurations that require no rebuilds.
* **[packages/core/assets/toolbars/toolbar-default.css](../../packages/core/assets/toolbars/toolbar-default.css)**: Decoupled toolbar presentation stylesheet, letting users skin and toggle toolbar buttons independently.
* **[packages/core/src/toolbar/](../../packages/core/src/toolbar/)**: Modular toolbar components (`toolbar.js`, `tools.js`, `modal.js`) handling dynamic generation, accessibility behaviors, modals, and actions.
* **[packages/core/src/wysiwym.js](../../packages/core/src/wysiwym.js)**: Core decoration state machine mapping markdown parser nodes to collapsed replacement decorations.
* **[packages/core/src/delimiter-skip.js](../../packages/core/src/delimiter-skip.js)**: Arrow-key keyboard hook checking if cursors are on boundaries of folded syntax blocks to skip them.
* **[packages/core/src/images.js](../../packages/core/src/images.js)**: Drag-and-drop/paste optimistic file uploader mapping state adjustments.

---

## 2. Core Technical Findings & CodeMirror 6 Pitfalls

During initial visual scaffolding and integration, we resolved several critical constraints inherent to CodeMirror 6's layout engine. Maintain these practices for any future styling or behavior modifications:

### A. Block Decorations inside ViewPlugins (RangeError)
* **Problem:** In CodeMirror 6, block-level replacement decorations (e.g. `Decoration.replace({ widget: ..., block: true })` or custom line widgets) cannot be returned directly from the `decorations` facet of a standard `ViewPlugin`. Attempting to do so triggers a `RangeError: Block decorations may not be specified via plugins`.
* **Fix:** The decorations must be defined using a `StateField` and exposed to the editor view via the state field provider `provide: (field) => EditorView.decorations.from(field)`. Both `wysiwym.js` and `images.js` use this pattern.

### B. Accurate Click Targeting & Character Width Caching
When hiding elements or editing syntax markers (like `**` or `_`), CodeMirror must know their rendered widths to map cursor clicks to correct character offsets.
* **Avoid CSS-based Hiding:** Do not collapse character widths using CSS (`font-size: 0`, `width: 0`, or `opacity: 0` on standard `Decoration.mark` elements). CodeMirror's coordinate mapping engine remains unaware of the collapsed size, making mouse clicks land offset from their visual target.
* **Use Native Replacements:** Use `Decoration.replace({})` to collapse syntax ranges. This natively informs CodeMirror's layout engine that the text range is replaced with an empty 0-width fragment.
* **Defer to Font Loading:** CodeMirror measures and caches character widths on initialization. If fonts (like Google Fonts) load asynchronously *after* the editor renders, the width cache becomes invalid, causing cursor misalignment. Always initialize the editor inside a `document.fonts.ready.then(...)` block:
  ```javascript
  document.fonts.ready.then(() => {
    new TravenEditor({ ... });
  });
  ```

### C. Layout Measuring & Vertical Margins (Vertical Offsets)
* **Problem:** Standard line elements in CodeMirror (`.cm-line` or line decorations) must be stacked sequentially. Applying vertical margins (`margin-top` / `margin-bottom`) to headings or blockquotes pushes lines apart in a way that CodeMirror's layout calculations do not measure, causing mouse clicks to land on the wrong lines entirely.
* **Fix:** Never use vertical margins on line elements or inline widgets. Always use vertical paddings (`padding-top`/`padding-bottom`) to create vertical layout spacing:
  ```css
  .cm-wysiwym-h1 {
    padding-top: 24px !important;
    padding-bottom: 12px !important;
    margin: 0 !important;
  }
  ```

### D. RangeSetBuilder Sorting Constraint (startSide)
* **Problem:** `RangeSetBuilder.add` requires that all ranges added are strictly ordered by `from` position ascending. If two ranges share the same `from` position, they must be added in order of their decoration's `startSide` ascending. Failing to do this triggers: `Error: Ranges must be added sorted by from position and startSide`.
* **Fix:** When sorting decorations before building, use a multi-tiered comparator that compares `from` first, then `deco.startSide` (defaulting to 0 if not present), and finally `to` descending (larger range first).

### E. Custom Lezer Inline Parsers (Delimiter Resolution)
* **API Pattern**: To implement custom inline formatting or shortcode wrappers (like `==highlight==`), utilize Lezer's `cx.addDelimiter` API rather than manually scanning/splitting strings.
* **Automatic Balancing**: Register a delimiter object (e.g., `{ resolve: "Highlight", mark: "HighlightMark" }`). Lezer's engine will automatically match opening/closing boundaries, parse inner content recursively, and wrap the matched region in the `resolve` node type.
* **Boundary Guards**: Always check for consecutive characters to avoid false matches (e.g. check `cx.char(pos + 2) == 61` to avoid parsing `===` as highlight delimiter `==`).
* **Flanking Rules**: For delimiter activation to behave predictably at word boundaries and punctuation, implement flanking validation (checking if the characters immediately preceding and succeeding the delimiter match whitespace or Unicode punctuation).
* **Styling**: Maps resolved node names (`HighlightMark`, `Highlight/...`) to Lezer's `tags` inside the parser config props using `styleTags`, or use high-level custom CSS classes inside the decoration builder pipeline in `wysiwym.js`.

### F. Lost Focus & Stale WYSIWYM Decorations (Measure Cycle Nudge)
* **Problem:** In CodeMirror 6, view measurements and decoration-rendering cycles are driven by DOM events and the browser's paint loop. When a modal opens, it traps focus and moves it out of the CodeMirror editor. When closed, focus is returned to the `triggerElement` (the toolbar button) rather than the editor itself. In aggressive browsers (especially Firefox, which pauses `requestAnimationFrame` loops when focus moves outside the active DOM subtree), the editor remains in a stale state where WYSIWYM decorations disappear and raw Markdown is displayed until the user clicks inside the editor to trigger a new `mousedown` event.
* **Fix:** When closing any modal or overlay that took focus away from the editor, perform a "nudge" to force CodeMirror to re-run its layout measure and decoration cycle. This is done by registering an `onClose` callback in the modal options, and calling `view.requestMeasure()` on the active CodeMirror view instance:
  ```javascript
  openModal({
    title: "Insert Image",
    body: form,
    triggerElement: triggerBtn,
    onClose: () => {
      const view = editor.getView();
      if (view && typeof view.requestMeasure === "function") {
        view.requestMeasure();
      }
    },
    buttons: [ ... ]
  });
  ```

---

## 3. Sandboxed Resizing Rules
To prevent layout constraints on flexible split-screen dashboards:
* Apply vertical resizability directly to the outer container card (`resize: vertical; overflow: hidden;`).
* Configure the CodeMirror mount and editor container to scale proportionally to fill the card:
  ```css
  .editor-mount {
    flex: 1;
    overflow: hidden;
  }
  .editor-mount .cm-editor {
    height: 100%;
  }
  ```

---

## 4. Toolbar Configuration & Button Customization

Traven features a modular, dynamic toolbar system. Instead of hardcoded HTML markup, the toolbar is programmatically constructed by `buildToolbar` based on a configuration array passed to the `TravenEditor` constructor.

### Default Toolbar Layout
By default, Traven displays the following tools in order (separated by pipe `|` characters for vertical dividers):

* `undo` / `redo` (History controls)
* `bold` / `italic` / `strikethrough` / `highlight` / `code` / `codeblock` (Inline formatting)
* `heading` (H1–H6 selection dropdown)
* `bulletlist` / `numberedlist` / `tasklist` / `blockquote` / `hr` / `table` / `component` / `figure` (Block and special elements)
* `datetime` / `search` / `link` / `image` / `video` / `audio` / `fullscreen` / `clear` / `uppercase` / `lowercase` / `capitalize` / `removeformatting` / `gotoline` / `help` (Utility functions)

This corresponds to the `DEFAULT_TOOLBAR` array defined in `src/index.js`.

### Customizing the Toolbar Layout
To customize the order of buttons or hide specific ones, pass an array of tool keys to the `toolbar` property of the `TravenEditor` options during initialization:

```javascript
new TravenEditor({
  element: document.getElementById("editor-container"),
  initialValue: "# Hello World",
  toolbar: ["undo", "redo", "|", "bold", "italic", "link"]
});
```

To completely disable the toolbar, pass `toolbar: false`.

### List of Available Toolbar Buttons & CSS Identifiers
Each button generated in the toolbar is assigned the class `.toolbar-btn` and a unique identifier class corresponding to its tool key (e.g. `.btn-bold`). These can be targeted for custom styling or hiding.

| Tool Key | CSS Selector | Action Description | Default Keyboard Shortcut |
| :--- | :--- | :--- | :--- |
| `undo` | `.btn-undo` | Undo last operation | `Ctrl+Z` (`Cmd+Z` on Mac) |
| `redo` | `.btn-redo` | Redo last undone operation | `Ctrl+Y` (`Cmd+Y` on Mac) |
| `bold` | `.btn-bold` | Bold text (`**bold text**`) | `Ctrl+B` (`Cmd+B` on Mac) |
| `italic` | `.btn-italic` | Italic text (`*italic text*`) | `Ctrl+I` (`Cmd+I` on Mac) |
| `strikethrough` | `.btn-strikethrough` | Strikethrough text (`~~strikethrough~~`) | `Ctrl+Shift+S` (`Cmd+Shift+S` on Mac) |
| `highlight` | `.btn-highlight` | Highlight text (`==highlight==`) | - |
| `code` | `.btn-code` | Inline code backticks (`` `code` ``) | - |
| `heading` | `.btn-heading` | Dropdown menu for Heading 1 to Heading 6 | - |
| `bulletlist` | `.btn-bulletlist` | Unordered list formatting (`- `) | - |
| `numberedlist` | `.btn-numberedlist` | Ordered list formatting (`1. `) | - |
| `tasklist` | `.btn-tasklist` | Checklist formatting (`- [ ] `) | `Ctrl+Shift+C` (`Cmd+Shift+C` on Mac) |
| `blockquote` | `.btn-blockquote` | Blockquote formatting (`> `) | - |
| `hr` | `.btn-hr` | Horizontal rule line (`---`) | - |
| `codeblock` | `.btn-codeblock` | Fenced code block (`` ``` ``) | - |
| `table` | `.btn-table` | Insert table template via modal grid | - |
| `datetime` | `.btn-datetime` | Insert current Date & Time | - |
| `search` | `.btn-search` | Open CodeMirror search panel | `Ctrl+F` (`Cmd+F` on Mac) |
| `fullscreen` | `.btn-fullscreen` | Toggle editor fullscreen mode | - |
| `clear` | `.btn-clear` | Clear all document contents | - |
| `uppercase` | `.btn-uppercase` | Convert selection to UPPERCASE | - |
| `lowercase` | `.btn-lowercase` | Convert selection to lowercase | - |
| `capitalize` | `.btn-capitalize` | Capitalize selection words | - |
| `removeformatting` | `.btn-removeformatting` | Remove all markdown formatting styles | - |
| `gotoline` | `.btn-gotoline` | Navigate to specific line | `Ctrl+G` (`Cmd+G` on Mac) |
| `link` | `.btn-link` | Insert link using link modal dialog | `Ctrl+K` (`Cmd+K` on Mac) |
| `image` | `.btn-image` | Insert image via URL or file upload modal | - |
| `video` | `.btn-video` | Insert video shortcode via modal | - |
| `audio` | `.btn-audio` | Insert audio shortcode via modal | - |
| `component` | `.btn-component` | Insert `[component]` shortcode block via modal | - |
| `figure` | `.btn-figure` | Insert `[figure]` shortcode block via modal | - |
| `help` | `.btn-help` | Open keyboard shortcuts help modal | `Ctrl+/` (`Cmd+/` on Mac) |

### Hiding Buttons via CSS
Although the preferred way to hide buttons is through the `toolbar` array configuration, host platforms can also hide toolbar buttons by editing or overriding styles in `packages/core/assets/toolbars/toolbar-default.css`. E.g., to hide the "Redo" and "Heading" buttons:

```css
.toolbar-btn.btn-redo,
.toolbar-btn.btn-heading {
  display: none;
}
```

### Adding a New Toolbar Button
To add a brand-new formatting tool to Traven, follow these three steps:

1. **Register the Tool**: Define the tool metadata and action inside `src/toolbar/tools.js` under `TOOL_REGISTRY`:
   ```javascript
   strikethrough: {
     key: "strikethrough",
     title: "Strikethrough",
     shortcut: "Ctrl+Shift+S",
     keybinding: "Mod-Shift-s",
     icon: `<svg>...</svg>`,
     action: (editor) => editor.insertSnippet("~~", "~~", "strikethrough")
   }
   ```
2. **Add to Toolbar Config**: Add the new tool key (e.g., `"strikethrough"`) to `DEFAULT_TOOLBAR` in `src/index.js`, or include it in the custom `toolbar` array passed during initialization.
3. **Optional Custom Styling**: Add specific visual rules for the button class (e.g., `.btn-strikethrough`) in `packages/core/assets/toolbars/toolbar-default.css` if custom styling is needed.

---

## 5. Runtime APIs, Extensions & Integration Hooks

Recent core enhancements introduced runtime-level configurations, real-time analytics, custom markdown compilers, and Vim emulation.

### A. Editor Dark Mode Theme
Traven supports a separate dark mode state for CodeMirror editor scopes, decoupled from the surrounding page context:
* **Activation**: Set the initialization option `theme: "dark"` or call `setTheme("dark")` dynamically at runtime.
* **Mechanism**: Dynamic theme toggling works by adding/removing the `.cm-wysiwym-dark` class from the editor host DOM nodes (`this.#view.dom` and `this.#rawView.dom`).
* **Styling**: Specific dark styles (such as caret, gutters, code blocks, and markdown token colors) are separated into `src/style.css`. External visual skin styles are placed in scoped `.cm-wysiwym-dark` selectors in the respective skin files (e.g. `skin-light.css`, `skin-colorful.css`).

### B. Real-Time Statistics API
Host applications can query document size statistics at runtime or subscribe to changes:
* **Getter Methods**: `getCharacterCount()`, `getWordCount()`, and `getReadTime()` (calculates reading time dynamically using a standard 200 words-per-minute threshold).
* **Event Hook**: Bind change listeners via `on("statsUpdate", (stats) => { ... })`.
* **Important Timing Caveat**: When the editor is initialized, it fires the initial stats count. To guarantee that the host application has time to register its event listener, this initial trigger is deferred using a microtask:
  ```javascript
  Promise.resolve().then(() => {
    this.#triggerStatsUpdate();
  });
  ```

### C. Dynamic Markdown Renderer Hook
Traven features a compilation hook allowing custom renderers to generate the HTML preview:
* **Registration**: Call `registerRenderer(renderFn)` to pass a custom Markdown-to-HTML parser function (e.g., marked, markdown-it, micromark).
* **Usage**: `getContentHtml()` retrieves the rendered HTML of the current document.
* **Out-of-the-Box Fallback**: If no renderer is registered, Traven compiles the document using the built-in `TravenRenderer` (configured with the editor's default Lezer parser extensions and plugins). This produces semantic HTML including support for custom image, video, audio, component, figure, math, and table widgets, as well as raw HTML block/tag rendering.
* **Preview Styling & Skin Sync**: The preview container element uses the `.traven-preview` class. Styles for headings, lists, links, blockquotes, and code elements inside `.traven-preview` are defined directly in the theme skins (e.g. `skin-light.css`, `skin-colorful.css`, `skin-dark.css`) and dark mode class triggers (`.cm-wysiwym-dark`). This ensures the Preview tab mirrors the exact visual typography, colors, and borders of the current active skin and dark/light configuration dynamically.


### D. Vim Keybindings Support
Vim-mode keybindings can be toggled on-the-fly inside both the WYSIWYM and raw Markdown editor panes:
* **Activation**: Toggle via the initialization option `vimMode: true` or by calling the dynamic `setVimMode(enabled)` API.
* **Dynamic Reconfiguration**: The keybindings are managed through a CodeMirror `Compartment` called `vimCompartment`. This allows swap-reloading the Vim keymap extensions (`import { vim } from "@replit/codemirror-vim"`) at runtime without rebuilding the editor view states.
* **Fat Cursor Styling**: The block cursor in Vim Normal Mode (`.cm-fat-cursor`) is configured with `opacity: 0.6 !important` globally in `src/style.css` and in all theme skins. This ensures the characters covered by the block cursor are readable across all light and dark visual themes.

### E. Editor Lifecycle & State Management API
Traven exposes a complete set of methods for programmatic editor control and SPA integration:
* **`setReadOnly(boolean)`**: Toggles the editor between read-only and read-write mode using the `readOnlyCompartment.reconfigure()` pattern. Applies to both the primary WYSIWYM view and the raw source view if present.
* **`isReadOnly()`**: Returns the current read-only state (`true`/`false`).
* **`focus()`**: Programmatically focuses the primary editor via `this.#view.focus()`.
* **`getSelection()`**: Returns the currently selected text from `state.selection.main`.
* **`setSelection(anchor, head)`**: Sets the cursor position or selection range and focuses the editor. If `head` is omitted, places a caret at `anchor`.
* **`getView()`**: Returns the primary CodeMirror `EditorView` instance for advanced use cases.
* **`triggerSave()`**: Programmatically fires the `"save"` event with the current document value, without requiring a Cmd/Ctrl+S keypress.
* **`destroy()`**: Destroys both the primary and raw `EditorView` instances and clears all registered event listeners. Essential for SPA integrations that mount/unmount editors dynamically to prevent memory leaks.

### F. Link WYSIWYM Rendering
Traven renders markdown links (`[text](url)`) and autolinks (`<url>`) with inline WYSIWYM collapsing:
* **Mechanism**: The `Link` node's child tree (produced by Lezer's markdown parser) is walked to identify `LinkMark`, `URL`, and `LinkTitle` children. All syntax characters (`[`, `]`, `(`, `)`, the URL, and the title) are collapsed with `Decoration.replace({})`, leaving only the visible link text styled with `.cm-wysiwym-link-anchor`.
* **Autolinks**: The `Autolink` node's angle brackets (`<`, `>`) are similarly collapsed, with the URL text styled as a link anchor.
* **Cursor-inside reveal**: When the cursor is within a link's range (`cursorHead >= node.from && cursorHead <= node.to`), all syntax is revealed for editing. This follows the same pattern used for bold, italic, and all other inline decorations.
* **Title tooltips**: If a link has a title attribute (`[text](url "title")`), the title is extracted from the `LinkTitle` node, stripped of surrounding quotes, and set as a native `title` attribute on the decoration's `<span>` element. This provides a browser-native hover tooltip.
* **Ctrl/Cmd+Click**: A `domEventHandlers` extension intercepts clicks with `ctrlKey` or `metaKey` held. If the click position falls within a `Link` or `Autolink` node, the URL is extracted and opened in a new tab via `window.open(url, "_blank", "noopener,noreferrer")`.
* **Delimiter skip**: Arrow key navigation across collapsed link boundaries is handled by `delimiter-skip.js`. Left/right arrow keys skip over the `[`, `](url)` collapsed regions so the cursor jumps directly between the link text and the surrounding content.

### G. Image Insertion Modal
Traven provides a manual image insertion path complementing the existing optimistic drag/drop/paste uploader (`src/images.js`):
* **Modal trigger**: The `image` toolbar button (`.btn-image`) opens `openImageModal()` from `src/toolbar/modal.js`.
* **Two insertion paths**:
  - **Direct URL**: Enter an image URL and optional alt text. Inserts `![alt](url)` at the cursor.
  - **File Upload**: If the host application configured `onUploadImage(file)`, the modal shows a file picker. Selecting a file disables the URL field (mutual exclusivity). The Insert button changes to "Uploading…" while the upload promise resolves, then inserts `![alt](finalUrl)`.
* **Upload handler access**: The modal retrieves the upload callback via `editor.getUploadHandler()`, a public getter that returns the `onUploadImage` function or `null`.
* **Error handling**: If the upload promise rejects, the modal shows a red error message and re-enables the Insert button, allowing the user to retry or switch to URL input.
* **Selection pre-fill**: If text is selected when the modal opens, the alt text field is pre-filled with the selection content (mirrors the link modal behavior).
* **Drag suppression**: The `ImageWidget` in `images.js` sets `draggable="false"` and intercepts `mousedown` to prevent native browser drag ghosts from disrupting CodeMirror text selection.

### H. Interactive Table Editor & WYSIWYM Widget
Traven includes a graphical Table Editor and full WYSIWYM rendering for GFM tables:
* **Interactive Table Widget (`TableWidget`)**:
  - Resides in `src/wysiwym.js`.
  - Parses raw table blocks when the cursor is outside using the shared helper `parseMarkdownTable`.
  - Replaces raw Markdown with a clean, theme-styled HTML `<table>` DOM element.
* **Table Editor Modal (`openTableModal`)**:
  - Resides in `src/toolbar/modal.js` and is activated either by clicking a rendered `TableWidget` or via the `table` toolbar tool (`.btn-table`).
  - Provides a spreadsheet-like GUI editor containing a `contenteditable` grid.
  - Features toolbar actions to Add Column, Delete Column, Add Row, and Delete Row, rendered using customized Phosphor SVG icon definitions.
  - Implements keyboard focus trapping and custom `Tab` / `Shift+Tab` / `Enter` navigation to move seamlessly between grid cells and modal buttons.
* **GFM Table Parsing & Serialization**:
  - **Parsing**: `parseMarkdownTable(tableText)` uses a character-by-character scanner to correctly parse header columns, cell contents, and column alignments (`left`, `center`, `right`). It handles escaped pipes (`\|` -> `|`) inside cell data and defaults to `"left"` alignment if not specified.
  - **Serialization**: `serializeTableToMarkdown(headers, rows, alignments)` reconstructs the table string. It escapes raw pipes in cells (`|` -> `\|`), uses explicit separator column colons (`:---`), and aligns column paddings dynamically to output clean, reader-friendly Markdown.
* **WYSIWYM Cell Formatting & Alignments**:
  - **Inline formatting**: Cells run through a `renderInlineMarkdown` helper converting bold (`**`, `__`), italics (`*`, `_`), inline code (`` ` ``), links (`[text](url)`), and images (`![alt](url)`) into rendered markup.
  - **Theme highlight sync**: Highlight tokens (`==`) are converted into `<span class="cm-wysiwym-highlight">` so they inherit visual highlights directly from the active editor stylesheet/skin instead of defaulting to generic browser-native yellow `<mark>` styling.
  - **Alignment styling**: Headers and cells dynamically apply `style.textAlign` matching the parsed column alignment settings.
  - **Interactive Links**: Clicks on link anchors (`<a>`) in the WYSIWYM cells bypass the modal launch, letting the browser follow the link in a new tab.
  - **Min cell dimensions**: Both the editor widget cells and the HTML Preview cells apply `height: 38px` and `box-sizing: border-box` across all skins (`skin-light.css`, `skin-colorful.css`, `skin-dark.css`) to prevent blank cells from visually collapsing.

### I. Lezer-based YAML Frontmatter Parsing
To prevent common regex matching bugs on mixed CRLF/LF line endings, nested `---` tokens, or leading horizontal rules, Traven relies on Lezer's syntax tree to parse and strip YAML frontmatter:
* **Canonical Node Check**: The editor maps frontmatter to the `"Frontmatter"` syntax node emitted by `@codemirror/lang-yaml` (`yamlFrontmatter`).
* **Validation Guard**: In `#fallbackRender`, frontmatter is stripped only if the node starts at index `0` and contains at least two `"DashLine"` tokens. This ensures a single `---` at the beginning of the file is correctly rendered as a horizontal rule rather than treated as a truncated frontmatter block.

### J. Unified Lezer-based List Parsing & Toggling
To prevent subtle divergence bugs between the WYSIWYM decorations builder (`src/wysiwym.js`) and editor commands (`insertList`, `removeFormatting` in `src/index.js`), list matching is unified via Lezer syntax tree analysis:
* **`getListPrefixAt(state, pos)`**: Checks if the line contains a list item (`ListItem`) starting on that line. It performs a pre-order traversal starting at the first non-whitespace character after blockquote prefixes to locate the `ListMark` and `TaskMarker` nodes. Returns `{ type: 'ol' | 'ul' | 'task', from: number, prefixLen: number, taskMarker }`.
* **`getListStrippingRanges(state, from, to)`**: Resolves precise list stripping offsets for selections. It handles list indentations correctly, but preserves blockquote prefixes (`>`) at the start of the line.
* **`isInCodeBlock(state, pos)`**: Prevents editor commands from inserting list formatting when the selection starts inside a fenced code block or inline code text.
* **Benefits**: Resolves pre-existing bugs such as incorrect parsing of star/plus list bullets (`*`, `+`), double-insertions on negative numbers (`-3.14`), and formatting corruptions inside code blocks.

### K. Custom Image Shortcode [image ...] Parser & Widget
Traven includes support for an optional, self-closing `[image src="..." align="..." size="..." caption="..." class="..." alt="..."]` shortcode system:
* **Optional & Backwards-Compatible**: This custom shortcode is completely optional. Traven remains fully backwards-compatible with standard Markdown image syntax (`![alt](src)`). Legacies images will parse, render, and compile exactly as they did previously.
* **Lezer Custom Inline Parser (`src/shortcode-parser.js`)**: Implements a custom `@lezer/markdown` inline parser that detects the `[image` tag, scans for key-value attribute pairs (normalizing single, double, or unquoted values), and builds a structured AST subtree with nodes like `ImageShortcode`, `ShortcodeMark`, `ShortcodeTagName`, `ShortcodeAttributeName`, and `ShortcodeAttributeValue`. It is integrated into the CodeMirror markdown configuration inside `src/index.js`.
* **WYSIWYM Widget Rendering**: The `ImageShortcodeWidget` in `src/wysiwym.js` collapses the shortcode text block into a styled block preview widget showing the image thumbnail/element with custom sizing, alignment styling (via auto-margins to preserve CodeMirror coordinate mapping), and badges, while hiding the raw code when the cursor is outside.
* **Fallback HTML Compilation**: The `#fallbackRender` method compiles `[image]` shortcodes into high-quality semantic `<img>` elements with mapped attributes and class names (such as `.traven-image-shortcode`, `.align-[alignment]`, and `.size-[size]`). In order to maintain a separation of concerns, the renderer outputs **zero inline styles**, delegating layout, width, float, and margin styling entirely to the skin stylesheets.
* **Toolbar Toggle**: The "Insert Image" toolbar modal features a sliders-icon toggle to dynamically switch between Advanced mode (inserting custom `[image]` shortcodes with fields for alt text, captions, class names, alignments, and sizes) and Legacy mode (inserting standard `![alt](src)` Markdown).
* **Delimiter Skip Integration**: Delimiter skip logic in `src/delimiter-skip.js` detects `ImageShortcode` syntax boundaries and allows arrow keys to skip across the delimiters (jump to first attribute when entering, skip closing brackets when exiting).

### L. Custom [component] Shortcode & Alias System (Blockquotes, Pullquotes, Generic Cards)
Traven supports a flexible, block-level custom component shortcode system that wraps nested text, supporting attributes and aliases:
* **Lezer Parser Extension (`src/component-parser.js`)**: Implements a paired-tag inline scanner that identifies opening `[component]` and closing `[/component]` syntax boundaries. It parses key-value attributes (e.g. `name`, `author`, `source`) into a structured AST subtree containing `ComponentShortcode`, `ComponentShortcodeOpen`, `ComponentShortcodeClose`, `ComponentShortcodeBody`, `ComponentShortcodeTagName`, and attribute name/value tokens.
* **Shorthand Aliases & Syntax Normalization**: To optimize writer workflows, the parser and editor natively translate short-syntax attributes and custom tag aliases:
  - Short Attribute: `[component="blockquote"]` is normalized to `[component name="blockquote"]`.
  - Shorthand Quote Aliases: `[quote author="..." source="..."]...[/quote]` and `[blockquote author="..." source="..."]...[/blockquote]` map to `blockquote` under the hood.
  - Shorthand Pullquote Alias: `[pullquote]...[/pullquote]` maps to `pullquote` under the hood.
* **WYSIWYM Widget Rendering**: The `ComponentShortcodeWidget` in `src/wysiwym.js` collapses the raw tags when the cursor is outside, rendering a styled preview panel. It features a mouse hover edit-trigger overlay. Clicking the component or the overlay button launches the interactive Component Modal dialog to modify attributes or body content.
* **Twig-Compatible Fallback Compilation**: In `#fallbackRender`, components are parsed and converted to high-quality semantic HTML/Twig containers with **no inline styles**:
  - **Blockquotes**: Renders as `<blockquote class="traven-component-blockquote">[inner HTML]<footer><cite>— Author, Source</cite></footer></blockquote>` if `author` or `source` is defined; otherwise, just the `<blockquote>`.
  - **Pullquotes**: Renders as `<blockquote class="traven-component-pullquote">[inner HTML]</blockquote>`.
  - **Generic/Fallback Cards**: Any generic or unknown component names (like `[component="info"]` or `[component="warning"]`) fall back to card layouts: `<div class="traven-component traven-component-[name]">[inner HTML]</div>`, allowing theme developers to target them with stylesheet rules.
* **Delimiter Skip Integration**: Delimiter skipping in `src/delimiter-skip.js` allows arrow keys to skip over opening/closing delimiters and jump inside the block content smoothly.

### M. Custom Video Shortcode [video ...] Parser & Widget
Traven includes native support for an optional `[video src="..." align="..." size="..." caption="..." class="..."]` shortcode system:
* **Lezer Custom Inline Parser (`src/video-parser.js`)**: Implements a custom `@lezer/markdown` inline parser that detects the `[video` tag, parses key-value attributes, and builds a structured AST subtree containing `VideoShortcode`, `VideoShortcodeMark`, `VideoShortcodeTagName`, and attribute name/value tokens. It is integrated into the CodeMirror markdown parser inside `src/index.js`.
* **WYSIWYM Widget Rendering**: The `VideoShortcodeWidget` in `src/wysiwym.js` collapses the raw shortcode text when the cursor is outside. It renders a clean placeholder card indicating the video's detected platform type (YouTube, Vimeo, or Video File) and URL, alongside an edit icon. Clicking the widget or edit icon launches the interactive Video Modal to modify attributes.
* **Fallback HTML Compilation**: The `#fallbackRender` method compiles `[video]` shortcodes into high-quality semantic HTML structures with **zero inline styles**:
  - **YouTube**: `<iframe src="https://www.youtube.com/embed/[id]" ...></iframe>`
  - **Vimeo**: `<iframe src="https://player.vimeo.com/video/[id]" ...></iframe>`
  - **Direct/Local Video Files**: `<video src="[url]" controls></video>`
  - **Containers**: Wrapped in `<figure class="traven-video-figure align-[align] size-[size][custom-class]">` containing a `<figcaption class="traven-video-caption">` if a caption is present; otherwise, wrapped in a `<div class="traven-video-container align-[align] size-[size][custom-class]">`.
* **Toolbar Button**: The video toolbar tool (`.btn-video`) opens `openVideoModal()` from `src/toolbar/modal-video.js` allowing users to insert or edit video shortcodes with explicit alignment, size, class, and caption fields.
* **Delimiter Skip Integration**: Delimiter skipping in `src/delimiter-skip.js` automatically detects `VideoShortcode` syntax boundaries, allowing arrow keys to jump inside/across the delimiters smoothly.

### N. Custom Audio Shortcode [audio ...] Parser & Widget
Traven includes native support for an optional `[audio src="..." align="..." size="..." caption="..." class="..."]` shortcode system:
* **Lezer Custom Inline Parser (`src/audio-parser.js`)**: Implements a custom `@lezer/markdown` inline parser that detects the `[audio` tag, parses attributes, and builds a structured AST subtree containing `AudioShortcode`, `AudioShortcodeMark`, `AudioShortcodeTagName`, and attribute name/value tokens.
* **WYSIWYM Widget Rendering**: The `AudioShortcodeWidget` in `src/wysiwym.js` collapses the raw shortcode text when the cursor is outside. It renders a clean placeholder card displaying the audio icon, the source URL/file, and the caption, with a click-to-edit option. Clicking the widget launches the interactive Audio Modal.
* **Fallback HTML Compilation**: The `#fallbackRender` method compiles `[audio]` shortcodes into `<audio controls>` elements with **zero inline styles**:
  - **Containers**: Wrapped in `<figure class="traven-audio-figure align-[align] size-[size][custom-class]">` containing a `<figcaption class="traven-audio-caption">` if a caption is present; otherwise, wrapped in a `<div class="traven-audio-container align-[align] size-[size][custom-class]">`.
* **Toolbar Button**: The audio toolbar tool (`.btn-audio`) opens `openAudioModal()` from `src/toolbar/modal-audio.js` to insert or edit audio shortcodes.
* **Delimiter Skip Integration**: Delimiter skipping in `src/delimiter-skip.js` automatically detects `AudioShortcode` syntax boundaries for seamless arrow navigation.

### O. Custom Figure Shortcode [figure ...] Parser & Widget
Traven includes native support for an optional `[figure align="..." size="..." caption="..." class="..."]...[/figure]` shortcode system designed to wrap block-level contents in a captioned figure block:
* **Lezer Custom Inline Parser (`src/figure-parser.js`)**: Implements a custom `@lezer/markdown` inline parser that detects the `[figure` tag, parses attributes, and builds a structured AST subtree containing `FigureShortcode`, `FigureShortcodeOpen`, `FigureShortcodeClose`, `FigureShortcodeBody`, `FigureShortcodeTagName`, and attribute name/value tokens.
* **WYSIWYM Widget Rendering**: The `FigureShortcodeWidget` in `src/wysiwym.js` collapses the raw shortcode text when the cursor is outside. It renders the figure's body content (allowing nested block elements like images, code blocks, or tables) and displays a caption underneath if specified, alongside an edit icon. Clicking the widget launches the interactive Figure Modal.
* **Fallback HTML Compilation**: The `#fallbackRender` method compiles `[figure]...[/figure]` shortcodes into a standard `<figure>` container with **zero inline styles**:
  - `<figure class="traven-figure align-[align] size-[size][custom-class]">[inner HTML]<figcaption class="traven-figure-caption">[caption]</figcaption></figure>`
* **Toolbar Button**: The figure toolbar tool (`.btn-figure`) opens `openFigureModal()` from `src/toolbar/modal-figure.js` to insert or edit figure shortcodes.
* **Delimiter Skip Integration**: Delimiter skipping in `src/delimiter-skip.js` automatically detects `FigureShortcode` syntax boundaries for seamless arrow navigation.

---

## 6. CSS Theming & WYSIWYM Mode Parity Tips

When converting or adapting a normal CSS stylesheet from a standard HTML website to work inside Traven's WYSIWYM Mode, developers must be aware of several critical CodeMirror 6 rendering behaviors to avoid vertical alignment and spacing discrepancies between WYSIWYM (Editor) and Preview modes:

### A. Heading Padding and General Line Overrides
* **Problem**: CodeMirror 6 wraps every text line inside a `div.cm-line`. If a skin applies a general stylesheet rule to strip line padding (e.g., `.cm-editor .cm-line { padding: 0 !important; }`), this general rule will take precedence over specific class rules for headings (like `.cm-editor .cm-wysiwym-h1 { padding-top: 27px; }`). This results in heading lines having `0px` of padding-top/bottom inside the editor, while their HTML Preview equivalents (which use standard `margin-top`) render with the correct spacing, creating a vertical alignment mismatch.
* **Fix**: Always specify `!important` on the padding declarations of editor headings to guarantee they override any general line formatting rules:
  ```css
  .cm-editor .cm-wysiwym-h1 {
    padding-top: 27px !important;
    padding-bottom: 0 !important;
  }
  ```

### B. First-Child Margin Collapse in Preview
* **Problem**: When mounting the HTML Preview container (e.g., `#html-preview` / `.traven-preview`), the first child element is typically a heading (`<h1>`). If the preview container has `padding-top: 0` and no border, the `margin-top` of this first-child heading will collapse with the container, pushing the entire preview block down. In WYSIWYM mode, however, the editor's first line starts at the top, and any space above it comes from the line's `padding-top` (which doesn't collapse).
* **Fix**: Explicitly match the top margins of the first-child headings in Preview Mode with the top paddings of the editor:
  ```css
  .traven-preview > h1:first-child { margin-top: 27px !important; }
  .traven-preview > h2:first-child { margin-top: 12px !important; }
  .traven-preview > h3:first-child { margin-top: 4.5px !important; }
  ```

### C. Collapsing Separator Blank Lines (Post-Heading Gaps)
* **Problem**: In markdown documents, a blank line separating headings and paragraphs is standard practice. While the HTML Preview parser collapses this blank line into structural block positioning (e.g., placing the paragraph directly under the heading), CodeMirror still renders this blank line as a physical `div.cm-line` with full vertical height (e.g., `33px`), causing an excessively large gap under editor headings.
* **Fix**: Target blank lines (`.cm-line:has(br:only-child)`) that immediately follow heading blocks in the editor, and reduce their height to a smaller proportional value (e.g., `0.6em` or `12px`):
  ```css
  .cm-editor .cm-wysiwym-h1 + .cm-line:has(br:only-child),
  .cm-editor .cm-wysiwym-h2 + .cm-line:has(br:only-child),
  .cm-editor .cm-wysiwym-h3 + .cm-line:has(br:only-child) {
    height: 0.6em !important;
    min-height: 0.6em !important;
  }
  ```

### D. Fenced Code Block Spacing & Collapsed Fences
* **Problem**: When a fenced code block is collapsed in WYSIWYM mode (when the cursor is outside), CodeMirror collapses the text of the opening/closing fence lines but still renders their empty container divs (`div.cm-line`). These empty lines will take up full vertical space. Combined with actual blank lines before and after the block, this creates a massive visual gap before and after code blocks in the editor.
* **Fix**:
  1. Add a class decoration (such as `cm-wysiwym-collapsed-fence`) to the opening and closing fence lines when they are collapsed.
  2. Set their visual and physical height to 0 in CSS to remove them from the vertical layout flow safely:
     ```css
     .cm-editor .cm-wysiwym-collapsed-fence {
       height: 0 !important;
       min-height: 0 !important;
       padding: 0 !important;
       margin: 0 !important;
       border: none !important;
       overflow: hidden !important;
       visibility: hidden !important;
     }
     ```
  3. Ensure the Preview Mode preformatted block (`.traven-preview pre`) has matching margins (`margin-top: 1.5em; margin-bottom: 1.5em;`) to maintain proportional layout parity.

### E. Editor Block Widgets and Floats (Coordinate Mapping Errors)
* **Problem**: Block replacement decorations (`Decoration.replace({ widget: ..., block: true })`) like the image shortcode widget will completely throw off cursor positioning for any content below them if CSS `float: left` or `float: right` or vertical `margin` is applied in the editor.
  - Floats remove elements from the normal document flow. CodeMirror's coordinate mapping (`posAtCoords`) expects all blocks to be stacked sequentially. A floated element makes text wrap beside it, which confuses CodeMirror, causing mouse clicks below/beside it to map to the wrong character offsets (typically landing on lines earlier in the document).
  - Vertical margins are not measured by CodeMirror's layout manager and create vertical displacement errors.
* **Fix**: Never use `float` or vertical `margin` on block widgets in the editor skins.
  - For horizontal alignment, use auto-margins (e.g. `margin: 0 auto 0 0 !important` to align left, `margin: 0 0 0 auto !important` to align right, and `margin: 0 auto !important` to center).
  - For vertical spacing, use top/bottom `padding` on the widget container instead of `margin`.
  - Floats are still fully supported and recommended in the HTML Preview (`.traven-preview`) stylesheet definitions where CodeMirror coordinate calculations do not apply.

### F. Font Family Inheritance on Nested Paragraphs (The CSS Cascade Override)
* **Problem**: `skin-starter.css` (which is bundled inside `dist/traven.css`) defines a high-priority `.traven-preview p { font-family: var(--traven-font-body) !important; }` rule. Because standard blockquotes, blockquote components (`[component="blockquote"]`), and info/warning notice components (`[info]`, `[warning]`) contain nested paragraph (`p`) elements, the nested `p` tags will inherit/use the starter skin's default body typeface (`Georgia` or `var(--traven-font-body)`), completely overriding any custom font-family declared on the parent container elements (such as `skin-editorial`'s `'Goudy Bookletter 1911'`, `skin-modern`'s `'Epunda Slab'`, or other custom skin stacks).
* **Fix**: When styling custom components, blockquotes, or any notice cards that contain paragraphs in both the editor and preview DOM scopes, target the container element and *all* its descendants (using the universal selector `*`) to apply the skin's custom typography with `!important`:
  ```css
  .cm-wysiwym-component-shortcode.component-info,
  .cm-wysiwym-component-shortcode.component-info * {
    font-family: 'Atkinson Hyperlegible Next', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  }
  ```

For the complete guide to runtime font customization using CSS custom properties — including dynamic Google Fonts loading, static overrides, and extending font roles beyond the default three — see **[Custom Typography](custom-typography.md)**.

---

## 7. Security & Input Sanitization

To protect host applications from Cross-Site Scripting (XSS) when rendering user-submitted Markdown as HTML, Traven includes an input sanitization pipeline.

### A. Fallback HTML Escaping
Traven's fallback Markdown-to-HTML parser (`#fallbackRender` in `packages/core/src/TravenEditor.js`) automatically encodes all raw HTML tags (such as `<script>`, `<iframe`, etc.) into escaped characters (`&lt;`, `&gt;`, `&amp;`) before parsing block/inline elements. This ensures that any direct HTML injection renders visually as plain text in the browser.

### B. Reusable URL Sanitizer (`packages/core/src/security.js`)
To protect against URI-based XSS attacks—specifically through Markdown links `[click](javascript:...)` or images `![alt](javascript:...)`—Traven isolates its URL sanitization logic inside [packages/core/src/security.js](../../packages/core/src/security.js).

* **Mechanism**: The exported `sanitizeUrl(url)` function normalizes input URLs by resolving HTML entity encodings (e.g. `j&#97;vascript:`) and percent encodings (e.g. `java%0ascript:`). It blocks dangerous URI schemes like `javascript:`, `data:`, and `vbscript:`, replacing them with `about:blank`.
* **Allowed Schemes**: The function explicitly allows safe protocols (`http:`, `https:`, `mailto:`, `tel:`), relative paths (e.g., `/about`), hashtag anchors (e.g., `#id`), and raw blog slugs (e.g., `my-slug-name`), ensuring users have complete freedom for local and internal routing.
* **Reusability**: Future features that parse or output links (such as the planned custom `[link]` / `[/link]` shortcode) should import and wrap URLs using `sanitizeUrl`:
  ```javascript
  import { sanitizeUrl } from "./security.js";
  
  const safeHref = sanitizeUrl(userProvidedUrl);
  ```

### C. HTML Block & Tag Rendering (WYSIWYM)
Traven includes an `HTMLPlugin` to render raw HTML blocks (`HTMLBlock` nodes) and paired inline HTML tags (`HTMLTag` nodes) inside the editor view when the cursor is outside.
*   **Security Trust Model**: The plugin assumes a trust model where Traven trusts the author's input model (the XSS surface is confined to what the author types, similar to a static site generator). For integrations reading untrusted content sources, a robust sanitizer (like DOMPurify) should be run at the integration boundary, not inside the core editor.
*   **Script & Event Stripping**: To prevent code execution inside the editor's live DOM view, a helper `safeHtmlForEditor` strips out `<script>` elements and inline event attributes (matching `/^on[a-z]+$/i` such as `onerror`, `onclick`). If `DOMParser` fails, it falls back to a safely escaped string.
*   **SVG ID Scoping**: Appending duplicate SVGs with internal references (e.g. `clipPath` and `textPath`) causes global ID collisions in the DOM (where the second SVG points to the first hidden SVG's IDs). To resolve this, Traven dynamically scopes IDs in WYSIWYM mode by appending a unique suffix (e.g. `blobClip-suffix`) and updates all corresponding references (e.g. `url(#...)`, `href="#..."`, styling attributes, and selectors within `<style>` blocks).
*   **Stack-based Tag Matcher**: Pairs inline HTML tags using an O(n) stack-based algorithm. Only the outermost paired elements are decorated to prevent overlapping/nested decorations inside CodeMirror.

### D. Standalone Compiler XSS Risks (`renderMarkdown` / `TravenRenderer`)
* **Unsanitized HTML Output**: The standalone rendering functions (`renderMarkdown` and `TravenRenderer`) output raw unescaped HTML for `HTMLBlock` and `HTMLTag` nodes. They do **not** run the editor's live DOM-only sanitization helper (`safeHtmlForEditor`) because they compile directly to static HTML strings.
* **Risk Mitigation**: If using Traven to compile untrusted user-submitted Markdown in a browser or server-side environment, you must pass the resulting HTML through a secure HTML sanitizer library (such as DOMPurify) before injecting it into any webpage:
  ```javascript
  import { renderMarkdown } from "@freedomware/traven";
  import DOMPurify from "dompurify";

  const rawHtml = renderMarkdown(untrustedMarkdownInput);
  const safeHtml = DOMPurify.sanitize(rawHtml);
  ```

---

## 8. LaTeX Math Support & Privacy-First Rendering

Traven features native LaTeX math rendering via custom parsing, dynamic editor widgets, and a fallback preview compilation pipeline:

### A. Custom Lezer Parser Extensions (`src/math-parser.js`)
* **Grammar definition**: An inline Lezer parser extension parses inline math (delimited by `$`) and display math blocks (delimited by `$$`). It outputs `InlineMath`, `BlockMath`, and `MathMark` syntax nodes.
* **Escaped delimiters**: Checks and skips escaped dollar signs (`\$`) to prevent false-positive delimiter matches in document bodies.

### B. WYSIWYM Math Widget (`MathWidget`)
* **Widget Lifecycle**: Registered in `src/wysiwym.js`. The math widget uses KaTeX to render equations when the cursor is outside the math block range, and collapses raw markup delimiters.
* **Cursor Focus Toggle**: When the cursor enters the node range, the widget is replaced with raw LaTeX markup to let authors edit equations in plain text.

### C. Fallback HTML Preview Compilation
* **Pipeline Extraction**: To prevent standard Markdown rules (like bold, italic, or links) from corrupting complex LaTeX symbols inside equation blocks, math blocks are extracted early in `#fallbackRender` and replaced with safe, unique placeholder tokens.
* **Post-processing Render**: The placeholder tokens are replaced back during the final rendering pass. They are compiled into HTML using KaTeX (if available) or styled local fallback HTML tags if KaTeX has not loaded.

### D. Privacy-First Asset Loading
* **Opt-in Only**: Dynamically loading KaTeX script and stylesheet tags is strictly opt-in and disabled by default.
* **Constructor Option**:
  - `katex: false` (Default): Checks for a pre-loaded global `window.katex` instance. If absent, falls back to local CSS-styled plain-text equations.
  - `katex: true`: Dynamically injects script and style tags to load the latest KaTeX package from a public CDN.
  - `katex: { js: "...", css: "..." }` or `katex: "..."`: Dynamically loads assets from local, self-hosted paths to keep the system fully offline and telemetry-free.

---

## 9. Floating & Hybrid Toolbar Architecture

Traven supports three toolbar layout modes: `"static"` (traditional fixed toolbar), `"floating"` (clean canvas with contextual menus), and `"hybrid"` (fixed toolbar with inline format bubble and gutter inserter helper menus).

### A. Viewport-Based Fallback
To ensure accessibility on mobile, the layout mode is resolved dynamically:
* **`isTouchPhone()`**: Scans viewports using CSS media query listeners (`pointer: coarse`, `hover: none`, and width `<= 768px`) to identify mobile touch devices.
* **Enforced Static Mode**: On touch-based mobile viewports, the editor automatically forces `toolbarMode: "static"`, ensuring user access to all formatting options without relying on precise mouse cursor selections.

### B. Dynamic Stylesheet Injection
* **`loadStyles()`**: To eliminate manual `<link>` management on host pages, `src/toolbar/load-styles.js` dynamically scans the DOM's stylesheets. If `.traven-slim-rail` is not already styled (meaning `dist/traven.css` has not been loaded), it appends a `<link>` pointing to the local `packages/core/assets/toolbars/toolbar-floating.css`.

### C. Slim Control Rail & Roving Tabindex
* **Rail Element**: In `"floating"` mode, the static toolbar is replaced by a horizontal rail containing global document-level actions (Undo, Redo, Save, Vim, Help, Clear, and Fullscreen) and the statistics widget.
* **Roving Tabindex**: Keyboard navigation in the rail follows the WAI-ARIA pattern: arrow keys navigate horizontally between buttons, updating the `tabindex` dynamically so pressing `Tab` returns the user back to the editor canvas smoothly.

### D. Selection Bubble Formatting
* **Format Bubble Menu**: Mounts formatting options directly near the cursor using CodeMirror 6 `showTooltip`.
* **Appearance Debounce**: The bubble does not appear instantly on selection to avoid flickering during selection drags. It is debounced by a configurable delay (`bubbleAppearDelay` options parameter, defaulting to 200ms) after the pointer stops moving.
* **Keyboard Trapping**: Pressing `Escape` while formatting dismisses the bubble and redirects focus directly back to the editor view.
* **Tablet Override**: On touch tablets, the bubble converts into a sticky bottom action bar, preventing soft-keyboard overlaps.

### E. Gutter Insertion Menu
* **Contextual Inserter**: Hovering or positioning the cursor on an empty line reveals a gutter `+` button, opening a block-insertion popup.
* **Hotkey Trigger**: Pressing `Mod-Shift-Enter` triggers the insert menu at the current cursor line.

### F. Selection-to-Block Insertion Shortcut
* **Mechanism**: The Selection Bubble features an insert shortcut button (`.btn-bubble-insert`, showing a pencil-ruler SVG) to insert block elements immediately after the selected text's line.
* **Layout Spacing & Newline Normalization**: To prevent block elements (e.g., tables, code blocks, figures) from colliding with preceding or succeeding paragraphs, the action dynamically inspects the characters succeeding the current line. It calculates and inserts the exact number of newlines needed to guarantee a 4-newline gap between the current line and subsequent content (or 3 newlines if at the end of the document).
* **Cursor Positioning**: The cursor is positioned at `anchorLine.to + 2` within this newly created spacing area, leaving exactly one blank line above and one blank line below. The Gutter Insertion Menu is then triggered at this cursor position on the next tick.





