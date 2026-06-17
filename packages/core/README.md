<p align="center">
  <img src="https://raw.githubusercontent.com/slpstream/traven/main/packages/core/assets/images/traven.png" alt="Traven Editor" width="400">
</p>

<p align="center">
  <strong>A rich-text Markdown editor you can drop into any PHP, Python, or HTML page with one <code>&lt;script&gt;</code> tag</strong><br>MIT Licensed · No API key · No account · No npm · No build step · Self-host or CDN
</p>

<p align="center">
  <a href="https://github.com/slpstream/traven/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@freedomware/traven"><img src="https://img.shields.io/npm/v/@freedomware/traven?color=orange" alt="NPM Version"></a>
  <img src="https://img.shields.io/badge/engine-CodeMirror_6-6aa00.svg" alt="CodeMirror 6 Engine">
  <img src="https://img.shields.io/badge/peer_dependencies-none-blue.svg" alt="Zero Peer Dependencies">
</p>

<p align="center">
  <a href="https://traven.dev">Live Demos</a> • 
  <a href="https://github.com/slpstream/traven/blob/main/docs/faq.md">FAQ</a> • 
  <a href="https://traven.dev/site/traven-vs-others.php">Compare</a> • 
  <a href="https://github.com/slpstream/traven/blob/main/docs/quickstart.md">Quick Start</a> • 
  <a href="https://github.com/slpstream/traven/blob/main/docs/cheatsheet.md">Cheat Sheet</a> • 
  <a href="https://github.com/slpstream/traven/blob/main/docs/api-reference.md">API</a> • 
  <a href="https://traven.dev/docs/">Documentation</a>
</p>

---

Traven is a self-contained, embeddable Markdown editor that renders your content live as you type. It gives you the seamless writing experience of a desktop editor, but in a single script tag or npm package.

The editor is entirely framework-agnostic. It works beautifully whether you are using a plain HTML file, a PHP template, or a complex application. It also respects your independence: Traven doesn't rely on any frameworks, and doesn't require an API key or setting up an account. It is open-source, MIT licensed, and outputs pure Markdown.

---

## Installation

### Via CDN (No Build Step)

You can load the script anywhere in your page to get Traven running immediately:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

### Via NPM

```bash
npm install @freedomware/traven
```

---

## Quick Start

### 1. Using the Web Component (HTML / PHP / Python Templates)

Once the script is loaded, you can drop the custom HTML element into your page and it will act like a standard form input:

```html
<form action="/save" method="POST">
  <traven-editor name="content" toolbar># Hello Traven</traven-editor>
  <button type="submit">Save</button>
</form>
```

### 2. Programmatic Instantiation (NPM / Bundlers)

To use Traven inside your bundler environment (Vite, Webpack, etc.):

```javascript
import { TravenEditor } from '@freedomware/traven';
// Make sure to import the CSS as well
import '@freedomware/traven/dist/traven.css';

const editor = new TravenEditor({
  target: document.getElementById('editor-container'),
  props: {
    value: '# Hello Traven',
    toolbar: true
  }
});
```

---

## Key Features

* **Dynamic Toolbars:** Choose from floating, hybrid, or static toolbar layouts, including formatting bubbles and gutter insert menus.
* **Math & Diagrams:** Built-in, lazy-loaded support for rendering LaTeX math equations and Mermaid diagrams.
* **Image Uploads:** Optimistic image uploads with drag-and-drop support.
* **Custom Shortcodes:** Extend standard Markdown with custom, interactive WYSIWYM widgets.
* **Bidirectional Sync:** Support for split-screen layouts where the raw Markdown and the visual editor stay perfectly in sync.
* **Vim Mode:** Built-in Vim emulation for power users.

---

## Framework Wrappers

If you are using a frontend framework, you can use the official wrappers:

* React: [`@freedomware/traven-react`](https://www.npmjs.com/package/@freedomware/traven-react)
* Svelte: [`@freedomware/traven-svelte`](https://www.npmjs.com/package/@freedomware/traven-svelte)
* Vue: [`@freedomware/traven-vue`](https://www.npmjs.com/package/@freedomware/traven-vue)

---

## License

Open-source, licensed under the [MIT License](https://github.com/slpstream/traven/blob/main/LICENSE).
