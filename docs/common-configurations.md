# Common Configurations

Ready-made configurations for common use cases. Pick the one closest to your situation, paste it into an HTML file, open it in a browser, and tweak from there.

---

## What's Included in the Bundle vs. What's Optional

Traven's distribution bundle is intentionally lean. The compiled `traven.js` includes CodeMirror 6, the Vim emulation module, the toolbar system, and the shortcode parsers. The compiled `traven.css` includes `skin-starter.css` and `toolbar-default.css`. That's everything you need for a fully working editor.

However, the following features are **not in the bundle** and must be loaded explicitly by your page if you want them:

| Feature | What to load | See |
|---|---|---|
| **LaTeX math** (`$...$`, `$$...$$`) | KaTeX CSS + JS (via CDN or self-hosted) | [LaTeX Support](latex-support.md) |
| **Mermaid diagrams** (`` ```mermaid ```) | Mermaid JS (via CDN or self-hosted) | [Mermaid Support](mermaid-support.md) |
| **Code syntax highlighting** | `@codemirror/language-data` (npm) or Prism.js / Highlight.js for rendered output | [Code Syntax Highlighting](code-syntax-highlighting.md) |
| **Non-default skins** | A separate `<link>` tag for the skin file | [Skins](skins.md) |
| **Non-default toolbars** | A separate `<link>` tag for the toolbar file | [Cheat Sheet](cheatsheet.md) |

If you try to use any of these features without loading the corresponding dependency, the editor will still work — but the feature will silently fall back or not render. The recipes below call out these dependencies wherever they are needed.

---

## 1. Minimal Comment Box

The simplest possible integration. No toolbar, no configuration — just a rich-text textarea that submits Markdown through a standard HTML form.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Leave a Comment</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }
    button { padding: 8px 16px; cursor: pointer; }
  </style>
</head>
<body>

  <h1>Leave a Comment</h1>
  <form action="" method="POST">
    <traven-editor name="comment">Write your thoughts here...</traven-editor>
    <br>
    <button type="submit">Post Comment</button>
  </form>

  <script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
</body>
</html>
```

**On the server** (PHP):

```php
<?php
$comment = $_POST['comment'] ?? '';
// Save $comment to your database — it contains raw Markdown
```

**What's happening:** The `<traven-editor>` tag replaces a `<textarea>`. No `toolbar` attribute means the formatting bar is hidden — the user writes plain Markdown. The form submits exactly like a standard textarea. The server receives raw Markdown in `$_POST['comment']`.

**Use case:** Embedded comments, feedback forms, contact forms, anywhere you want Markdown support without a visible toolbar.

---

## 2. Blog Post Editor

A full-featured content editing field with a toolbar, line numbers, an external skin, and a `Ctrl+S` save hook.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Edit Post</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/assets/skins/skin-light.css">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    #save-status { color: #64748b; font-size: 0.9em; }
    button { margin-top: 12px; padding: 10px 24px; cursor: pointer; background: #0f172a; color: #fff; border: none; border-radius: 4px; }
  </style>
</head>
<body>

  <div class="header">
    <h1>Editing: My First Post</h1>
    <span id="save-status">Ready</span>
  </div>

  <div id="editor-mount"></div>

  <script type="module">
    import { TravenEditor, DEFAULT_TOOLBAR } from "https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js";

    const editor = new TravenEditor({
      element: document.getElementById("editor-mount"),
      initialValue: `# My First Post\n\nStart writing here. Press **Ctrl+S** to save.`,
      toolbar: DEFAULT_TOOLBAR,
      lineNumbers: true,
      onSave: async (markdown) => {
        const statusEl = document.getElementById("save-status");
        statusEl.textContent = "Saving...";
        try {
          const res = await fetch("/api/posts/1", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: markdown })
          });
          statusEl.textContent = res.ok ? "Saved" : "Save failed";
          statusEl.style.color = res.ok ? "#22c55e" : "#ef4444";
        } catch {
          statusEl.textContent = "Connection lost";
          statusEl.style.color = "#ef4444";
        }
      }
    });
  </script>
</body>
</html>
```

**What's happening:** `skin-light.css` gives the editor a clean, readable look. The `onSave` callback fires when the user presses `Ctrl+S` / `Cmd+S` and POSTs the Markdown to your API. The status indicator provides feedback. Line numbers are enabled via the `lineNumbers: true` option.

**Use case:** The standard "I have a CMS and need a content editing field" — blogs, wikis, documentation platforms.

**See also:** [Saving & Auto-Save](saving.md) for the full load→edit→save round-trip lifecycle, including auto-save with debounced `onChange`.

---

## 3. CMS Admin Panel (Split-Before / Join-After)

The recommended pattern for CMS integrations. Document metadata (title, author, status) lives in structured HTML form inputs — not inside the editor. The YAML frontmatter is split on load and joined on save, keeping the editor focused on body content only.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CMS Editor</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/assets/skins/skin-starter.css">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    .meta-form { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .meta-form label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85em; color: #475569; }
    .meta-form input, .meta-form select { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9em; }
    .output { margin-top: 30px; background: #f1f5f9; padding: 16px; border-radius: 6px; font-family: monospace; font-size: 0.85em; white-space: pre-wrap; border: 1px solid #cbd5e1; }
    .output h3 { margin-top: 0; font-family: system-ui; }
  </style>
</head>
<body>

  <h1>CMS Editor — Structured Metadata</h1>

  <!-- Structured metadata form fields -->
  <div class="meta-form">
    <label>Title <input type="text" id="meta-title" value="My Post"></label>
    <label>Author <input type="text" id="meta-author" value="Jane Doe"></label>
    <label>Status <select id="meta-status"><option>Draft</option><option>Published</option></select></label>
  </div>

  <!-- Editor (body content only — no frontmatter) -->
  <div id="editor-mount"></div>

  <!-- Unified output preview -->
  <div class="output">
    <h3>Unified File (what gets stored):</h3>
    <div id="combined-output"></div>
  </div>

  <!-- KaTeX (optional — needed only if your content has LaTeX math) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>

  <script type="module">
    import { TravenEditor, DEFAULT_TOOLBAR } from "https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js";

    // ─── Frontmatter split/join helpers ───
    function splitFrontmatter(raw) {
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      if (!match) return { yaml: "", markdown: raw };
      return { yaml: match[1], markdown: match[2] };
    }

    function joinFrontmatter(yaml, markdown) {
      const trimmedYaml = yaml.trim();
      return trimmedYaml ? `---\n${trimmedYaml}\n---\n${markdown}` : markdown;
    }

    // ─── Load existing document from server ───
    // (In a real app, this would be a fetch() call to your API)
    const rawFile = `---
title: My Post
author: Jane Doe
status: Draft
---
# Hello World

This is the **body content**. The metadata above is managed by the form fields, not by the editor.`;

    const { markdown } = splitFrontmatter(rawFile);

    // ─── Initialize editor with body content only ───
    const editor = new TravenEditor({
      element: document.getElementById("editor-mount"),
      initialValue: markdown,
      toolbar: DEFAULT_TOOLBAR,
      katex: true,
      onChange: updatePreview
    });

    // ─── Update the unified output preview ───
    function updatePreview() {
      const body = editor.getValue();
      const yaml = `title: ${document.getElementById("meta-title").value}\nauthor: ${document.getElementById("meta-author").value}\nstatus: ${document.getElementById("meta-status").value}`;
      document.getElementById("combined-output").textContent = joinFrontmatter(yaml, body);
    }

    // Listen for metadata changes
    document.getElementById("meta-title").addEventListener("input", updatePreview);
    document.getElementById("meta-author").addEventListener("input", updatePreview);
    document.getElementById("meta-status").addEventListener("change", updatePreview);

    updatePreview();
  </script>
</body>
</html>
```

**What's happening:** On load, the raw file is split — YAML goes to the form inputs, Markdown goes to the editor. As the user edits either the metadata fields or the body, the unified output preview updates in real time. On save, `joinFrontmatter()` recombines them into a single string for storage.

**Why this pattern:** Letting users edit YAML freeform inside the editor risks schema corruption (malformed keys, wrong indentation, syntax errors). By splitting the frontmatter out, the host application owns metadata validation, and the editor focuses on writing.

**Note:** KaTeX is loaded explicitly in this example because the content may contain math. If your content does not use LaTeX, you can remove the KaTeX `<link>` and `<script>` tags and the `katex: true` option.

**See also:** [Host Integration Guide](integration.md) and [Integration Patterns](integration-patterns.md) for the full frontmatter management guide.

---

## 4. Three-Pane CMS (WYSIWYM + Raw Markdown + HTML Preview)

The full CMS editing experience. Three modes in a single workspace, switchable via tabs:

- **WYSIWYM** — the rich visual editing view
- **Markdown** — the raw source, editable with line numbers and Vim mode
- **Preview** — read-only HTML output showing what the post will look like when published

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Three-Pane Editor</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/assets/skins/skin-light.css">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    .tab-bar { display: flex; gap: 4px; margin-bottom: 0; }
    .tab-bar button { padding: 8px 16px; border: 1px solid #cbd5e1; border-bottom: none; background: #f1f5f9; cursor: pointer; border-radius: 6px 6px 0 0; font-size: 0.9em; }
    .tab-bar button.active { background: #fff; font-weight: 600; border-bottom-color: #fff; }
    .pane-container { border: 1px solid #cbd5e1; border-radius: 0 6px 6px 6px; min-height: 400px; }
    .pane { display: none; }
    .pane.active { display: block; }
    #raw-editor-mount .cm-editor { min-height: 400px; }
    #html-preview { padding: 24px; }
  </style>
</head>
<body>

  <h1>Three-Pane CMS Editor</h1>

  <div class="tab-bar">
    <button class="active" data-pane="wysiwym">WYSIWYM</button>
    <button data-pane="markdown">Markdown</button>
    <button data-pane="preview">Preview</button>
  </div>

  <div class="pane-container">
    <div id="wysiwym-pane" class="pane active">
      <div id="editor-mount"></div>
    </div>
    <div id="markdown-pane" class="pane">
      <div id="raw-editor-mount"></div>
    </div>
    <div id="preview-pane" class="pane">
      <div id="html-preview"></div>
    </div>
  </div>

  <!-- Mermaid (optional — needed only if your content has ```mermaid blocks) -->
  <!-- <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs" type="module"></script> -->

  <!-- KaTeX (optional — needed only if your content has $...$ math) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>

  <script type="module">
    import { TravenEditor, DEFAULT_TOOLBAR } from "https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js";

    // Enable Mermaid (uncomment the <script> tag above if you use diagrams)
    // TravenEditor.configureMermaid(true);

    const editor = new TravenEditor({
      element: document.getElementById("editor-mount"),
      sourceElement: document.getElementById("raw-editor-mount"),
      initialValue: `# My Blog Post

This is a **WYSIWYM editor** — formatting appears as you type.

## Try switching tabs

- **WYSIWYM**: Rich visual editing
- **Markdown**: Raw source with line numbers
- **Preview**: Rendered HTML output

> Blockquotes, code blocks, tables, and shortcodes all render in the preview pane.`,
      toolbar: DEFAULT_TOOLBAR,
      katex: true,
      theme: "light"
    });

    // ─── Tab switching ───
    const tabs = document.querySelectorAll(".tab-bar button");
    const panes = document.querySelectorAll(".pane");
    const previewEl = document.getElementById("html-preview");

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        panes.forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(tab.dataset.pane + "-pane").classList.add("active");

        // Refresh the HTML preview when switching to the Preview tab
        if (tab.dataset.pane === "preview") {
          previewEl.innerHTML = editor.getContentHtml();
          // If Mermaid is loaded, render diagrams in the preview:
          // TravenEditor.initMermaid(previewEl);
        }
      });
    });
  </script>
</body>
</html>
```

**What's happening:** A single `TravenEditor` instance is mounted with both `element` (WYSIWYM) and `sourceElement` (raw Markdown). Changes flow bidirectionally — editing in either pane updates the other. The Preview tab calls `editor.getContentHtml()` to compile the Markdown into HTML, and optionally renders Mermaid diagrams via `TravenEditor.initMermaid()`.

**Optional dependencies:** KaTeX and Mermaid are **not in the bundle**. If your content uses math or diagrams, load them explicitly (the KaTeX tags are included in the example; Mermaid is commented out). Without them, math falls back to monospaced text and diagrams fall back to syntax-highlighted code blocks.

**Use case:** Content authors who want the ease of WYSIWYM, the control of raw Markdown editing, and the confidence of seeing the rendered output before publishing.

---

## 5. Documentation / Code-Heavy Editor

An editor optimized for technical writing with code syntax highlighting, a curated toolbar, and a scholarly skin.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Documentation Editor</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/assets/skins/skin-academic.css">
</head>
<body style="font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px;">

  <h1>Documentation Editor</h1>
  <p>Optimized for technical writing with code blocks, tables, and structured headings.</p>

  <div id="editor-mount"></div>

  <script type="module">
    import { TravenEditor } from "https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js";

    // Code syntax highlighting — @codemirror/language-data is NOT in the bundle.
    // Install it: npm install @codemirror/language-data
    // Then import and pass it to the editor:
    // import { languages } from "@codemirror/language-data";
    // ...
    // codeLanguages: languages

    const editor = new TravenEditor({
      element: document.getElementById("editor-mount"),
      initialValue: `# API Reference

## Installation

\`\`\`bash
npm install my-package
\`\`\`

## Usage

\`\`\`javascript
import { createApp } from "my-package";

const app = createApp({
  debug: true,
  port: 3000
});

app.start();
\`\`\`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| \`debug\` | \`boolean\` | \`false\` | Enable debug logging |
| \`port\` | \`number\` | \`3000\` | Server port |

> **Note:** This package requires Node.js 18 or later.`,
      toolbar: [
        "bold", "italic", "strikethrough", "code", "|",
        "heading", "|",
        "bulletlist", "numberedlist", "tasklist", "|",
        "codeblock", "table", "blockquote", "hr", "|",
        "link", "search"
      ],
      lineNumbers: true,
      theme: "light"
    });
  </script>
</body>
</html>
```

**What's happening:** The toolbar is a curated subset — only the buttons relevant to technical documentation. Line numbers are enabled for precise editing. The `skin-academic.css` skin gives the editor a scholarly LaTeX-style appearance.

**Optional dependency:** Code syntax highlighting inside the editor requires `@codemirror/language-data`, which is **not in the bundle**. The example shows the import as a comment. Without it, code blocks render as plain monospace text (still perfectly readable, just without color highlighting).

For syntax highlighting in the **rendered HTML output** (not the editor itself), use Prism.js or Highlight.js on the page that displays the compiled content. See [Code Syntax Highlighting](code-syntax-highlighting.md) for both approaches.

**Use case:** Developer docs, README editors, technical blogs, API references, any content with a high ratio of code to prose.

---

## 6. Read-Only Preview

Display submitted Markdown as rendered HTML with no editing capability. Useful for preview-before-publish flows or embedding non-editable content.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Post Preview</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/assets/skins/skin-light.css">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    .controls { margin-bottom: 16px; display: flex; gap: 8px; }
    .controls button { padding: 6px 14px; cursor: pointer; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; }
    .controls button.active { background: #0f172a; color: #fff; border-color: #0f172a; }
  </style>
</head>
<body>

  <h1>Post Preview</h1>

  <div class="controls">
    <button id="btn-preview" class="active">Read-Only</button>
    <button id="btn-edit">Enable Editing</button>
  </div>

  <traven-editor name="body" read-only line-numbers>
# The Treasure of the Sierra Madre

A novel by **B. Traven**, first published in 1927.

## Summary

> The story follows two American prospectors, Dobbs and Curtin, who join forces with an old-timer named Howard to search for gold in the Sierra Madre mountains of Mexico.

The novel explores themes of:

- Greed and its corrosive effects on human nature
- The illusion of wealth as a path to happiness
- The dignity of ordinary people

## Key Quote

*"We've got to be sensible. We can't go off half-cocked. Gold is where you find it, but finding it isn't everything."*
  </traven-editor>

  <script type="module">
    import { TravenEditor } from "https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js";

    const editorEl = document.querySelector("traven-editor");

    // Toggle read-only mode
    document.getElementById("btn-preview").addEventListener("click", () => {
      editorEl.setAttribute("read-only", "true");
      document.getElementById("btn-preview").classList.add("active");
      document.getElementById("btn-edit").classList.remove("active");
    });

    document.getElementById("btn-edit").addEventListener("click", () => {
      editorEl.removeAttribute("read-only");
      document.getElementById("btn-edit").classList.add("active");
      document.getElementById("btn-preview").classList.remove("active");
    });
  </script>
</body>
</html>
```

**What's happening:** The `read-only` attribute renders the editor in display mode — the user can read and select text but cannot edit. The JavaScript toggles between read-only and editable mode, which is useful for preview-before-publish workflows.

**Use case:** Content review before publishing, embedding non-editable Markdown in a public page, showing submitted form content for confirmation.

---

## 7. Split-Screen Raw Sync

A power-user layout with the WYSIWYM editor on the left and a live raw Markdown view on the right. Changes in either pane update the other in real time. This is the core of Traven's bidirectional sync capability — built on CodeMirror 6 with line numbers and Vim keybindings, it's a serious editing tool, not just a pretty textarea.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Split-Screen Editor</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/assets/skins/skin-modern.css">
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
    h1 { text-align: center; margin-bottom: 16px; }
    .split-container { display: grid; grid-template-columns: 1fr 1fr; gap: 0; height: 80vh; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
    .pane-header { padding: 8px 16px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-size: 0.85em; font-weight: 600; color: #475569; }
    .split-container > div { display: flex; flex-direction: column; overflow: hidden; }
    .split-container > div:first-child { border-right: 1px solid #cbd5e1; }
    #editor-mount, #raw-editor-mount { flex: 1; overflow: auto; }
  </style>
</head>
<body>

  <h1>Split-Screen Editor</h1>

  <div class="split-container">
    <div>
      <div class="pane-header">WYSIWYM View</div>
      <div id="editor-mount"></div>
    </div>
    <div>
      <div class="pane-header">Raw Markdown</div>
      <div id="raw-editor-mount"></div>
    </div>
  </div>

  <script type="module">
    import { TravenEditor, DEFAULT_TOOLBAR } from "https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js";

    document.fonts.ready.then(() => {
      const editor = new TravenEditor({
        element: document.getElementById("editor-mount"),
        sourceElement: document.getElementById("raw-editor-mount"),
        initialValue: `# Split-Screen Editing

Edit in **either pane** — the other updates in real time.

## Features

- **Bidirectional sync**: Changes flow both ways without cursor position loss
- **Separate histories**: Each pane has its own undo/redo stack
- **Vim mode**: Add \`vimMode: true\` for Vim keybindings in the raw pane
- **Line numbers**: Enabled by default in the raw pane

\`\`\`javascript
// Code blocks render in both panes
const greeting = "Hello, world!";
console.log(greeting);
\`\`\`

> Try editing this text in either view.`,
        toolbar: DEFAULT_TOOLBAR,
        lineNumbers: true,
        theme: "light"
        // vimMode: true  — uncomment for Vim keybindings
      });
    });
  </script>
</body>
</html>
```

**What's happening:** The `sourceElement` option binds a second DOM element as the raw Markdown editor. Traven synchronizes changes bidirectionally — typing in the WYSIWYM pane updates the raw pane, and vice versa. Each pane maintains its own undo/redo history. Line numbers are shown in both panes.

**Why this matters:** Traven is built on CodeMirror 6. With line numbers and optional Vim keybindings, this isn't just a pretty toy — it's a professional editing environment. Power users, developers, and writers who think in Markdown will feel at home in the raw pane while still having the visual WYSIWYM view available.

**If you also need an HTML preview pane**, use Recipe 4 (Three-Pane CMS) instead.

**Use case:** Power users who want to see and edit raw source alongside the WYSIWYM view. Developer documentation teams. Anyone who prefers to work in Markdown but wants a visual check.

---

## 8. Toolbar Showcase (Bubble, Gutter, and Minimal Rails)

Traven provides three independent toolbar layers. You can use any combination, or none at all.

### The Three Toolbars

| Toolbar | Description | Default |
|---|---|---|
| **Main toolbar** (top rail) | The static bar at the top of the editor with formatting buttons | On (if `toolbar` attribute is present) |
| **Selection bubble** | A Medium-like context-aware formatting bar that appears when text is selected | On |
| **Gutter insertion menu** | A `+` icon in the editor gutter that opens an insert menu for blocks, images, and media | On |

### Configuration A: All three toolbars

```html
<traven-editor name="body" toolbar-mode="hybrid" toolbar>Content here</traven-editor>
```

All three toolbars are active. The main toolbar appears at the top, the selection bubble appears on text selection, and the gutter menu appears in the left margin.

### Configuration B: Main toolbar only (default)

```html
<traven-editor name="body" toolbar>Content here</traven-editor>
```

By default, omitting `toolbar-mode` puts the editor into `"static"` mode. The main toolbar appears at the top, while the selection bubble and gutter insertion menu remain disabled. No CSS overrides are required.

### Configuration C: No main toolbar — bubble and gutter only

```html
<traven-editor name="body" toolbar-mode="hybrid" toolbar="false">Content here</traven-editor>
```

Setting `toolbar-mode="hybrid"` enables the floating toolbar extensions, while `toolbar="false"` disables the persistent top toolbar. This provides a clean, distraction-free writing surface with bubble and gutter formatting available on demand.

### Configuration D: Floating toolbar (slim rail + bubble + gutter)

```html
<traven-editor name="body" toolbar-mode="floating" toolbar>Content here</traven-editor>
```

The main persistent toolbar is replaced by a slim vertical control rail pinned to the side of the container, while the selection bubble and gutter insertion menu remain active.

### Configuration E: Floating toolbar only (no slim rail)

```html
<traven-editor name="body" toolbar-mode="floating" toolbar="false">Content here</traven-editor>
```

Only the selection bubble and gutter insertion menu are active. This is a distraction-free editing experience where formatting controls only appear when text is selected or a new block is inserted.

### Configuration F: Custom button subset

```html
<traven-editor name="body" toolbar="bold, italic, link, image, |, heading, |, search">Content here</traven-editor>
```

The `|` separator creates visual dividers between button groups. Use this to show only the buttons your users actually need.

### Configuration G: Vim mode + line numbers (power user)

```html
<traven-editor name="body" toolbar line-numbers vim-mode>Content here</traven-editor>
```

Full Vim keybindings (normal/visual/insert mode), line numbers, and the complete toolbar. For developers who live in their terminal.

### Toggling toolbars at runtime via JavaScript

You can hide and show individual toolbars by toggling CSS classes on the `<traven-editor>` element:

```javascript
const editorEl = document.querySelector("traven-editor");

// Hide the main toolbar
editorEl.classList.add("hide-main-toolbar");

// Hide the selection bubble
editorEl.classList.add("hide-selection-bubble");

// Hide the gutter insertion menu
editorEl.classList.add("hide-gutter-insertion");

// Show them again by removing the classes
editorEl.classList.remove("hide-main-toolbar");
```

This is exactly how the toolbar toggles work in Traven's own `demo-toolbars.php` demo page, with state persisted to `localStorage`.

### Going further

Traven does not currently ship a bottom-rail or side-rail toolbar layout. But the toolbar is rendered with semantic CSS classes (`.toolbar-btn`, `.btn-bold`, `.btn-heading`, etc.) and the MIT license invites experimentation. If you build a creative toolbar layout, the architecture supports it — let a thousand flowers bloom.

**See also:** [Cheat Sheet](cheatsheet.md) for the full list of toolbar button keys, and [Customization & Styling](dev/customization-styling.md) for toolbar CSS class selectors.

---

## What's Next?

- **[Cheat Sheet](cheatsheet.md)** — Every attribute you can put on `<traven-editor>`, in one page.
- **[API Reference](api-reference.md)** — Constructor options, public methods, events, and formatting helpers.
- **[Skins](skins.md)** — All eight shipped skins, hot-swapping, and self-hosting fonts.
- **[Saving & Auto-Save](saving.md)** — Manual saves, debounced auto-save, and the full load→edit→save lifecycle.
- **[Troubleshooting](troubleshooting.md)** — Solutions to the most common integration issues.
