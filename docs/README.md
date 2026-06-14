# Traven Editor — Main Documentation

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

> *"A rich-text Markdown editor you can drop into any PHP, Python, or HTML page with one `<script>` tag."*
>
> MIT Licensed · No API key · No account · No npm · No build step · Self-host or CDN

This collection of Traven Editor guides covers everything you need to integrate, configure, and customize the editor in your project. Traven has a low learning curve: You'll know most of what is important about the editor from just the first couple of guides, and the rest are either optional or for specific use-cases.

```html
<!-- Include the editor with just a single line of code: -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

---

## Getting Started

From zero to hero: Get up and running with Traven in a matter of minutes, no coding required.

- **[Quick Start](quickstart.md)** — Add Traven to a PHP form or HTML page in three steps: replace your `<textarea>`, load one script, and read the submission in PHP. The fastest path from zero to a working rich-text editor.
- **[Cheat Sheet](cheatsheet.md)** — A comprehensive quick reference covering the 5-minute setup walkthrough, every configuration attribute, the full toolbar button catalog, skins, and common toolbar presets.
- **[Common Configurations](common-configurations.md)** — Seven ready-made recipes for the most common use cases: minimal comment boxes, blog post editors, CMS admin panels, three-pane WYSIWYM/Raw/Preview editors, code-heavy documentation editors, read-only previews, and split-screen raw sync. Each is a complete, copy-pasteable HTML file.
- **[Toolbars](toolbars.md)** — A comprehensive guide to the editor's three toolbar layers (Main bar, Selection bubble, and Gutter menu), including layout presets, runtime JavaScript class toggling, alternative stylesheets, and CSS customization.

---

## Installation & Setup

- **[Installation & Setup](installation-setup.md)** — How to load Traven via CDN for the quickest setup or by hosting local assets directly. Also covers strict Content Security Policy (CSP) environments and the distinction between toolbars and skins.
- **[Troubleshooting](troubleshooting.md)** — Solutions to the most common integration issues: editor not appearing, empty form submissions, missing toolbar, CSS conflicts, modal positioning, CSP blocks, font-related layout jumps, and skin hot-swapping.

---

## Core Features

Dive deeper into the editor's built-in capabilities.

- **[Key Features](key-features.md)** — An overview of Traven's standout features: WYSIWYM collapsing, optimistic media uploads, decoupled skins, custom shortcodes, bidirectional raw sync, Vim emulation, real-time statistics, and more.
- **[API Reference](api-reference.md)** — A detailed reference of every constructor option, public method, event, and formatting helper available on the `TravenEditor` instance.
- **[Saving & Auto-Save](saving.md)** — How Traven handles manual saves (`Ctrl+S`/`Cmd+S`) and how to implement debounced auto-saving with `onChange` callbacks, including a complete CMS integration recipe.

---

## Rich Content

Rendering math, code, diagrams, and images inside the editor.

- **[LaTeX Math Support](latex-support.md)** — Render inline and display LaTeX equations using KaTeX. Covers three integration strategies: self-hosted (privacy-first), global preloading, and opt-in CDN loading, plus fallback styling.
- **[Code Syntax Highlighting](code-syntax-highlighting.md)** — Enable syntax highlighting for over 100 languages in the WYSIWYM editor and rendered HTML output using CodeMirror language data, Prism.js, Highlight.js, or custom Markdown renderers.
- **[Mermaid Diagram Support](mermaid-support.md)** — Write Mermaid diagrams as fenced code blocks that render as interactive SVGs in the editor. Covers CDN and custom configuration, HTML preview integration, and CSS customization.
- **[Image Handling & Uploads](images.md)** — Insert images via URL, drag-and-drop, clipboard paste, or file picker. Covers the `onUploadImage` callback, optimistic loading feedback, the `[image]` shortcode, backwards compatibility, and UI styling classes.
- **[Custom Shortcodes](shortcodes.md)** — A reference of all built-in shortcodes: `[image]`, `[video]` (with `[youtube]` alias), `[audio]`, `[figure]`, and `[component]` (with `blockquote`, `pullquote`, `info`, `warning`, `highlight` aliases). Covers WYSIWYM widget folding, backwards compatibility, and clean fallback HTML output.

---

## Framework Integration

Wrappers for popular frontend frameworks.

- **[Using Traven with Frontend Frameworks](frameworks.md)** — Official wrappers for React (`@freedomware/traven-react`), Vue (`@freedomware/traven-vue`), and Svelte (`@freedomware/traven-svelte`), with installation and usage examples for each.

---

## Server-Side Integration

Guides and copy-pasteable examples for integrating Traven into server-rendered applications.

- **[Host Integration Guide](integration.md)** — Recommended practices for integrating Traven into CMS systems and admin interfaces. Covers YAML frontmatter management (freeform vs. structured split-before/join-after), and server-side framework forms for PHP, Django, and Laravel.
- **[Integration Patterns](integration-patterns.md)** — A focused look at the two approaches for handling YAML frontmatter: inline freeform editing and the recommended split-before / join-after pattern for CMSs, with JavaScript helper utilities.
- **[Plain PHP Helpers](plain-php-snippet.md)** — Drop-in `traven_editor()` and `traven_scripts()` helper functions for lightweight PHP projects without a framework, including a complete comment-submission example.
- **[Laravel Blade Components (Laravel 9+)](laravel-snippet.md)** — Create a reusable `<x-traven-editor>` anonymous Blade component with `@pushOnce` script loading, session-aware old input, and controller validation.
- **[Django Custom Template Tags](django-snippet.md)** — Create a `{% traven_editor %}` custom template tag that integrates with Django's `ModelForm` workflows and standard form handling.
- **[Laravel Blade Directives (Legacy)](php-blade-snippet.md)** — Register `@travenEditor` and `@travenScripts` custom Blade directives for Laravel 8 and below or specialized rendering pipelines.

---

## Skins & Appearance

- **[Skins](skins.md)** — All eight shipped skins explained with their fonts, network footprint, and best-fit use cases. Covers how to load a skin, hot-swap skins at runtime with a `<link>` tag swap, and self-host fonts for fully offline deployments.

---

## Privacy & Configuration

- **[Privacy & Telemetry Policy](telemetry.md)** — Traven's privacy-first design: no telemetry, no analytics, no cookies. Covers Google Fonts defaults, self-hosting fonts for fully offline deployments, and an overview of available theme skins.

---

## Miscellaneous

- **[Why "Traven"?](name.md)** — The story behind the editor's name, inspired by B. Traven, the anonymous author of *The Treasure of the Sierra Madre*, and what it says about the project's philosophy of privacy, self-hosting, and MIT-licensed freedom.
- **[Why No Alpine.js?](why-no-alpine.md)** — The architectural reasons Traven's core excludes Alpine.js (bundle size, host independence, CSP compliance) and how to easily integrate Traven *with* Alpine.js on the host page.

---

Are you a developer and want to extend Traven Editor? See the [`docs/dev/`](dev/index.md) Developer Documentation area.
