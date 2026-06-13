# Comparing Traven

When deciding which rich-text editor to embed in your project, it is helpful to understand the philosophy behind the tool. The web editor ecosystem is broadly divided into HTML-first editors, Markdown-first editors, and Block editors.

Traven is a **Markdown-first, WYSIWYM (What You See Is What You Mean)** editor built on CodeMirror 6. 

Here is how Traven compares to other popular options on the market.

## At a Glance

| Feature | Traven | TinyMCE | Quill / ProseMirror | EasyMDE / SimpleMDE |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Output** | Raw Markdown | HTML | HTML / Custom JSON | Raw Markdown |
| **Editing Style** | WYSIWYM (Inline) | WYSIWYG | WYSIWYG | Split-Pane |
| **License** | MIT (Free forever) | Commercial / Freemium | MIT | MIT |
| **Account Required?**| No | Yes (API Key) | No | No |
| **Dependencies** | None (Zero-dependency) | Varies | Varies | FontAwesome, etc. |
| **Framework Lock-in**| None (Web Component) | None | Often React-heavy | None |

---

## Detailed Comparisons

### Traven vs. TinyMCE

TinyMCE is the industry heavyweight. It is incredibly feature-rich and has a massive plugin ecosystem.

**Why choose Traven instead?**
* **License and Lock-in:** TinyMCE recently changed its licensing model. To use it, you must register for an account and embed an API key in your script tag, even for the free tier. Traven is MIT-licensed, requires no account, and will never track your usage or throttle your editor.
* **Output Format:** TinyMCE outputs HTML. If your backend needs to store clean, portable Markdown (for static site generators, API consumption, or native apps), you will have to rely on brittle HTML-to-Markdown converters. Traven is natively Markdown.

### Traven vs. Quill & ProseMirror

Quill and ProseMirror are excellent, highly customizable frameworks for building rich-text editors. 

**Why choose Traven instead?**
* **Drop-in vs. Build-it:** ProseMirror is a toolkit, not a ready-to-use editor. You have to build the editor yourself, which can take weeks of development. Traven is a drop-in solution that works in 30 seconds.
* **Markdown Native:** Quill and ProseMirror manage documents using their own internal JSON tree structures (like Deltas) and output HTML. Extracting clean Markdown requires writing custom serializers. Traven's underlying document state *is* Markdown.
* **Framework Agnostic:** While ProseMirror and Quill *can* be used with vanilla JavaScript, their ecosystems heavily lean towards React. Traven operates perfectly as a native Web Component (`<traven-editor>`), requiring no build step.

### Traven vs. EasyMDE / SimpleMDE

EasyMDE (and its predecessor SimpleMDE) are the most common open-source Markdown editors. 

**Why choose Traven instead?**
* **Inline vs. Split-Pane:** EasyMDE uses a split-pane approach: you write raw Markdown source code on the left, and a rendered HTML preview sits on the right. This requires the user to understand Markdown syntax and look back and forth. Traven is a **WYSIWYM** editor. It renders the formatting *inline* as you type, hiding the syntax when you step away from it. It feels like writing in Typora or a modern word processor, not a code editor.
* **Modern Engine:** EasyMDE is built on the legacy CodeMirror 5 engine and requires external dependencies like FontAwesome for its toolbar. Traven is built on the modern CodeMirror 6 engine, offering significantly better performance, accessibility, and mobile support with zero peer dependencies.

---

## Summary: When to use Traven?

You should choose Traven if:
1. Your database or backend expects **pure Markdown**.
2. You want a **seamless writing experience** without split panes.
3. You want an editor you can install with a **single `<script>` tag**.
4. You want to own your infrastructure without relying on **third-party API keys**.
