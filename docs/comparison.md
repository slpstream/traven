# Comparing Traven

When deciding which rich-text editor to embed in your project, it is helpful to understand the philosophy behind the tool. The web editor ecosystem is broadly divided into HTML-first editors, Block editors, and Markdown-first editors.

Traven is a **Markdown-first, WYSIWYM (What You See Is What You Mean)** editor built on CodeMirror 6. 

Here is how Traven compares to other popular options on the market.

---

## HTML-First Editors

HTML-first editors natively manage document state as DOM nodes or custom JSON trees (like Deltas) and output HTML. If your backend needs Markdown, you must rely on serializers to roundtrip the data.

| Feature | Traven | TinyMCE | TipTap / ProseMirror | Quill |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Output** | Raw Markdown | HTML | HTML / JSON | HTML / JSON |
| **Editing Style** | WYSIWYM | WYSIWYG | WYSIWYG | WYSIWYG |
| **License** | MIT | Commercial / Freemium | MIT | MIT |
| **Account Required**| No | Yes (API Key) | No | No |

### Traven vs. TipTap & ProseMirror
TipTap is a highly respected, headless framework built on top of ProseMirror.
* **Architecture:** ProseMirror (and by extension TipTap) is an HTML-first framework. While excellent for building rich web-based document editors, extracting clean Markdown requires wrestling with serializers that translate between HTML and Markdown. Traven is built on CodeMirror 6, treating plain text Markdown as the absolute source of truth. *(Note: ProseMirror and CodeMirror are sister projects created by the same developer, Marijn Haverbeke, but serve fundamentally different use cases).*
* **Drop-in vs. Build-it:** TipTap is a framework requiring you to build your own UI. Traven is a drop-in web component ready in 30 seconds.

### Traven vs. TinyMCE
TinyMCE is an industry heavyweight with a massive plugin ecosystem.
* **License and Lock-in:** TinyMCE recently changed its licensing model. You must register for an account and embed an API key, even for the free tier. Traven is MIT licensed and can be fully self-hosted or loaded directly from a CDN.

---

## Block Editors

Block editors treat every paragraph, image, or list as a distinct data object (a "block").

| Feature | Traven | Editor.js | BlockNote | Gutenberg |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Output** | Raw Markdown | Clean JSON | JSON / HTML | HTML (with comments) |
| **Document Flow** | Continuous Text | Discrete Blocks | Discrete Blocks | Discrete Blocks |
| **License** | MIT | MIT | MPL-2.0 | GPLv2 |

### Traven vs. Block Editors (Editor.js, BlockNote)
Editor.js and BlockNote are beautiful, highly respected, modern block-style editors with a very different philosophy from Traven. Gutenberg (the default WordPress editor) also falls into this category.
* **Data Structure:** Block editors typically output clean JSON objects (or specialized HTML) rather than standard Markdown. They are a fantastic choice if you want to build a structured, block-based CMS (like Notion).
* **Writing Flow:** Traven provides a continuous, fluid writing experience where text is just text. Block editors force content into discrete blocks, which can interrupt the flow of writing long-form text or managing seamless copy-pasting.

---

## Markdown-First Editors

Markdown-first editors treat plain text as the absolute source of truth. The document is always portable.

| Feature | Traven | EasyMDE / SimpleMDE | Milkdown |
| :--- | :--- | :--- | :--- |
| **Engine** | CodeMirror 6 | CodeMirror 5 | ProseMirror / TipTap |
| **Editing Style** | WYSIWYM (Inline) | Split-Pane | WYSIWYM |
| **License** | MIT | MIT | MIT |

### Traven vs. Milkdown
Milkdown is a WYSIWYM Markdown editor similar to Traven, but it is built on top of ProseMirror.
* **The Foundation:** Because Milkdown uses ProseMirror, it inherits the HTML-first internal document model. This means your Markdown is parsed into an HTML AST, edited, and then serialized back to Markdown. Traven is built directly on CodeMirror 6, which natively treats the document as a flat string of text. We believe CodeMirror 6 is the superior foundational architecture for a pure Markdown editor because it entirely eliminates the complex Markdown-HTML-Markdown roundtrip.

### Traven vs. EasyMDE
EasyMDE is the most common open-source Markdown editor.
* **Inline vs. Split-Pane:** EasyMDE uses a split-pane approach: raw Markdown source on the left, rendered HTML on the right. Traven is a true WYSIWYM editor, rendering formatting inline as you type, providing a much cleaner authoring environment.
* **Modern Foundation:** EasyMDE is built on the legacy CodeMirror 5 engine and requires external assets like FontAwesome. Traven is built on the highly performant CodeMirror 6 engine with zero peer dependencies.

---

## Summary: When to use Traven?

You should choose Traven if:
1. Your database or backend expects **pure Markdown**.
2. You want a **seamless writing experience** without split panes or discrete blocks.
3. You want an editor you can install with a **single `<script>` tag**.
4. You want to own your infrastructure without relying on **third-party API keys**.
