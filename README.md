<p align="center">
  <img src="packages/core/assets/images/traven.png" alt="Traven Editor" width="400">
</p>

<p align="center">
  <strong>A standalone, lightweight, framework-agnostic WYSIWYM Markdown Editor</strong>
</p>
<p align="center">
  Add Traven Editor to any website:
  LaTeX, Mermaid diagrams, table editor, image drag-n-drop, shortcode system, floating and hybrid toolbars, audio, video, custom Lezer extensions, 
  eight skins, eight toolbar options, ten demos, full documentation
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@freedomware/traven"><img src="https://img.shields.io/npm/v/@freedomware/traven?color=orange" alt="NPM Version"></a>
  <img src="https://img.shields.io/badge/engine-CodeMirror_6-6aa00.svg" alt="CodeMirror 6 Engine">
  <img src="https://img.shields.io/badge/peer_dependencies-none-blue.svg" alt="Zero Peer Dependencies">
</p>

---

## The Typora-like Markdown editor you can embed anywhere

```html
<!-- Include the editor with just a single line of code: -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

**Traven Editor** is a non-brittle WYSIWYM (What You See Is What You Mean) Markdown editor for embedding directly into custom CMS systems, administrative dashboards, web forms and apps. Built on the **CodeMirror 6** editing engine, Traven delivers a high-fidelity editing experience while outputting clean, raw Markdown.

Traven is highly modular and straightforward to customize or extend. If you need a powerful, flexible and mostly unopinionated Markdown editor that adapts to the layout, theme, and behavior of an existing project, its theming and configuration options and decoupled styling make integration fast and easy.

<p align="center">
 <a href="https://traven.dev/website/comparison.php" target="_blank">
  <img src="https://traven.dev/img/comparison-contactform2.png" alt="Before & After" width="100%">
 </a>
</p>

### Live Demos

Try Traven in your browser with **[Live Previews](https://traven.dev)**—a collection of demo sandboxes that showcase the editor in different layouts, skins, and toolbar configurations. 

Mix and match options, tweak settings, and explore how Traven adapts to any web environment without breaking a sweat. All demos use the same core codebase, so what you see is exactly what you get when you integrate Traven into your own project.

For a fast, hands-on integration, check out the **[Quick Start Guide](docs/quickstart.md)** to add Traven to a PHP form in just three steps. For a friendly ELI5 setup walkthrough with a full reference list of every `<traven-editor>` attribute and every `toolbar=` button key, see the **[Cheat Sheet](docs/cheatsheet.md)**.

<p align="center">
 <a href="https://traven.dev/index.php?img=workspace0" target="_blank">
  <img src="https://traven.dev/img/workspacehero.jpg" alt="Main Preview" width="100%">
 </a>
</p>
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
</p>

## Key Features

Traven Editor offers a modern WYSIWYM editing experience with support for:
* Collapsible Markdown syntax delimiters
* Dynamic floating/hybrid/static toolbar layouts (including format bubbles and gutter insert menus)
* Optimistic image uploads
* Extendible custom shortcode system
* Bidirectional raw sync
* Vim emulation
* Math rendering via LaTeX and Mermaid diagrams, and more. 

For a complete list and detailed explanation of all that Traven can do, see **[Key Features Documentation](docs/key-features.md)**.

### LaTeX & Mermaid Diagrams
Traven includes optional, privacy-first, lazy-loaded support for rendering mathematical equations (via LaTeX/KaTeX) and visual diagrams (via Mermaid) directly within the WYSIWYM editor and preview panels. For setup and integration details, see the **[LaTeX Math Support Guide](docs/latex-support.md)** and the **[Mermaid Diagram Support Guide](docs/mermaid-support.md)**.

---

### Installation & Setup

Traven is a framework-agnostic editor with zero peer dependencies. It can be integrated by referencing assets directly from the jsDelivr CDN, or by copying the compiled assets from the `dist/` directory into your host project.

> [!IMPORTANT]
> **Make it your own: Customize how you want the editor to look:**
> *   **Toolbar (Built-in & Optional):** Traven ships with a fully functional default toolbar (`toolbar-default.css`) baked directly into the core `traven.css` bundle. You do not need to load a separate toolbar, but if you want to customize it, the easiest way to do that is to just load any of the alternative layouts (like `toolbar-expandable.css`).
> *   **Skin/Theme (Built-in Default):** The compiled bundle (`dist/traven.css`) ships with a built-in starter skin (`skin-starter.css`) that provides sane typographic defaults. No separate skin `<link>` is needed for basic usage. To customize the editor's appearance, load one of the pre-built skins (like `skin-modern.css`, `skin-editorial.css`, `skin-dark.css`) or [develop your own skin](docs/dev/theme-development.md) — the external skin will override the bundled defaults.

#### CDN Integration (Quickest Setup)

Drop the editor module from the CDN into your page (the core styles and structural skin are auto-injected), and use the custom `<traven-editor>` tag:
```html
<form action="/submit" method="POST">
  <traven-editor name="body" toolbar># Hello Traven via CDN</traven-editor>
  <button type="submit">Save</button>
</form>

<!-- Load the module once in your page footer -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

From zero to hero: Get up and running with Traven in a matter of minutes, no coding required.

- **[Quick Start](docs/quickstart.md)** — Add Traven to a PHP form or HTML page in three steps: replace your `<textarea>`, load one script, and read the submission in PHP. The fastest path from zero to a working rich-text editor.
- **[Cheat Sheet](docs/cheatsheet.md)** — A comprehensive quick reference covering the 5-minute setup walkthrough, every configuration attribute, the full toolbar button catalog, skins, and common toolbar presets.
- **[Common Configurations](docs/common-configurations.md)** — Eight ready-made recipes for the most common use cases: minimal comment boxes, blog post editors, CMS admin panels, three-pane WYSIWYM/Raw/Preview editors, code-heavy documentation editors, read-only previews, split-screen raw sync, and toolbar configurations. Each is a complete, copy-pasteable HTML file.

> [!NOTE]
> **Strict CSP Environments:** If your project enforces a strict Content Security Policy that forbids dynamic stylesheet injection (`style-src 'self'`), you can disable the CSS auto-injection by passing `autoLoadStyles: false` in the constructor options, and manually add the `<link rel="stylesheet" href=".../dist/traven.css">` to your `<head>`.

For a deeper dive, check out alternative toolbar layouts, custom themes and skins, and detailed configuration options in the **[Installation & Setup Guide](docs/installation-setup.md)**.

#### Framework Wrappers (React, Vue, Svelte)

If you are building a Single Page Application, Traven provides official lightweight wrappers for React, Vue, and Svelte. See the **[Framework Wrappers Guide](docs/frameworks.md)** for installation instructions and component examples.

---

### API Reference

The Traven API exposes a constructor with a comprehensive set of configuration options, instance methods, and built-in text formatting helpers for controlling the editor state and interacting with the document.
For the full list of options, public methods, keyboard shortcuts, formatting helper recipes, and event listeners, please refer to the **[API Reference Documentation](docs/api-reference.md)**.

### Integration Patterns

Traven supports two primary patterns for managing document metadata and frontmatter: inline freeform editing directly inside the editor, or structured form field integration (Split-Before / Join-After) which is recommended for corporate CMS databases.
Architectural details, examples, and splitting/recombination helper functions are detailed in the **[Integration Patterns Guide](docs/integration-patterns.md)**.

### Customization & Styling

Editor themes, layouts, and toolbar behaviors are fully customizable. Choose between `"static"` (fixed top), `"floating"` (clean canvas with formatting bubble and gutter menus), or `"hybrid"` modes, swap stylesheet skins to match your website, or override selectors using custom CSS.
To learn more about CSS class listings, custom skin configurations, and toolbar styling options, consult the **[Customization & Styling Guide](docs/dev/customization-styling.md)**. For instructions on how to build a new theme from scratch or extend an existing skin, follow the **[Theme Development Guide](docs/dev/theme-development.md)**. To change the editor's fonts at runtime using CSS custom properties, see the **[Custom Typography Guide](docs/dev/custom-typography.md)**. To enable syntax highlighting for fenced code blocks inside the editor or in your HTML output, see the **[Code Syntax Highlighting Guide](docs/code-syntax-highlighting.md)**.

### Custom Shortcodes Architecture

Traven supports extending standard Markdown with custom shortcodes. By default, it comes with rich, interactive WYSIWYM widgets and semantic HTML compilers for `[image]`, `[video]`, `[audio]`, `[figure]`, and `[component]` layouts.
The technical blueprint, widget rendering lifecycles, and syntax extension details are covered in the **[Custom Shortcodes Architecture Guide](docs/dev/building-custom-shortcodes.md)**.

### Development

If you want to develop on Traven, start with the **[Development Guide](docs/dev/development.md)** which contains instructions for setting up the developer workspace, installing bundler dependencies, building local assets with esbuild, running the unit test suite, and serving the PHP integration demos locally.

---

### Naming & Philosophy

**"B. Traven"** was the self-chosen nym of the privacy-first author behind *The Treasure of the Sierra Madre*, who spent his career proving that the work outlasts its author, communicating with publishers pseudonymously and letting his writing speak for itself. For a framework-agnostic, open-source editor meant to be embedded, customized, and stay quietly out of the limelight, the name fits.

---

### License: MIT

Open-source, licensed under the [MIT License](LICENSE).
