# Developer Overview

What Traven is, how it's built, and what it offers a developer building on top of it. This page is a standalone reference for someone who considers using and building on Traven and wants the full picture in one place.

---

## What Traven is

Traven is an embeddable, WYSIWYM (What You See Is What You Mean) Markdown editor for the browser. The document is always a flat Markdown string — Markdown in, Markdown out, no intermediate HTML or JSON tree. Markdown syntax (e.g. `**bold**`, `# Heading`) is decorated out of sight when the cursor is elsewhere and reappears when the cursor enters the token, giving a Typora- or Obsidian-style inline editing experience without `contenteditable` fragility.

It ships as a single bundled ES module + stylesheet, with zero peer dependencies and zero build step required from the consumer. MIT licensed, no API key, no account, no telemetry.

Two integration models are first-class and equally supported:

1. **Declarative** — a form-associated custom element (`<traven-editor>`) that behaves like a `<textarea>` for form submission.
2. **Programmatic** — a `new TravenEditor(options)` class API mounted on any container element, with full lifecycle control.

A developer building on Traven will almost always end up using the programmatic API, even if they start with the declarative element. 

---

## Architecture

### Engine: CodeMirror 6 + Lezer

Traven is built directly on **CodeMirror 6** (`@codemirror/state`, `@codemirror/view`, `@codemirror/language`, `@codemirror/lang-markdown`, `@codemirror/lang-yaml`, `@codemirror/language-data`, `@codemirror/commands`, `codemirror`, `@lezer/markdown`). CM6 is the same engine Obsidian is built on.

Key architectural consequences:

- **Flat-string document model.** The document is a single string in CM6's `EditorState`. There is no parse-to-AST-then-serialize-back cycle. Traven decorates tokens in place to hide/show Markdown syntax; it never roundtrips through an intermediate representation.
- **Virtual viewport rendering.** Only the visible portion of the document is mounted to the DOM. This is what lets Traven handle 10,000+ line files without cursor stutter or input lag.
- **Industrial-grade editor state.** Native undo/redo history, precise cursor and selection tracking, and robust IME support for multilingual input come from CM6 for free.
- **Decoupled update pipeline.** Formatting markers, checklist states, and shortcode widgets run on CM6's transaction pipeline, so decorative updates don't fight document edits.

### Build & packaging

- Bundled with **esbuild** into `dist/traven.js` (ESM) and a stylesheet. Type declarations (`dist/traven.d.ts`) generated via `tsc`.
- The consumer never needs `node_modules` — the published bundle includes everything it needs.
- Source is JavaScript. Vite is used in the dev/build toolchain. These are build-time dependencies; they are not imposed on the consumer.
- Tests run on **Vitest** with jsdom.

### Source layout (`packages/core/src/`)

| File | Role |
| --- | --- |
| `TravenEditor.js` | Programmatic class — the `new TravenEditor(options)` API surface. |
| `TravenEditorElement.js` | Custom element wrapper — `<traven-editor>` and form association via `ElementInternals`. |
| `wysiwym.js` | The decoration pipeline that hides/shows Markdown syntax based on cursor position. The core of the WYSIWYM experience. |
| `delimiter-skip.js` | Keyboard navigation helpers that prevent the cursor from getting trapped inside collapsed syntax delimiters. |
| `bridge.js` | Wires the custom element to the programmatic class. |
| `security.js` | Sanitization / safe rendering. |
| `images.js` | Optimistic media upload pipeline (drag-drop, paste, file picker). |
| `math-parser.js` | KaTeX folding and rendering for LaTeX. |
| `mermaid-parser.js` | Mermaid diagram rendering in-editor. |
| `code-highlighting` (`highlight-parser.js`) | Fenced code block syntax highlighting. |
| `audio-parser.js`, `video-parser.js`, `figure-parser.js` | Media shortcodes parsed into WYSIWYM widgets. |
| `component-parser.js`, `shortcode-parser.js` | Custom `[component]` and built-in shortcode system. |
| `components-default.json` | Default custom-component schema presets. |
| `style.css` | Core scoped stylesheet. |
| `toolbar/` | Toolbar UI. |

---

## Two integration models

### Declarative: `<traven-editor>`

A form-associated custom element. It registers with the browser's form submission API via `ElementInternals`, so `FormData` and standard `<form method="POST">` "just work" — the editor's content is submitted like a `<textarea>`, with no hidden textarea shim and no event listener plumbing.

```html
<form action="/save" method="POST">
  <traven-editor name="content" toolbar># Hello</traven-editor>
  <button type="submit">Save</button>
</form>

<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

Server-side, you read it like any other field: `$content = $_POST['content']` in PHP, `request.POST['content']` in Django, `params[:content]` in Rails, `req.body.content` in Express. Standard attributes (e.g. `toolbar`, `line-numbers`, `theme`, `toolbar-mode`, `vim-mode`, `read-only`, `auto-load-styles`) configure it declaratively; the full attribute reference lives in `docs/cheatsheet.md`.

`document.querySelector('traven-editor').value` works exactly as it would on a native `<textarea>`.

### Programmatic: `new TravenEditor(options)`

The class API mounts on any container element and gives full lifecycle control. This is the integration path you'll use for anything beyond a static form — reactive frameworks, custom save flows, autosave, custom toolbars, split-pane sync, AI integrations, etc.

```javascript
const editor = new TravenEditor({
  element: document.getElementById('editor'),
  initialValue: '# Hello',
  toolbar: ['bold', 'italic', 'link', 'image'],
  onChange: (value) => console.log('changed:', value),
  onSave: async (value) => { await fetch('/save', { method: 'POST', body: value }); },
  onUploadImage: async (file) => { /* …return URL… */ },
});
```

It integrates cleanly with reactive frameworks (React, Vue, Svelte wrappers ship in `packages/react`, `packages/vue`, `packages/svelte`) because the class API is framework-agnostic — the Web Component boundary is the integration layer.

---

## Programmatic API reference

### Construction

```javascript
const editor = new TravenEditor(options);
```

### Options

| Option | Type | Default | Notes |
| :--- | :--- | :--- | :--- |
| `element` | `HTMLElement` | *(required)* | Mount container for the primary WYSIWYM editor. |
| `sourceElement` | `HTMLElement` | `null` | Optional secondary mount for the raw-editor split-pane. Enables bidirectional sync. |
| `initialValue` | `string` | `""` | Starting Markdown. |
| `lineNumbers` | `boolean` | `false` | Line numbers + folding gutters in the primary editor. |
| `sourceLineNumbers` | `boolean` | `false` | Same, for the raw sync editor. |
| `lineWrapping` | `boolean` | `true` | Soft-wrap in the primary editor. |
| `sourceLineWrapping` | `boolean` | `true` | Soft-wrap in the raw sync editor. |
| `theme` | `"light" \| "dark"` | `"light"` | Baseline cursor theme + dark-mode class trigger. |
| `caretColor` | `string` | `""` | Custom hex caret color override. |
| `toolbar` | `Array<string> \| boolean` | `false` | Tool key list, or `false` to disable. |
| `bubbleToolbar` | `Array<string>` | *(DEFAULT_BUBBLE_TOOLBAR)* | Optional selection-bubble tool keys. Omit for the default bubble. Host tools must be registered and listed here. |
| `toolbarMode` | `"static" \| "floating" \| "hybrid"` | `"static"` | Toolbar presentation layout. |
| `bubbleHotkey` | `string` | `"Mod-."` | Selection bubble open hotkey. |
| `gutterHotkey` | `string` | `"Mod-Shift-Enter"` | Gutter insert-menu hotkey. |
| `bubbleAppearDelay` | `number` | `200` | ms delay before the selection bubble appears. |
| `vimMode` | `boolean` | `false` | Vim normal/visual/insert emulation (both panes). |
| `readOnly` | `boolean` | `false` | Read-only for both panes. |
| `keybindings` | `object` | `{}` | Override default tool keybindings (e.g. `{ bold: "Ctrl-Shift-b" }`). |
| `katex` | `boolean \| string \| object` | `false` | `false` = use preloaded `window.katex`; `true` = load from jsDelivr; `string`/`object` = custom self-hosted paths. |
| `components` | `Array<string \| object>` | *(presets)* | Custom component schemas for the shortcode system. |
| `componentsUrl` | `string \| boolean` | `"assets/components.json"` | URL to load component schemas from, or `false` to disable. |
| `codeLanguages` | `Array` | `null` | CM6 `LanguageDescription[]` for fenced-block syntax highlighting. |
| `autoLoadStyles` | `boolean` | `true` | Auto-inject core CSS. Set `false` for strict CSP; you ship the stylesheet yourself. |
| `onChange` | `function` | `null` | `(value: string) => void`. |
| `onSave` | `function` | `null` | `(value: string) => void` — fires on `Cmd+S` / `Ctrl+S`. |
| `onUploadImage` | `function` | `null` | `(file: File) => Promise<string>` — resolve to the final URL. |
| `onStatsUpdate` | `function` | `null` | `(stats: { words, characters, readTime }) => void`. |

### Public methods

**Content access**

- `getValue()` → `string` — full document as Markdown.
- `setValue(value)` — replace the entire document.
- `getSelection()` → `string` — currently selected text.
- `setSelection(anchor, head?)` — set the selection range and focus.
- `replaceSelection(text)` — replace selection, or insert at cursor if nothing selected.
- `insertSnippet(before, after, placeholder)` — wrap selection with prefix/suffix tags, or insert a placeholder.

**State & lifecycle**

- `focus()` — focus the primary view.
- `setReadOnly(bool)` / `isReadOnly()` → toggle and query read-only mode at runtime.
- `undo()` / `redo()` — history on the focused editor (WYSIWYM or raw).
- `destroy()` — clean up listeners and CM6 instances. Call this on unmount.
- `triggerSave()` — programmatically invoke the registered save callback.

**Theme & modes**

- `setTheme("light" | "dark")` — dynamic theme toggle.
- `setVimMode(bool)` — toggle Vim emulation at runtime.

**Stats**

- `getCharacterCount()` → `number`
- `getWordCount()` → `number`
- `getReadTime()` → `number` (minutes)
- `getMarkdownState()` → `object` — **the AI-friendly snapshot**, see below.

**Rendering & escape hatches**

- `registerRenderer(renderFn)` — register a custom `(markdown: string) => string` compilation function for HTML preview/export.
- `getContentHtml()` → `string` — compiled HTML via the registered renderer or built-in fallback.
- `getView()` → `EditorView` — **the raw CM6 view**, see below.
- `getUploadHandler()` → the configured upload handler or `null`.
- `getComponents()` → `Array<string | object>` — registered component schemas.

**Events**

- `on(event, callback)` — register listeners. Events: `"change"`, `"save"`, `"statsUpdate"`.

### Editing & formatting helpers

Built-in commands for programmatic text manipulation:

- `clear()` — wipe the document and focus.
- `toUpperCase()` / `toLowerCase()` / `capitalizeWords()` — case transforms on the selection.
- `removeFormatting()` — strip inline + block formatting from the selection.
- `toggleFullscreen()` — toggle `.is-fullscreen` and recalculate layout.
- `openSearch()` — open CM6's find-and-replace panel.
- `goToLine(n)` — jump to a 1-indexed line.
- `insertCodeBlock()` — wrap selection in a fenced block.
- `insertBlock(text, position?)` — insert a markdown block at a semantic position (`"before" | "after" | "start" | "end"`), handling blank-line spacing automatically.
- `insertHR()` — insert a horizontal rule.
- `insertTable()` — insert a 3×3 template, selecting the first header cell.
- `setHeading(level)` — apply heading level `1`–`6`; pass `0` to strip.
- `insertBlockquote()` — convert selection/line to a blockquote.
- `insertDateTime()` — insert current date/time.
- `insertList(type)` — convert selection/line to `"ul" | "ol" | "task"`.

### Static methods

- `TravenEditor.configureMermaid(options)` — global Mermaid config: `true` (CDN, v11.4.0), `string` (custom CDN URL), `object` (`{ js }`), or `false` to disable.
- `TravenEditor.initMermaid(container)` → `Promise<void>` — scan a container and render uninitialized Mermaid diagrams.

---

## Power features / Differentiators

### WYSIWYM collapsing-syntax pipeline

The core of the experience. `wysiwym.js` decorates Markdown syntax tokens (emphasis, headings, code, links, etc.) to hide them when the cursor isn't inside the token, and undecorates them when the cursor enters. The document model never changes — it's still the flat string — so there's no parse/edit/serialize cycle and no opportunity for roundtrip artifacts.

`delimiter-skip.js` provides the keyboard navigation helpers that keep the cursor from getting stuck inside collapsed delimiters during arrow-key navigation. This is the kind of detail that separates a usable WYSIWYM editor from a frustrating one. Traven got this from Typora, so expect a similarly polished user-experience.

### Native form association

`<traven-editor>` uses `ElementInternals` to register as a form-associated custom element. The practical payoff: `FormData`, `<form method="POST">`, and standard form submission all work with no JavaScript on the host page. The server receives Markdown via a normal form field.

This is rare. Most Markdown editors require you to instantiate, attach an `onChange` callback, write to a hidden field, or post via fetch. Traven's declarative path skips all of that.

### `getMarkdownState()` — the AI-agent hook

```javascript
const state = editor.getMarkdownState();
// {
//   markdown:    string — full raw document
//   frontmatter: string — YAML, stripped of --- delimiters
//   body:        string — markdown excluding the frontmatter block
//   selection:   string — currently selected text
//   cursor:      { line, column }  (1-indexed line)
//   lineCount:   number
//   stats:       { words, characters, readTime }
// }
```

This is explicitly designed for external AI agents and RAG pipelines — frontmatter is pre-parsed, the body is split out, cursor and stats are included. If you're building an AI-assisted editor (autocomplete, inline edits, summarize, etc.), this is the one call you want.

### `getView()` (CM6 escape hatch)

`getView()` returns the raw CodeMirror 6 `EditorView`. This means any CM6 extension — `@codemirror/autocomplete`, `@codemirror/search`, custom language support, linters, custom decorations — can be composed onto the editor. Traven isn't a sealed box; if you outgrow the built-in API, you have the full CM6 ecosystem underneath.

### Bidirectional split sync (`sourceElement`)

Pass a `sourceElement` option and Traven mounts a second, raw-editor pane that stays in sync with the WYSIWYM pane — cursor positions and edit history included, without infinite recursive event loops. This is how you build split-screen WYSIWYM/Raw layouts.

### Optimistic media uploads

Drag-and-drop, clipboard paste, and file picker all flow through `onUploadImage`. When a file is dropped, Traven immediately inserts a loading spinner widget at the target position; when your handler resolves to a URL, the spinner is replaced with the rendered media. Audio and video are supported alongside images via the `[audio]`, `[video]`, and `[figure]` shortcodes.

```javascript
new TravenEditor({
  element, 
  onUploadImage: async (file) => {
    const fd = new FormData(); fd.append('image', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    return (await r.json()).url;
  }
});
```

### Custom shortcodes & components

Traven extends Markdown with semantic shortcodes (`[image]`, `[video]`, `[audio]`, `[figure]`, and the general `[component]` with aliases like `blockquote`, `pullquote`, `info`, `warning`, `highlight`). These parse into interactive WYSIWYM widgets inside the editing canvas and compile into clean semantic HTML on output.

Custom components are defined by passing a schema:

```javascript
new TravenEditor({
  element,
  components: [
    { name: 'callout', attributes: [{ name: 'type', label: 'Type', type: 'text', placeholder: 'info / warning / danger' }] }
  ]
});
```

…which produces parseable shortcodes like `[component name="callout" type="warning"]…[/component]` that your backend can render safely.

### `registerRenderer()` — custom HTML output

```javascript
editor.registerRenderer((markdown) => myCustomHtmlConverter(markdown));
const html = editor.getContentHtml();
```

Register your own compilation function and `getContentHtml()` will use it. This is how you adapt Markdown export to any CMS database scheme or run your own sanitizer/renderer.

### Lazy-loaded extras

- **LaTeX (KaTeX)** — configurable via the `katex` option (preloaded, CDN, or self-hosted paths).
- **Mermaid diagrams** — write as fenced code blocks, rendered as interactive SVGs in the editor. Configurable globally via `TravenEditor.configureMermaid()`.
- **Code syntax highlighting** — via `codeLanguages` (CM6 `LanguageDescription[]`), with Prism.js / Highlight.js / custom renderer fallbacks for HTML output. See `docs/code-syntax-highlighting.md`.

These load on demand, not up front — keeps the initial bundle lean.

### Vim mode

Built-in via `@replit/codemirror-vim`. Toggle at runtime with `setVimMode(true)` or the `vimMode` option. Normal, visual, and insert modes are emulated in both the WYSIWYM and raw panes.

### CSS framework isolation

All styling is scoped under `.traven-editor-wrapper`, `.cm-editor`, and `.traven-modal`. No global CSS resets are injected — safe to embed on Tailwind, Bootstrap, or custom-CSS pages without breaking the host layout. For strict CSP environments, set `autoLoadStyles: false` and ship the stylesheet yourself.

### Accessibility (A11y)

- Toolbars use `role="toolbar"`; menus use `role="menu"` with `aria-haspopup` / `aria-expanded`.
- An internal `aria-live="polite"` announcer reads state changes (toolbar toggles, search matches) to assistive tech.
- Modals (link, image, table insertion) trap focus while open and return it to the triggering button on close.

### Skins & toolbar modes

- **8 ready-made skins** (light, dark, editorial, modern, academic, …) — hot-swappable at runtime by changing the stylesheet `<link>`. You can also build your own. See `docs/skins.md`.
- **3 toolbar presentation modes** (`static`, `floating`, `hybrid`) via the `toolbarMode` option, plus a **gutter insert menu** opened with `Mod-Shift-Enter`. Again, you can fully build your own toolbars, too.
- **Selection bubble** opened with `Mod-.` for inline formatting on selected text. Part of the toolbar options.

---

## What it's optimized for

Use Traven when:

- Your backend expects **pure Markdown** (portable, git-diffable, AI-readable).
- You want a **seamless inline editing experience** without split panes or discrete blocks.
- You want **drop-in integration** — either a single `<script>` tag for static forms, or a clean class API for reactive apps.
- You want to **own your infrastructure** (no API keys, no telemetry, self-host or CDN).
- You're building a **CMS, blog platform, admin dashboard, documentation editor, or content form**.
- You want an **AI-friendly content surface** (`getMarkdownState()` makes RAG ingestion and AI-assisted editing straightforward).

---

## Constraints

What Traven is *not*, so you can scope correctly:

- **Not a Microsoft Word clone.** No track changes, no native `.docx` import, no 15-year enterprise plugin marketplace.
- **Not a block editor.** Traven outputs a single continuous Markdown string, not an array of discrete JSON block objects. If your DB schema needs blocks in separate rows, use a block editor.
- **Not a collaborative editor.** No CRDT-based real-time multi-user editing. That's a different category of software.
- **Not a framework.** It's a drop-in web component + class API. If you're building a bespoke editor from primitives, reach for ProseMirror or Lexical instead.
- **Maturity.** Newer than many of the editors you compare against. The architecture is sound and the API is well-considered, but production adoption should account for the relative youth of the project versus incumbents with multi-year track records. 

---

## Where to look next

- `docs/cheatsheet.md` — full `<traven-editor>` attribute reference and toolbar button catalog.
- `docs/common-configurations.md` — seven copy-pasteable recipes (minimal comment box, blog editor, CMS admin panel, three-pane WYSIWYM/Raw/Preview, code-heavy docs editor, read-only preview, split-screen raw sync).
- `docs/toolbars.md` — the three toolbar layers in depth.
- `docs/images.md`, `docs/shortcodes.md`, `docs/latex-support.md`, `docs/mermaid-support.md`, `docs/code-syntax-highlighting.md` — rich-content guides.
- `docs/skins.md` — skin catalog and hot-swapping.
- `docs/customization-styling.md` — instructions for swapping pre-built skins, loading skins via CDN, utilizing custom CSS selectors, and hiding or re-styling specific toolbar buttons.
- `docs/api-reference.md` — the canonical API reference this synopsis summarizes.
- `docs/troubleshooting.md` — common integration issues and fixes.
- `docs/installation-setup.md` — CDN vs. local hosting, strict CSP, toolbars vs. skins distinction.

**Specifically for developers:**

- `docs/dev/development.md` — the development workflow for compiling, building, testing, and running Traven locally, covering npm build scripts, testing, and demo page configurations.
- `docs/dev/knowledgebase.md` — a deep technical reference of internal findings, covering CodeMirror 6 pitfalls, resizing logic, toolbar customization hooks, input sanitization, and LaTeX/toolbar architectures.
- `docs/dev/theme-development.md` — the comprehensive guide to building custom Traven skins, detailing editor vs. preview CSS scopes, selector references, WYSIWYM/preview styling parity, and theme design strategies.
- `docs/dev/custom-typography.md` — configuring editor fonts (display, body, and monospace) using CSS custom properties, custom font-face setups, and Google Fonts integration.
- `docs/dev/building-custom-shortcodes.md` — the architectural blueprint for extending the shortcode parser and widgets, detailing custom parser plugins and CSS styling tokens.
- `docs/dev/custom-markdown-rendering.md` — how to replace Traven's built-in markdown engine with a custom third-party renderer (e.g., Marked or markdown-it) using the `registerRenderer` API.

The packages `packages/react`, `packages/vue`, `packages/svelte` provide framework wrappers if you want a thinner integration layer than mounting the class API yourself.


