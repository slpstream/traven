# Installation & Setup

Traven is framework-agnostic and has zero peer dependencies. You can easily integrate it into your projects either by directly copying the compiled local assets or by loading them via CDN.

> **Understanding Toolbars vs. Skins (Themes)**
*   **Toolbar (Built-in & Optional):** Traven ships with a fully functional default toolbar (`toolbar-default.css`) baked directly into the core `traven.css` bundle. You do not need to load a separate stylesheet for the toolbar, though you can override it by loading any of the alternative layouts (like `toolbar-expandable.css`).
*   **Skin/Theme (Built-in Default):** The compiled bundle (`dist/traven.css`) ships with a built-in starter skin (`skin-starter.css`) that provides sane typographic defaults. No separate skin `<link>` is needed for basic usage. To customize the editor's appearance, load one of Traven's pre-built skins (like `skin-modern.css`, `skin-editorial.css`, `skin-dark.css`) or [develop your own skin](dev/theme-development.md) — the external skin will override the bundled defaults via normal CSS cascade.

## 1. CDN Include (Quickest Setup)

You can load Traven directly from the jsDelivr CDN without hosting any local assets.

> [!TIP]
> **Zero-Configuration Style Injection:** By default, Traven dynamically detects its load path via ES module URLs (`import.meta.url`) and automatically injects the corresponding core stylesheet (`traven.css`) into your document `<head>` on instantiation. You do not need to manually link any stylesheets in standard setups.

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
    <traven-editor name="body" toolbar>
      # Hello Traven via CDN

      Edit **this bold text** to see delimiters appear!
    </traven-editor>
  </div>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@0.2.10/dist/traven.js"></script>
</body>
</html>
```

> **Production Best Practice**: For production environments, it is highly recommended to pin the script URL to a specific version tag (e.g., `@0.2.10`) rather than omitting it, and to check the changelog before upgrading. This guarantees that future library updates do not introduce breaking behavior to your deployed application.

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
    <traven-editor name="body" toolbar line-numbers>
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

To accommodate this, you can disable the auto-injection by passing `auto-load-styles="false"` (Web Component) or `autoLoadStyles: false` (JS class constructor), and manually add the `<link rel="stylesheet" href="...">` tag to your document's `<head>`.

```html
<link rel="stylesheet" href="dist/traven.css">
<!-- ... -->
<traven-editor name="body" auto-load-styles="false"># Hello Traven</traven-editor>
<script type="module" src="./dist/traven.js"></script>
```

---

## 4. Known Limitations & Workarounds

While Traven acts as a highly portable drop-in editor, keep these temporary constraints in mind across both CDN and local setups:

*   **Style Encapsulation:** The core styles (`dist/traven.css`) are injected globally. If your host page uses `!important` tags on universally scoped selectors like `body`, or conflicts with CodeMirror's `cm-*` classes, you may experience layout bleed. True CSS isolation requires a Shadow DOM adapter (currently on the roadmap).
*   **Modal Positioning:** Rich tool modals (like the image uploader) currently append to `document.body` with fixed positioning. If your embed context involves ancestors with CSS `transform` or `filter` properties, the modal positioning can be incorrect. In these setups, prefer utilizing a static toolbar mode (`toolbar-mode="static"`).

For deep-dives into these and other workarounds, check out the **[Troubleshooting Guide](troubleshooting.md)**.

---

### Next Steps

Now that you have loaded Traven, choose how to integrate it:
* **For standard server-rendered forms:** Use the declarative `<traven-editor>` Web Component.
* **For client-side reactive frameworks (Alpine.js, Vue, React, Svelte):** Use the programmatic `new TravenEditor` JavaScript API.

For a full breakdown of these options, see the **[Host Integration Guide](integration.md)**.
