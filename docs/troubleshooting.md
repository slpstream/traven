# Troubleshooting

Common issues developers run into when integrating Traven, and how to fix them.

---

## The editor doesn't appear on the page

**Symptom:** The `<traven-editor>` tag renders as nothing — the page is blank where the editor should be.

**Most likely cause:** The Traven `<script>` tag is missing or malformed.

```html
<!-- ✅ Correct — type="module", closing tag present -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>

<!-- ❌ Wrong — missing type="module" -->
<script src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

**Checklist:**
1. The `<script>` tag must use `type="module"`.
2. The `<script>` tag must appear *after* the `<traven-editor>` element in the DOM (or at the bottom of `<body>`).
3. Open your browser's developer console (`F12`) and look for network errors (404 for the script URL) or JavaScript errors.

---

## Form submits but the server receives an empty string

**Symptom:** The editor looks fine, but `$_POST['body']` (or `req.body.body`) is empty when the form is submitted.

**Most likely cause:** The `<traven-editor>` tag is missing its `name` attribute.

```html
<!-- ✅ Correct -->
<traven-editor name="body" toolbar>Content here</traven-editor>

<!-- ❌ Wrong — no name attribute, so the hidden textarea has no name -->
<traven-editor toolbar>Content here</traven-editor>
```

The `name` attribute is what connects the editor to the form submission. It works identically to the `name` attribute on a `<textarea>`.

---

## Toolbar buttons don't appear

**Symptom:** The editor renders, but there are no formatting buttons above it.

**Most likely cause:** The `toolbar` attribute is missing.

```html
<!-- ✅ With toolbar -->
<traven-editor name="body" toolbar>Content</traven-editor>

<!-- ❌ No toolbar — editor renders without buttons -->
<traven-editor name="body">Content</traven-editor>
```

To show only specific buttons, pass a comma-separated list:

```html
<traven-editor name="body" toolbar="bold, italic, link">Content</traven-editor>
```

See the [Cheat Sheet](cheatsheet.md) for the full list of available toolbar button keys.

---

## The editor's CSS looks broken or conflicts with my page

**Symptom:** Editor text is misaligned, buttons are unstyled, or the editor layout overlaps with host page elements.

**Cause:** Traven injects its CSS globally into the page. If your host page has aggressive CSS rules (especially `!important` on selectors like `body`, `*`, or CodeMirror's `cm-*` classes), they can bleed into the editor.

**Fixes:**

1. **Scope your host CSS.** Avoid `!important` on universal selectors. If you must use `!important`, scope it to a specific class (e.g., `.my-app body { ... }`) rather than bare `body` or `*`.

2. **Use a namespace wrapper.** Wrap your host page content in a container class and scope all your CSS to it:

   ```css
   /* Scope host styles so they don't bleed into the editor */
   .my-app h1 { font-size: 2rem; }
   .my-app p { line-height: 1.5; }
   ```

3. **Known limitation:** True CSS isolation requires a Shadow DOM adapter (on the roadmap). In the meantime, keeping host styles scoped is the recommended approach.

---

## Modals (image upload, link insertion) appear in the wrong position

**Symptom:** The image upload modal or link dialog opens, but it's offset, clipped, or appears far from where it should.

**Cause:** Traven's modals append to `document.body` with `position: fixed`. If any ancestor element of the editor has a CSS `transform`, `filter`, or `perspective` property, the browser creates a new stacking context that breaks `position: fixed` calculations.

**Fix:** Switch to `toolbar-mode="static"`, which renders the toolbar inline above the editor instead of floating:

```html
<traven-editor name="body" toolbar toolbar-mode="static">Content</traven-editor>
```

Alternatively, remove the `transform` or `filter` property from the ancestor element if possible.

---

## Content Security Policy (CSP) blocks the editor

**Symptom:** The editor doesn't load, and the browser console shows a CSP violation error like `Refused to apply inline style` or `Refused to load script`.

**Cause:** Traven dynamically injects its core CSS (`dist/traven.css`) into the page at runtime. A strict CSP that forbids dynamic stylesheet injection (`style-src 'self'` without `'unsafe-inline'`) will block this.

**Fix:** Disable auto-injection and load the stylesheet manually:

```html
<head>
  <!-- Load the CSS as a regular <link> tag instead of letting JS inject it -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@0.2.9/dist/traven.css">
</head>
<body>
  <traven-editor name="body" auto-load-styles="false">Content</traven-editor>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@0.2.9/dist/traven.js"></script>
</body>
```

If you are self-hosting, the paths point to your local copies of these files.

---

## Editor layout jumps or misaligns on first load

**Symptom:** When the page first loads, the editor appears briefly in the wrong size, then snaps to the correct layout. Or character positions are slightly off.

**Cause:** If the page loads custom web fonts (e.g., from Google Fonts), the editor initializes before the fonts finish downloading. CodeMirror caches character width measurements on init, and if the font isn't loaded yet, those measurements are wrong.

**Fix:** Initialize the editor only after fonts are ready:

```javascript
document.fonts.ready.then(() => {
  const editor = new TravenEditor({
    element: document.getElementById("editor"),
    initialValue: "# Hello"
  });
});
```

If you are using the `<traven-editor>` Web Component (which auto-initializes), this is handled for you automatically. The manual `document.fonts.ready` guard is only needed when using the `new TravenEditor()` constructor directly.

---

## Multiple editors on one page load the script multiple times

**Symptom:** You have several `<traven-editor>` tags on one page and wonder if you need multiple `<script>` tags.

**Answer:** No. The Traven script is an ES module — it initializes once and discovers all `<traven-editor>` elements on the page automatically. You only ever need a single `<script>` tag:

```html
<!-- These three editors all work with one script load -->
<traven-editor name="title" toolbar>Title here</traven-editor>
<traven-editor name="summary">Summary here</traven-editor>
<traven-editor name="body" toolbar line-numbers>Body here</traven-editor>

<!-- One script, at the bottom of the page -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

---

## Read-only mode isn't working

**Symptom:** You added `read-only` to the tag but the user can still type.

**Cause:** In HTML, `read-only` without a value is treated as the attribute being set to the empty string `""`. For boolean attributes on `<traven-editor>`, this *should* work — but if you're setting it via JavaScript, make sure you're passing the boolean `true`:

```html
<!-- ✅ Correct — HTML boolean attribute -->
<traven-editor name="body" read-only>Content</traven-editor>

<!-- ✅ Correct — JavaScript property -->
<script>
  document.querySelector("traven-editor").readOnly = true;
</script>
```

---

## Theme / skin doesn't change when I switch the `<link>` at runtime

**Symptom:** You change the skin `<link>` href dynamically, but the editor appearance doesn't update.

**This should work.** Traven skins are pure CSS, so swapping the `<link>` `href` at runtime causes the browser to re-apply styles immediately. If it's not working:

1. Make sure the new skin file actually exists at the URL you're pointing to (open it directly in your browser to verify).
2. If the skin is loaded via CDN, make sure the URL is correct and the file is accessible (no CORS issues).
3. Hard-refresh the page (`Ctrl+Shift+R`) to bypass the browser cache if you're developing locally.

See [Skins](skins.md) for a working skin-picker example.

---

## Where to get help

If none of the above resolves your issue:

- Check the [API Reference](api-reference.md) for the complete list of constructor options and methods.
- Check the [Cheat Sheet](cheatsheet.md) for every attribute you can put on `<traven-editor>`.
- Check the [Installation & Setup](installation-setup.md) guide for CDN vs. local hosting details.
