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
</head>
<body>

  <!-- Parent container for mounting -->
  <div class="editor-container">
    <div id="editor-mount"></div>
  </div>

  <script type="module">
    import { TravenEditor } from "https://cdn.jsdelivr.net/gh/slpstream/traven@v0.2.3/dist/traven.js";

    const editor = new TravenEditor({
      element: document.getElementById("editor-mount"),
      initialValue: "# Hello Traven via CDN\n\nEdit **this bold text** to see delimiters appear!",
      lineNumbers: true
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
</head>
<body>

  <!-- Parent containers for mounting -->
  <div class="editor-container">
    <div id="editor-mount"></div>
  </div>

  <script type="module">
    import { TravenEditor } from "./dist/traven.js";

    const editor = new TravenEditor({
      element: document.getElementById("editor-mount"),
      initialValue: "# Hello Traven\n\nEdit **this bold text** to see delimiters appear!",
      lineNumbers: true
    });
  </script>
</body>
</html>
```

## 3. Strict Content Security Policies (CSP)

By default, Traven dynamically injects its core CSS (`dist/traven.css`) into the page when the editor is instantiated. If your environment enforces a strict CSP that forbids dynamic stylesheet injection (`style-src 'self'`), this will fail.

To accommodate this, you can disable the auto-injection by passing `autoLoadStyles: false` in the constructor, and manually add the `<link rel="stylesheet" href="...">` tag to your document's `<head>`.

```html
<link rel="stylesheet" href="dist/traven.css">
<!-- ... -->
<script type="module">
  import { TravenEditor } from "./dist/traven.js";

  const editor = new TravenEditor({
    element: document.getElementById("editor-mount"),
    autoLoadStyles: false, // Disables dynamic CSS injection
    initialValue: "# Hello Traven"
  });
</script>
```
