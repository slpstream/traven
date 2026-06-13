<p align="center">
  <img src="packages/core/assets/images/traven.png" alt="Traven Editor" width="400">
</p>

<p align="center">
  <strong>A standalone, lightweight, framework-agnostic WYSIWYM Markdown Editor in your browser</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@freedomware/traven"><img src="https://img.shields.io/npm/v/@freedomware/traven?color=orange" alt="NPM Version"></a>
  <img src="https://img.shields.io/badge/engine-CodeMirror_6-6aa00.svg" alt="CodeMirror 6 Engine">
  <img src="https://img.shields.io/badge/peer_dependencies-none-blue.svg" alt="Zero Peer Dependencies">
</p>

<p align="center">
  <a href="https://traven.dev">Live Demos</a> • 
  <a href="docs/quickstart.md">Quick Start</a> • 
  <a href="docs/cheatsheet.md">Cheat Sheet</a> • 
  <a href="docs/api-reference.md">Documentation</a>
</p>

---

Traven is a self-contained, embeddable Markdown editor that renders your content live as you type. It gives you the seamless writing experience of a desktop editor, but in a simple script you can drop into any web page. 

Traven is entirely framework-agnostic. It works beautifully whether you are using a plain HTML file, a PHP template, or a complex React application. It also respects your independence: Traven doesn't rely on any frameworks, and doesn't require an API key or setting up an account. It is open-source, MIT licensed, and outputs pure Markdown.

```html
<!-- Include the editor with just a single line of code: -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

---

## What is WYSIWYM?

Traven is a **WYSIWYM** (What You See Is What You Mean) editor. This means it hides Markdown syntax when you are not editing it, showing clean, styled text instead. 

Type `**bold**` and the asterisks quietly step aside, leaving only the bold text visible. Move your cursor back inside the word, and the syntax reappears so you can edit it. The underlying document remains plain, portable Markdown—no hidden HTML, and no proprietary lock-in.

<p align="center">
 <a href="https://traven.dev/website/comparison.php" target="_blank">
  <img src="https://traven.dev/img/compareform2.jpg" alt="Before & After" width="100%">
 </a>
</p>

---

## Who is this for?

Traven is designed for developers building CMS systems, blog platforms, administrative dashboards, or any content-heavy forms. It is a perfect fit if:

* **You want clean Markdown output:** You need your content to remain portable, readable, and perfectly formatted as raw Markdown. 
* **You want a seamless writing experience:** You prefer an elegant inline editing experience that lets writers focus, rather than a divided split-pane view.
* **You want easy integration:** You need an editor that can be fully integrated and styled in just a few minutes, seamlessly adapting to the layout and theme of your existing project.

<p align="center">
 <a href="https://traven.dev/index.php?img=workspace0" target="_blank">
  <img src="https://traven.dev/img/workspacehero.jpg" alt="Main Preview" width="100%">
 </a>
</p>

---

## 30-Second Install

The fastest way to get Traven running is by dropping the custom HTML element into your page.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Traven Editor</title>
</head>
<body>

  <!-- The editor acts just like a standard form input -->
  <form action="/save" method="POST">
    <traven-editor name="content" toolbar># Hello Traven</traven-editor>
    <button type="submit">Save</button>
  </form>

  <!-- Load the script anywhere in your page -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>

</body>
</html>
```

For more advanced setups, you can also instantiate Traven programmatically via `new TravenEditor()`.

---

## Key Features

* **Dynamic Toolbars:** Choose from floating, hybrid, or static toolbar layouts, including formatting bubbles and gutter insert menus.
* **Math & Diagrams:** Built-in, lazy-loaded support for rendering LaTeX math equations and Mermaid diagrams.
* **Image Uploads:** Optimistic image uploads with drag-and-drop support. Audio and video supported, too.
* **Custom Shortcodes:** Extend standard Markdown with custom, interactive WYSIWYM widgets.
* **Bidirectional Sync:** Support for split-screen layouts where the raw Markdown and the visual editor stay perfectly in sync.
* **Vim Mode:** Built-in Vim emulation for power users.

For a complete breakdown of features, see the **[Key Features Documentation](docs/key-features.md)**.

---

## Dive Deeper

Traven is highly modular and endlessly customizable. Check out the documentation to learn more about advanced configurations, theming, and frameworks:

* **[Quick Start](docs/quickstart.md)** — Step-by-step guides for adding Traven to PHP forms and HTML pages.
* **[Cheat Sheet](docs/cheatsheet.md)** — A quick reference for every `<traven-editor>` attribute and configuration option.
* **[Common Configurations](docs/common-configurations.md)** — Ready-made recipes for common use cases (e.g., minimal comment boxes, CMS admin panels).
* **[Customization & Styling](docs/dev/customization-styling.md)** — Learn how to swap skins, override selectors, and build custom themes.
* **[Framework Wrappers](docs/frameworks.md)** — Official wrappers and integration guides for React, Vue, and Svelte.
* **[API Reference](docs/api-reference.md)** — The complete list of constructor options, public methods, and events.

---

## Gallery

<table align="center">
  <tr>
    <td>
      <a href="https://traven.dev/index.php?img=workspace1" target="_blank">
        <img src="https://traven.dev/img/workspace1.jpg" alt="Thumbnail 1" width="190"/>
      </a>
    </td>
    <td>
      <a href="https://traven.dev/index.php?img=workspace2" target="_blank">
        <img src="https://traven.dev/img/workspace2.jpg" alt="Thumbnail 2" width="190"/>
      </a>
    </td>
    <td>
      <a href="https://traven.dev/index.php?img=workspace3" target="_blank">
        <img src="https://traven.dev/img/workspace3.jpg" alt="Thumbnail 3" width="190"/>
      </a>
    </td>
    <td>
      <a href="https://traven.dev/index.php?img=workspace4" target="_blank">
        <img src="https://traven.dev/img/workspace4.jpg" alt="Thumbnail 4" width="190"/>
      </a>
    </td>
  </tr>
  <tr>
    <td>
      <a href="https://traven.dev/index.php?img=workspace5" target="_blank">
        <img src="https://traven.dev/img/workspace5.jpg" alt="Thumbnail 5" width="190"/>
      </a>
    </td>
    <td>
      <a href="https://traven.dev/index.php?img=workspace6" target="_blank">
        <img src="https://traven.dev/img/workspace6.jpg" alt="Thumbnail 6" width="190"/>
      </a>
    </td>
    <td>
      <a href="https://traven.dev/index.php?img=workspace7" target="_blank">
        <img src="https://traven.dev/img/workspace7.jpg" alt="Thumbnail 7" width="190"/>
      </a>
    </td>
    <td>
      <a href="https://traven.dev/index.php" target="_blank">
        <img src="https://traven.dev/img/workspace8.jpg" alt="Thumbnail 8" width="190"/>
      </a>
    </td>
  </tr>
</table>

---

## Naming & Philosophy

**"B. Traven"** was the self-chosen nym of the privacy-first author behind *The Treasure of the Sierra Madre*, who spent his career proving that the work outlasts its author, communicating with publishers pseudonymously and letting his writing speak for itself. It is the right name for a framework-agnostic, open-source editor meant to be embedded and stay quietly out of the limelight.

---

## License

Open-source, licensed under the [MIT License](LICENSE).

