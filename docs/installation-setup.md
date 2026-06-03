# Installation & Setup

Traven is framework-agnostic and has zero peer dependencies. You can easily integrate it into your projects either by directly copying the compiled local assets or by loading them via CDN.

> [!IMPORTANT]
> **Understanding Toolbars vs. Skins (Themes):**
> *   **Toolbar (Built-in & Optional):** Traven ships with a fully functional default toolbar (`toolbar-default.css`) baked directly into the core `traven.css` bundle. You do not need to load a separate stylesheet for the toolbar, though you can override it by loading any of the alternative layouts (like `toolbar-expandable.css`).
> *   **Skin/Theme (Required & Decoupled):** Traven does *not* bundle a default skin. To remain an unopinionated embeddable component, the presentation layer (colors, fonts, line heights) is kept completely decoupled. Therefore, loading a skin stylesheet is **mandatory** for the editor viewport to render correctly. You must either include one of Traven's pre-built skins (like `skin-default.css`, `skin-dark.css`) or [develop your own skin](theme-development.md).

## 1. CDN Include (Quickest Setup)

You can load Traven directly from the jsDelivr CDN without hosting any local assets:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Traven CDN Integration</title>
  
  <!-- Load base styling (includes default toolbar) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/slpstream/traven@v0.2.2/dist/traven.css">
  
  <!-- Load a skin stylesheet -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/slpstream/traven@v0.2.2/assets/skins/skin-default.css">
</head>
<body>

  <!-- Parent container for mounting -->
  <div class="editor-container">
    <div id="editor-mount"></div>
  </div>

  <script type="module">
    import { TravenEditor } from "https://cdn.jsdelivr.net/gh/slpstream/traven@v0.2.2/dist/traven.js";

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

If you prefer to host files locally, copy `dist/traven.js`, `dist/traven.css`, and your preferred skin stylesheet (from `assets/skins/`) into your host project directory, and include them:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Traven Local Integration</title>
  
  <!-- Load base styling (includes default toolbar) -->
  <link rel="stylesheet" href="dist/traven.css">
  
  <!-- Load the stylesheet skin -->
  <link rel="stylesheet" href="assets/skins/skin-default.css">
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
