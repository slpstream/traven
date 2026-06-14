# Comparing Traven to Other Editor Options

When deciding which rich-text editor to embed in your project, it is helpful to understand the philosophy behind the tool. This is an honest, developer-to-developer comparison of what each tool is good at, where they fall short, where Traven clearly wins, and where Traven might not be the right fit for your project.

Traven is a **Markdown-first, WYSIWYM (What You See Is What You Mean)** editor built on the CodeMirror 6 engine. 

---

## HTML-First Editors

HTML-first editors natively manage document state as DOM nodes or custom JSON trees (like Deltas) and output HTML. If your backend needs Markdown, you must rely on brittle serializers to roundtrip the data.

| Feature | Traven | TinyMCE & CKEditor | TipTap, ProseMirror, Lexical | Trix |
| :--- | :--- | :--- | :--- | :--- |
| **Output** | Raw Markdown | HTML | HTML / Custom JSON | HTML |
| **Style** | WYSIWYM | WYSIWYG | Framework (Build-it) | WYSIWYG |
| **License** | MIT | Commercial / GPL | MIT | MIT |

### Traven vs. TinyMCE & CKEditor 5
These are the industry heavyweights. They have massive plugin ecosystems and aim to replicate Microsoft Word in the browser.
* **Where they win:** If you need deep enterprise features (like collaborative track changes, native `.docx` imports, or advanced table cell merging), they are the standard.
* **Where they fall short:** They are bloated, heavily opinionated, and use proprietary internal data models that make extracting pure Markdown a nightmare. Furthermore, their licensing has become hostile: TinyMCE requires an API key even for the free tier, and CKEditor forces a strict GPLv2+ or expensive commercial license.
* **Where Traven wins:** Traven is lightweight, MIT licensed, and can be fully self-hosted or loaded from a CDN. It natively speaks Markdown.
* **Where Traven falls short:** Traven is not a Microsoft Word clone. It does not have a 15-year-old marketplace of legacy enterprise plugins.

### Traven vs. TipTap, ProseMirror & Lexical
Lexical (by Meta) and ProseMirror (the foundation of TipTap) are incredibly powerful headless frameworks.
* **Where they win:** They are the absolute best choice if you are building a highly bespoke, collaborative Google Docs or Notion competitor from scratch, where every single keystroke is synced via CRDTs.
* **Where they fall short:** They are *frameworks*, not editors. Building a functional editor with them takes weeks of wrestling with React components and custom JSON schemas.
* **Where Traven wins:** Traven is a drop-in web component. You can add it to an HTML page in 30 seconds with zero build step. 

### Traven vs. Trix
Trix was built by Basecamp and is the default editor for the Ruby on Rails ecosystem (ActionText).
* **Where it wins:** Unparalleled, out-of-the-box integration with Rails.
* **Where it falls short:** It is stubbornly HTML-only. It forces its own opinionated HTML structure into your database and has absolutely zero support for Markdown.
* **Where Traven wins:** Markdown-in, Markdown-out. Traven keeps your database clean and portable.

---

## Block Editors

Block editors treat every paragraph, image, or list as a distinct data object (a "block").

| Feature | Traven | Editor.js | BlockNote & Bard | Gutenberg |
| :--- | :--- | :--- | :--- | :--- |
| **Output** | Raw Markdown | JSON | JSON / HTML | HTML (with comments) |
| **Flow** | Continuous Text | Discrete Blocks | Discrete Blocks | Discrete Blocks |
| **License**| MIT | MIT | MIT / Commercial | GPLv2 |

### Traven vs. Block Editors (Editor.js, BlockNote, Gutenberg, Bard)
Editor.js is a beautiful vanilla JS block editor. BlockNote is a highly respected modern block editor built on TipTap. Bard is a stunning UI built for the Statamic CMS (though encumbered by commercial licensing). Gutenberg is the default WordPress editor. 
* **Where they win:** If you are building a structured CMS where the database strictly requires separating content into discrete rows (e.g., storing an image block in a different database table than a text block), block editors are the right architectural choice.
* **Where they fall short:** They disrupt the natural flow of writing. Forcing content into discrete blocks can make copy-pasting complex text frustrating and interrupt long-form authorship.
* **Where Traven wins:** Traven provides a fluid, continuous writing experience where text is just text. It feels like writing a document, not assembling a form.
* **Where Traven falls short:** Traven outputs a single continuous Markdown string. It won't hand you an array of strictly parsed JSON block objects out-of-the-box.

---

## Markdown-First Editors

Markdown-first editors treat plain text as the absolute source of truth. The document is always portable.

| Feature | Traven | EasyMDE & SimpleMDE | Milkdown | Vditor |
| :--- | :--- | :--- | :--- | :--- |
| **Engine** | CodeMirror 6 | CodeMirror 5 | ProseMirror | Custom |
| **Style** | WYSIWYM (Inline), Split as option| Split-Pane | WYSIWYM | WYSIWYM / Split |
| **License**| MIT | MIT | MIT | MIT |

### Traven vs. EasyMDE & SimpleMDE
EasyMDE (and its predecessor SimpleMDE) are the most common open-source Markdown editors.
* **Where they win:** If you explicitly want the classic "source code on the left, rendered view on the right" split-pane layout, they do the job reliably.
* **Where they fall short:** They rely on the legacy CodeMirror 5 engine and require external assets like FontAwesome. The split-pane layout increases cognitive load.
* **Where Traven wins:** Traven uses the highly performant CodeMirror 6 engine, has zero peer dependencies, and renders formatting inline as you type, creating a much cleaner authoring environment.

### Traven vs. Milkdown
Milkdown is a WYSIWYM Markdown editor similar to Traven, but built on top of ProseMirror.
* **Where it wins:** Excellent out-of-the-box plugins and a plugin-driven architecture heavily tailored for React and Vue environments.
* **Where it falls short:** Because Milkdown uses ProseMirror, it inherits an HTML-first internal document model. Your Markdown is parsed into an HTML AST, edited, and serialized back to Markdown. This translation roundtrip can introduce formatting artifacts and spacing issues.
* **Where Traven wins:** Traven is built directly on CodeMirror 6, which natively treats the document as a flat string of text. Traven eliminates the brittle Markdown-HTML-Markdown roundtrip entirely.

### Traven vs. Vditor
Vditor is an extremely feature-rich Markdown editor that supports WYSIWYM, split-pane, and raw source modes.
* **Where it wins:** It does absolutely everything, including native rendering of mind maps, charts, and SVG.
* **Where it falls short:** It is incredibly bloated, loading massive chunks of code to support features most users don't need. Furthermore, its documentation and community are primarily tailored to the Chinese ecosystem, creating a barrier for Western developers.
* **Where Traven wins:** Traven is lightweight, rigorously documented in English, and focuses strictly on doing core Markdown exceptionally well rather than trying to be a kitchen sink.

---

## Summary: When to use Traven?

You should choose Traven if:
1. Your database or backend expects **pure Markdown**.
2. You want a **seamless writing experience** without split panes or discrete blocks.
3. You want an editor you can install with a **single `<script>` tag**.
4. You want to own your infrastructure without relying on **third-party API keys**.


