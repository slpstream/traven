# Installation & Setup

Traven is framework-agnostic and has zero peer dependencies. You can easily integrate it into your projects either by directly copying the compiled local assets or by loading them via CDN.

> [!IMPORTANT]
> **Understanding Toolbars vs. Skins (Themes):**
> *   **Toolbar (Built-in & Optional):** Traven ships with a fully functional default toolbar (`toolbar-default.css`) baked directly into the core `traven.css` bundle. You do not need to load a separate stylesheet for the toolbar, though you can override it by loading any of the alternative layouts (like `toolbar-expandable.css`).
> *   **Skin/Theme (Built-in Default):** The compiled bundle (`dist/traven.css`) ships with a built-in starter skin (`skin-starter.css`) that provides sane typographic defaults. No separate skin `<link>` is needed for basic usage. To customize the editor's appearance, load one of Traven's pre-built skins (like `skin-modern.css`, `skin-editorial.css`, `skin-dark.css`) or [develop your own skin](theme-development.md) — the external skin will override the bundled defaults via normal CSS cascade.

## 1. CDN Include (Quickest Setup)

You can load Traven directly from the jsDelivr CDN without hosting any local assets:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Traven CDN Integration</title>
  
  <!-- Load Traven styles (includes default toolbar + starter skin) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/slpstream/traven@v0.2.3/dist/traven.css">
</head>
<body>

  <!-- Parent container for mounting -->
  <div class="editor-container">
    <div id="editor-mount"></div>
  </div>

  <script type="module">
    import { TravenEditor } from "https://cdn.jsdelivr.net/gh/slpstream/traven@v0.2.3/dist/traven.js";

    // Defer initialization until fonts are ready for CodeMirror coordinate caching
    document.fonts.ready.then(() => {
      const editor = new TravenEditor({
        element: document.getElementById("editor-mount"),
        initialValue: "# Hello Traven via CDN\n\nEdit **this bold text** to see delimiters appear!",
        lineNumbers: true
      });
    });
  </script>
</body>
</html>
```

## 2. Direct Include (Local Assets)

If you prefer to host files locally, copy `dist/traven.js` and `dist/traven.css` into your host project directory, and include them. The bundle already contains the starter skin, so no separate skin file is needed for basic usage:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Traven Local Integration</title>
  
  <!-- Load Traven styles (includes default toolbar + starter skin) -->
  <link rel="stylesheet" href="dist/traven.css">
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
