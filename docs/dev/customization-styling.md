# Customization & Styling

Skins are configured as plain CSS files, letting developers override colors and layout elements without running build systems.

**Understanding Toolbars vs. Skins (Themes):**
*   **Toolbar (Built-in & Optional):** Traven ships with a fully functional default toolbar (`toolbar-default.css`) baked directly into the core `traven.css` bundle. You do not need to load a separate stylesheet for the toolbar, though you can override it by loading any of the alternative layouts (like `toolbar-expandable.css`).
*   **Skin/Theme (Required & Decoupled):** Traven does *not* bundle a default skin. To remain an unopinionated embeddable component, the presentation layer (colors, fonts, line heights) is kept completely decoupled. Therefore, loading a skin stylesheet is **mandatory** for the editor viewport to render correctly. You must either include one of Traven's pre-built skins (like `skin-light.css`, `skin-dark.css`) or [develop your own skin](theme-development.md).

---

## Swapping Themes

Simply swap the styling link in your HTML document:

```html
<!-- For a slate, clean typography-focused feel: -->
<link rel="stylesheet" href="packages/core/assets/skins/skin-light.css">

<!-- For a warm, rust-tinted brand feel: -->
<link rel="stylesheet" href="packages/core/assets/skins/skin-colorful.css">

<!-- For a premium slate dark theme feel: -->
<link rel="stylesheet" href="packages/core/assets/skins/skin-dark.css">

<!-- For a distraction-free, quiet paper feel: -->
<link rel="stylesheet" href="packages/core/assets/skins/skin-editorial.css">

<!-- For a modern, high-contrast layout -->
<link rel="stylesheet" href="packages/core/assets/skins/skin-modern.css">

<!-- For an academic, LaTeX-style serif reading layout -->
<link rel="stylesheet" href="packages/core/assets/skins/skin-academic.css">

<!-- For runtime-configurable dynamic fonts via JavaScript: -->
<link rel="stylesheet" href="packages/core/assets/skins/skin-custom.css">
```

### Loading Skins via CDN

If using CDN integration, target the assets directly from the repository using jsDelivr:

```html
<!-- Example: Load skin-light.css via CDN (pinned version) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@0.2.9/assets/skins/skin-light.css">
```

---

## Customizing the Toolbar

You can customize the toolbar layout by passing an array of tool keys to the constructor's `toolbar` option, or hide buttons using CSS overrides.

### Available Toolbar Stylesheets

Alternative pre-configured toolbar presentation sheets are available in `packages/core/assets/toolbars/` and can be loaded dynamically or statically to swap editor layouts:
*   `toolbar-default.css`: The default clean toolbar skin, containing the full set of all available buttons.
*   `toolbar-compact.css` / `toolbar-compact-dark.css`: Slim layouts with reduced padding.
*   `toolbar-reduced.css` / `toolbar-reduced-dark.css`: Ultra-minimalist layouts for simplified interfaces.
*   `toolbar-expandable.css` / `toolbar-expandable-dark.css`: A dynamic "2-in-1" toolbar that toggles between core buttons and the full set when expanded.

### Toolbar Buttons & Selectors Reference

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

### Hiding Buttons via CSS

To hide buttons or re-style them, override classes in your local stylesheets:
```css
/* Hide the Heading and Redo buttons from the toolbar */
.toolbar-btn.btn-heading,
.toolbar-btn.btn-redo {
  display: none;
}
```
