# Developer Documentation

These guides are for developers who want to dig deeper and extend, customize, or contribute to the Traven Editor codebase itself. They cover the build system, internal architecture, theming, shortcodes, and rendering internals.

---

## Getting Started

- **[Development](development.md)** — The development workflow for compiling, building, testing, and running Traven locally. Covers `npm run build`, `npm run test`, `npm run watch`, running the PHP demo pages, and the `@latest` CDN development target.
- **[Knowledgebase](knowledgebase.md)** — A deep technical reference of internal findings: CodeMirror 6 pitfalls (block decorations, RangeSetBuilder, character width caching), sandboxed resizing rules, toolbar button customization, all runtime APIs and extension hooks, CSS theming parity tips, security and input sanitization, LaTeX internals, and the floating/hybrid toolbar architecture.

---

## Theming & Styling

- **[Theme Development Guide](theme-development.md)** — The complete guide to building or extending a Traven skin from scratch. Covers the two CSS scopes (editor and preview), the full selector reference, CodeMirror 6 layout-engine rules, WYSIWYM/preview parity, shortcode markup for skins, dark mode strategies, a zero-to-working-skin walkthrough, and a validation checklist.
- **[Custom Typography](custom-typography.md)** — Control heading, body, and code fonts through CSS custom properties (`--traven-font-display`, `--traven-font-body`, `--traven-font-mono`). Covers runtime font switching, Google Fonts integration, local `@font-face`, static overrides, and using the parameterized `skin-custom.css`.

---

## Shortcodes

- **[Building Custom Shortcodes](building-custom-shortcodes.md)** — The technical blueprint for extending Traven's shortcode system: architectural roles (parser, widget, skin), a step-by-step implementation strategy for adding new shortcodes, the CSS styling token roadmap, and details on the built-in `[image]` shortcode's Lezer parser integration.
- **[Custom Markdown Rendering](custom-markdown-rendering.md)** — How to replace Traven's built-in fallback renderer with a custom Markdown-to-HTML engine (Marked, markdown-it, etc.) using `registerRenderer()`. Covers the renderer pipeline, preview styling via `.traven-preview`, and handling custom shortcodes with regex pre-processors or parser plugins.


