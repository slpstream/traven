# LaTeX Math Support & KaTeX Integration

Traven is designed from the ground up to be a **privacy-first, zero-telemetry, and fully self-contained Markdown editor**. In line with this philosophy, Traven does not load external CDN dependencies, script tags, or third-party fonts by default.

When writing mathematical equations, Traven offers complete flexibility. You can configure LaTeX support using a local, self-hosted strategy or an optional CDN fallback.

---

## 1. How LaTeX Math Support Works

Traven supports math parsing in two common formats:
*   **Inline Math**: Wrapped in single dollar signs, e.g., `$E = mc^2$`.
*   **Display Math**: Wrapped in double dollar signs on their own lines, e.g.:
    ```latex
    $$\sum_{i=1}^n x_i^2$$
    ```

In the editor, math delimiters collapse dynamically when the cursor leaves, replacing the LaTeX markup with a visual rendering of the equation. If KaTeX has not loaded or is unavailable, Traven displays the equations using a clean, monospaced text fallback without hitting the network.

---

## 2. Integration Strategies

You can choose one of the three following integration strategies depending on your application's privacy, performance, and offline requirements.

### Strategy A: Local Self-Hosting (Recommended for Privacy-First & Offline Apps)

To keep Traven 100% self-contained and private, you can download KaTeX and host its JS, CSS, and font files on your own servers.

1. Download the latest KaTeX release from the [KaTeX GitHub Repository](https://github.com/KaTeX/KaTeX/releases).
2. Save the files to your public asset folder (e.g., `/assets/katex/`).
3. Initialize the editor by passing the local asset paths:

```javascript
import { TravenEditor } from "./dist/traven.js";

const editor = new TravenEditor({
  element: document.getElementById("editor-mount"),
  initialValue: "Inline formula: $a^2 + b^2 = c^2$",
  
  // Point to your locally-hosted KaTeX files
  katex: {
    js: "/assets/katex/katex.min.js",
    css: "/assets/katex/katex.min.css"
  }
});
```

---

### Strategy B: Global Preloading (Zero Config)

If your application already includes KaTeX globally (for rendering math outside the editor, for instance), Traven will automatically detect and reuse the global `window.katex` instance. No configuration is required.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- Load KaTeX locally or via custom headers -->
  <link rel="stylesheet" href="/assets/katex/katex.min.css">
  <script src="/assets/katex/katex.min.js"></script>
</head>
<body>
  <div id="editor-mount"></div>

  <script type="module">
    import { TravenEditor } from "./dist/traven.js";

    // No need to pass 'katex' option; Traven will automatically use window.katex
    const editor = new TravenEditor({
      element: document.getElementById("editor-mount"),
      initialValue: "Display formula: $$\\int_a^b f(x) dx$$"
    });
  </script>
</body>
</html>
```

---

### Strategy C: Opt-In JSDelivr CDN

For public web applications where external asset loading is acceptable, you can opt-in to JSDelivr CDN loading by passing `katex: true`. Traven will fetch KaTeX and its stylesheets dynamically from the CDN only when math blocks are present.

```javascript
import { TravenEditor } from "./dist/traven.js";

const editor = new TravenEditor({
  element: document.getElementById("editor-mount"),
  initialValue: "Inline formula: $E = mc^2$",
  
  // Opt-in to automatic CDN loading
  katex: true
});
```

---

## 3. Fallback Styling & Customization

When KaTeX is not loaded, Traven applies the `.traven-math-fallback` and `.traven-math-block-fallback` classes to format math text nicely in a monospace font.

You can customize the appearance of both the rendered math widget and the fallback text by targeting the following classes in your stylesheets:

```css
/* Styling for the live WYSIWYM rendered math widgets */
.cm-wysiwym-math-widget {
  padding: 2px 4px;
  background-color: var(--widget-bg);
  border-radius: 4px;
}

/* Fallback styling for inline math when KaTeX is not available */
.traven-math-fallback {
  font-family: 'Victor Mono', monospace;
  background-color: #f1f5f9;
  padding: 1px 4px;
  border-radius: 4px;
}

/* Fallback styling for display math blocks when KaTeX is not available */
.traven-math-block-fallback {
  font-family: 'Victor Mono', monospace;
  display: block;
  text-align: center;
  padding: 12px;
  background-color: #f8fafc;
  border-left: 4px solid #cbd5e1;
  margin: 1em 0;
}
```
