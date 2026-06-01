<p align="center">
  <img src="assets/images/traven.png" alt="Traven Editor" width="400">
</p>

<p align="center">
  <strong>A standalone, lightweight, framework-agnostic WYSIWYM Markdown Editor</strong>
</p>
<p align="center">
  Add Traven Editor to any website:
  LaTeX, table editor, image modal, shortcode system, audio, video, custom Lezer extensions, 
  four skins, five demos, six toolbars, full documentation
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/version-0.1.9-orange.svg" alt="Version 0.1.9">
  <img src="https://img.shields.io/badge/engine-CodeMirror_6-6aa00.svg" alt="CodeMirror 6 Engine">
  <img src="https://img.shields.io/badge/peer_dependencies-none-blue.svg" alt="Zero Peer Dependencies">
</p>

---

## The Typora-like Markdown editor you can embed anywhere

**Traven Editor** is a non-brittle WYSIWYM (What You See Is What You Mean) Markdown editor for embedding directly into custom CMS systems, administrative dashboards, web forms and apps. Built on the **CodeMirror 6** editing engine, Traven delivers a high-fidelity editing experience while outputting clean, raw Markdown.

Traven is highly modular and straightforward to customize or extend. If you need a powerful, flexible and mostly unopinionated Markdown editor that adapts to the layout, theme, and behavior of an existing project, its theming and configuration options and decoupled styling make integration fast and easy.

---

## Live Demos

Go to **[Traven.dev](https://traven.dev)** to try the Traven framework-agnostic WYSIWYM editor with live previews in different demo sandboxes. 

Mix and match different combinations of toolbar buttons, skins, and editor layouts to see the flexibility of how Traven can be themed and configured to fit any setting where JavaScript works.

---

## Key Features

Traven Editor offers a modern WYSIWYM editing experience with support for collapsible markdown syntax delimiters, optimistic image uploads, a custom shortcode system, bidirectional raw sync, Vim emulation, math rendering via LaTeX, and more. 

Find the complete list and detailed explanation of all that Traven can do in **[Key Features Documentation](docs/key-features.md)**.

---

## Installation & Setup

Traven is a framework-agnostic editor with zero peer dependencies. It can be easily integrated by including the built JS bundle and styling sheet directly in your HTML and deferred-initializing the editor.

Check out integration code recipes, templates, and setup options in the **[Installation & Setup Guide](docs/installation-setup.md)**.

---

## API Reference

The Traven API exposes a constructor with a comprehensive set of configuration options, instance methods, and built-in text formatting helpers for controlling the editor state and interacting with the document.

For the full list of options, public methods, keyboard shortcuts, formatting helper recipes, and event listeners, please refer to the **[API Reference Documentation](docs/api-reference.md)**.

---

## Integration Patterns

Traven supports two primary patterns for managing document metadata and frontmatter: inline freeform editing directly inside the editor, or structured form field integration (Split-Before / Join-After) which is recommended for corporate CMS databases.

Architectural details, examples, and splitting/recombination helper functions are detailed in the **[Integration Patterns Guide](docs/integration-patterns.md)**.

---

## Customization & Styling

Editor themes and toolbar behaviors are fully customizable. Swap stylesheet skins to match your website theme, select from multiple toolbar presets (default, compact, reduced, or expandable), or override button selectors using custom CSS.

To learn more about CSS class listings, custom skin configurations, and toolbar styling options, consult the **[Customization & Styling Guide](docs/customization-styling.md)**.

---

## Custom Shortcodes Architecture

Traven supports extending standard Markdown with custom shortcodes. By default, it comes with rich, interactive WYSIWYM widgets and semantic HTML compilers for `[image]`, `[video]`, `[audio]`, `[figure]`, and `[component]` layouts.

The technical blueprint, widget rendering lifecycles, and syntax extension details are covered in the **[Custom Shortcodes Architecture Guide](docs/shortcodes-architecture.md)**.

---

## Development

If you want to develop on Traven, start with the **[Development Guide](docs/development.md)** which contains instructions for setting up the developer workspace, installing bundler dependencies, building local assets with esbuild, running the unit test suite, and serving the PHP integration demos locally.

---

## Naming & Philosophy

**"B. Traven"** was the self-chosen nym of the privacy-first author behind *The Treasure of the Sierra Madre*, who spent his career proving that the work outlasts its author, communicating with publishers pseudonymously and letting his writing speak for itself. For a framework-agnostic, open-source editor meant to be embedded, customized, and stay quietly out of the limelight, the name fits.

---

## License

Traven is open-source software licensed under the [MIT License](LICENSE).
