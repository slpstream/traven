# @freedomware/traven-expand-embed

Traven plugin for site-owned post linking and transclusion via **wikilinks**: `[[slug]]`, `[[!slug]]` (embed), and `[[>slug]]` (expand).

Core `traven.js` stays storage-agnostic. This package owns the grammar, WYSIWYM inline chips, reader HTML shells, a tiny public `initExpandEmbed` runtime, in-editor `[[` typeahead, and **optional toolbar tools** (Insert Expand / Insert Embed modals with host typeahead). The **host** implements the resolver (`slug` → content | not-found), `onSuggestLinks` for slug picking, and optionally `onListHeadings` / `onListExpandTargets` for a section dropdown.

## Load contract

```js
import {
  TravenEditor,
  DEFAULT_TOOLBAR,
  registerTools,
} from '@freedomware/traven';
import {
  ExpandEmbedPlugin,
  expandEmbedTools,
  EXPAND_EMBED_TOOLBAR,
  initExpandEmbed,
} from '@freedomware/traven-expand-embed';

registerTools(expandEmbedTools); // or pass extraTools: expandEmbedTools

const editor = new TravenEditor({
  element,
  initialValue,
  onSuggestLinks: async (query) => hostSuggest(query), // Insert Link + Expand/Embed modals + in-editor [[ typeahead
  onListExpandTargets: async (slug) => hostListExpandTargets(slug), // preferred: Whole post | Summary | Deck | sections
  // onListHeadings: async (slug) => hostListHeadings(slug), // fallback: Heading dropdown without Summary/Deck
  toolbar: [...DEFAULT_TOOLBAR, '|', ...EXPAND_EMBED_TOOLBAR],
  // Optional: also list 'expand' (and/or 'embed') in bubbleToolbar / DEFAULT_BUBBLE_TOOLBAR (Traven ≥ 0.2.20)
  plugins: [
    new ExpandEmbedPlugin({
      resolve({ slug, heading, source, mode }) {
        return hostLookup(slug, heading, source);
      },
    }),
  ],
});
```

Hosts that only implement `onListHeadings` keep the section-only dropdown. Prefer `onListExpandTargets` when the host can supply frontmatter `summary` and/or `deck` (modal **Summary** → `^summary`, **Deck** → `^deck`).
`onListHeadings(slug)` should return `Promise<{ title: string, level?: number }[]>`. When provided, the Insert Expand/Embed modal uses a **Heading** `<select>` (first option: Whole post) instead of free-text. Omit it to keep the classic text field.

Also load `expand-embed.css` (or override with host skin tokens).

For **public / preview pages**, load the standalone runtime (no Traven dependency):

```html
<link rel="stylesheet" href="expand-embed.css" />
<script type="module" src="expand-embed-runtime.js"></script>
```

`expand-embed-runtime.js` auto-calls `initExpandEmbed()` on `DOMContentLoaded`. Hosts that already import the full package can call `initExpandEmbed(root)` themselves.

Toolbar buttons are **opt-in**: they never appear in core `DEFAULT_TOOLBAR`. Hosts that omit `expand`/`embed` from `toolbar` get grammar/WYSIWYM only (or nothing if the plugin is not loaded).

## Icons

- **Expand** — acorn (homage to [Nicky Case’s Nutshell](https://github.com/ncase/nutshell))
- **Embed** — arrows-out (always-visible)

## Syntax

```
[[my-post]]
[[my-post|Finland]]
[[>my-post]]
[[>my-post|Click to expand…]]
[[>my-post#Optional Section|Click to expand…]]
[[!my-post|Sanremo]]
[[>finland^deck|Finland]]
[[>finland^summary|Finland]]
```

| Form | Meaning |
| :--- | :--- |
| `[[slug]]` | Internal wikilink |
| `[[slug\|Label]]` | Wikilink with display text. The first `\|` starts the label (no `\|` escape). |
| `[[!slug]]` | Embed — always-visible transclusion |
| `[[>slug]]` | Expand — Nutshell click-to-reveal |
| `#Heading` | Section to slice inside the target |
| `^summary` / `^deck` | Frontmatter nutshell source. When source is set, heading is omitted on serialize. |

Single-bracket `[expand]` / `[embed]` shortcodes are **not** parsed. `[text](url)`, `- [ ]`, and `> [!NOTE]` stay CommonMark.

**Label resolution** (chip + expand trigger): `text` → `heading` → `slug`.

Typing `[[` in the editor opens live typeahead via `onSuggestLinks(query)`. Selecting a row completes `[[post-slug]]` or `[[post-slug|Display Title]]`. If the user already typed `[[!` or `[[>`, that prefix is kept.

## Reader HTML

| Mode | Shell |
| :--- | :--- |
| `link` (`[[slug]]`) | `<a class="traven-wikilink" data-slug="…" href="#">` with the label. Does **not** inline transcluded HTML. |
| `expand` (`[[>slug]]`) | Phrasing-safe `<button class="traven-expand-trigger">` + `<template>` body. Click inserts a bordered `.traven-expand-panel` **immediately after the trigger** (next line under the link, not after the whole paragraph), with a callout arrow centered on the trigger. Trailing `.` / `,` etc. after the inert `<template>` (when followed by whitespace) are peeled into a span beside the trigger so they are not orphaned after the panel. |
| `embed` (`[[!slug]]`) | Always-on `<div class="traven-embed">…</div>`. |

## Editor (WYSIWYM)

When the cursor is outside a complete `[[…]]`, it collapses to an **inline chip** (`text` / `heading` / slug). Expand and embed chips include a pencil that reopens the insert modal. Insert modals pre-fill **Link Text** from the current selection (same as Insert Link). With `onListHeadings` / `onListExpandTargets`, **Heading** / **Target** is a dropdown of sections for the chosen slug (blank = whole post). Incomplete `[[` stays raw text so autocomplete can run.

## Resolver interface

```ts
type ExpandResolveArgs = {
  slug: string;
  heading?: string | null;
  source?: string | null;
  mode: 'expand' | 'embed';
};
type ExpandResolver = (args: ExpandResolveArgs) => string | null;
```

- Called only for expand/embed. Plain `[[slug]]` always renders the `<a class="traven-wikilink">` shell from attributes.
- Return HTML for the transclusion body (already rendered by the host), or `null` to omit (reader-facing silent miss).
- Editor WYSIWYM always shows an inline chip from attributes; it does not require a successful resolve.
