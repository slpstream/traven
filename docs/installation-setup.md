# Installation & Setup

Traven is framework-agnostic and has zero peer dependencies. You can easily integrate it into your projects either by directly copying the compiled local assets or by loading them via CDN.

> [!IMPORTANT]
> **Understanding Toolbars vs. Skins (Themes):**
> *   **Toolbar (Built-in & Optional):** Traven ships with a fully functional default toolbar (`toolbar-default.css`) baked directly into the core `traven.css` bundle. You do not need to load a separate stylesheet for the toolbar, though you can override it by loading any of the alternative layouts (like `toolbar-expandable.css`).
> *   **Skin/Theme (Built-in Default):** The compiled bundle (`dist/traven.css`) ships with a built-in starter skin (`skin-starter.css`) that provides sane typographic defaults. No separate skin `<link>` is needed for basic usage. To customize the editor's appearance, load one of Traven's pre-built skins (like `skin-modern.css`, `skin-editorial.css`, `skin-dark.css`) or [develop your own skin](dev/theme-development.md) — the external skin will override the bundled defaults via normal CSS cascade.

## 1. CDN Include (Quickest Setup)

> [!WARNING]
> **Known Limitations:** While `<traven-editor>` acts as a highly portable drop-in editor, keep these temporary constraints in mind:
> *   **Style Encapsulation:** The core styles (`dist/traven.css`) are injected globally. If your host page uses `!important` tags on universally scoped selectors like `body`, or conflicts with CodeMirror's `cm-*` classes, you may experience layout bleed. True CSS isolation requires a Shadow DOM adapter (on roadmap).
> *   **Modal Positioning:** Rich tool modals (like the image uploader) currently append to `document.body` with fixed positioning. If your embed context involves ancestors with `transform` or `filter` properties, the modal positioning can be incorrect. In these setups, prefer `toolbar-mode="static"`.

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
    <traven-editor name="body" line-numbers>
      # Hello Traven via CDN

      Edit **this bold text** to see delimiters appear!
    </traven-editor>
  </div>

  <script type="module" src="https://cdn.jsdelivr.net/gh/slpstream/traven@v0.2.4/dist/traven.js"></script>
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
    <traven-editor name="body" line-numbers>
      # Hello Traven

      Edit **this bold text** to see delimiters appear!
    </traven-editor>
  </div>

  <script type="module" src="./dist/traven.js"></script>
</body>
</html>
```

## 3. Strict Content Security Policies (CSP)

By default, Traven dynamically injects its core CSS (`dist/traven.css`) into the page when the editor is instantiated. If your environment enforces a strict CSP that forbids dynamic stylesheet injection (`style-src 'self'`), this will fail.

To accommodate this, you can disable the auto-injection by passing `autoLoadStyles: false` in the constructor, and manually add the `<link rel="stylesheet" href="...">` tag to your document's `<head>`.

```html
<link rel="stylesheet" href="dist/traven.css">
<!-- ... -->
<traven-editor name="body" auto-load-styles="false"># Hello Traven</traven-editor>
<script type="module" src="./dist/traven.js"></script>
```
