# @freedomware/traven

## 0.2.21

### Patch Changes

- Add `onListHeadings` / `getListHeadings()` so hosts can supply section headings for the Expand/Embed insert modal. When set, the expand-embed plugin shows a Heading dropdown (Whole post + sections) instead of free-text.

## 0.2.20

### Patch Changes

- Add optional `bubbleToolbar` / export `DEFAULT_BUBBLE_TOOLBAR` so hosts can customize the selection bubble without changing the default for other consumers. Separators (`"|"`) in the bubble list are skipped. `BUBBLE_ACTIONS` remains an alias of the default list.

## 0.2.18

### Patch Changes

- Add `registerTools()` / `options.extraTools` so hosts and plugins can register toolbar tools without changing `DEFAULT_TOOLBAR`. Export `openModal`, `TOOL_REGISTRY`, `getTool`.

## 0.2.17

### Patch Changes

- Add `onSuggestLinks` / `getSuggestLinks()` for host-provided Insert Link modal autocomplete (opt-in; unchanged without a handler).
- Add `options.plugins` for runtime host plugin registration (grammar via `getMarkdownConfig`, decorations, keymap, extensions, `onRegister`, HTML render). Export `TravenPlugin`. `renderMarkdown(text, extraPlugins)` accepts optional host plugins.

## 0.2.16

### Patch Changes

- d57e2f7: Add Subscript and Superscript buttons to the default editor toolbars and selection bubble menu.

## 0.2.15

### Patch Changes

- 9faa3a9: Implement configurable HTML sanitization option (`sanitizeHtml`) in the editor options and automatic dynamic global `window.DOMPurify` detection in `getContentHtml()` to secure raw HTML previews.

## 0.2.14

### Patch Changes

- d3710c0: Enhance image modal advanced settings layout and defaults, implement native support for GitHub blockquote alerts, refactor custom snippets modal styling, fix fullscreen toggle in typography demo, and update dynamic toolbar configuration.

## 0.2.13

### Patch Changes

- docs: add README files for all monorepo packages to display on the npm registry.

## 0.2.12

### Patch Changes

- Added robust Agent API methods (`replaceSelection`, `insertBlock`, `getMarkdownState`) optimized for LLM host integration.

## 0.2.10

### Patch Changes

- Fixed dynamic resolution of onUploadImage handler for TravenEditorElement.

## 0.2.9

### Patch Changes

- f053fb1: Fix inline math and comparison operators rendering in table, component, and figure widgets in WYSIWYM mode.

## 0.2.8

### Patch Changes

- 2fa6eda: Migrated to an npm workspaces monorepo architecture and introduced official uncontrolled component wrappers for React, Vue, and Svelte.
