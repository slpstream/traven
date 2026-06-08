# Custom Typography

Traven's typography is controlled entirely through CSS custom properties. This means you can change the fonts used in the editor — headings, body text, and code blocks — at any time, from any framework, without calling a dedicated API method.

> [!NOTE]
> Traven intentionally does not provide a `setFonts()` method. Font selection is a **skin/theme concern**, not an editor concern. The CSS custom property pattern keeps font roles open for extension — any skin can define its own variables (e.g. `--traven-font-caption`) without requiring changes to the editor core.

---

## The Three Font Roles

The bundled `skin-starter.css` and the parameterized `skin-custom.css` define three CSS custom properties on `:root`:

| Variable | Role | Default Fallback |
|----------|------|------------------|
| `--traven-font-display` | Headings, component headers, pullquote shortcodes | System sans-serif stack |
| `--traven-font-body` | Paragraphs, list items, blockquotes | Georgia / serif stack |
| `--traven-font-mono` | Inline code, fenced code blocks, YAML frontmatter | System monospace stack |

These variables cascade into the WYSIWYM editor, the raw Markdown editor, and the HTML preview pane automatically.

---

## Setting Fonts at Runtime

The pattern is two steps:

1. **Set the CSS custom property** on `:root` (or any ancestor of the editor).
2. **Re-measure the CodeMirror viewport** so character widths recalculate.

### Minimal Example

```javascript
// 1. Set the variable
document.documentElement.style.setProperty(
  "--traven-font-body",
  "'Inter', sans-serif"
);

// 2. Wait for the font to load, then re-measure
document.fonts.ready.then(() => {
  const view = editor.getView();
  if (view) {
    view.requestMeasure();
  }
});
```

That's it. The skin CSS picks up the new variable value immediately; `requestMeasure()` tells CodeMirror to recalculate line heights and character widths for the new typeface.

---

## Loading Web Fonts

Setting a CSS variable alone won't render a typeface the browser doesn't have. You also need to load the font file — typically from Google Fonts, a local `@font-face`, or a bundled package.

### Google Fonts (Dynamic)

Inject a `<link>` element pointing to the Google Fonts CSS API:

```javascript
function applyGoogleFont(role, familyName, gfontsParam) {
  // Inject the Google Fonts stylesheet
  const linkId = `gfont-link-${role}`;
  let linkEl = document.getElementById(linkId);

  if (!linkEl) {
    linkEl = document.createElement("link");
    linkEl.id = linkId;
    linkEl.rel = "stylesheet";
    document.head.appendChild(linkEl);
  }
  linkEl.href = `https://fonts.googleapis.com/css2?family=${gfontsParam}&display=swap`;

  // Apply the CSS variable
  document.documentElement.style.setProperty(
    `--traven-font-${role}`,
    `'${familyName}', sans-serif`
  );

  // Re-measure after the font loads
  document.fonts.ready.then(() => {
    const view = editor.getView();
    if (view) view.requestMeasure();
  });
}

// Usage
applyGoogleFont("display", "Playfair Display", "Playfair+Display:wght@700;900");
applyGoogleFont("body", "Inter", "Inter:wght@400;600;700");
applyGoogleFont("mono", "JetBrains Mono", "JetBrains+Mono:wght@400;700");
```

### Local `@font-face`

If your project bundles font files, declare them in your stylesheet and reference them via the variable:

```css
@font-face {
  font-family: "MyCustomSerif";
  src: url("/fonts/my-custom-serif.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
```

```javascript
document.documentElement.style.setProperty(
  "--traven-font-body",
  "'MyCustomSerif', Georgia, serif"
);

document.fonts.ready.then(() => {
  const view = editor.getView();
  if (view) view.requestMeasure();
});
```

### Static (No JavaScript)

If your fonts don't change at runtime, you can skip JavaScript entirely. Override the variables in your own stylesheet or a custom skin:

```css
:root {
  --traven-font-display: "Outfit", sans-serif;
  --traven-font-body: "Libre Baskerville", serif;
  --traven-font-mono: "Fira Code", monospace;
}
```

Load the corresponding Google Fonts `<link>` in your HTML `<head>` and the editor will use them on first paint — no `requestMeasure()` needed, since the editor already calls it once on `document.fonts.ready` during initialization.

---

## Using `skin-custom.css`

For the full dynamic typography experience, load `skin-custom.css` instead of another skin. This skin is specifically designed as a parameterized overlay — it inherits all layout and color rules from the bundled `skin-starter.css` and exposes the three font variables for runtime control.

```html
<link rel="stylesheet" href="packages/core/assets/skins/skin-custom.css">
```

See `demo-typography.php` for a complete working example with dropdown font selectors, Google Fonts integration, and localStorage persistence.

---

## Extending with Custom Variables

Because this system is pure CSS, you can define additional font variables in your own skin without modifying the editor:

```css
/* my-skin.css */
:root {
  --traven-font-display: "Outfit", sans-serif;
  --traven-font-body: "Source Serif Pro", serif;
  --traven-font-mono: "JetBrains Mono", monospace;
  --traven-font-caption: "Inter", sans-serif;    /* Custom role */
  --traven-heading-weight: 800;                   /* Custom property */
}

.traven-preview figcaption {
  font-family: var(--traven-font-caption);
}

.cm-heading,
.traven-preview h1,
.traven-preview h2,
.traven-preview h3 {
  font-weight: var(--traven-heading-weight);
}
```

This extensibility is the reason font control lives in CSS rather than a fixed JavaScript API — you can add new typographic roles at any time without waiting for editor releases.
