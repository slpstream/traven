# @freedomware/traven-expand-embed

Traven plugin for site-owned post transclusion via `[expand]` and `[embed]` shortcodes.

Core `traven.js` stays storage-agnostic. This package owns the grammar, WYSIWYM inline chips, reader HTML shells, a tiny public `initExpandEmbed` runtime, and **optional toolbar tools** (Insert Expand / Insert Embed modals with host typeahead). The **host** implements the resolver (`slug` → content | not-found) and `onSuggestLinks` for slug picking.

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
  onSuggestLinks: async (query) => hostSuggest(query), // powers Link + Expand/Embed typeahead
  toolbar: [...DEFAULT_TOOLBAR, '|', ...EXPAND_EMBED_TOOLBAR],
  // Optional: also list 'expand' (and/or 'embed') in bubbleToolbar / DEFAULT_BUBBLE_TOOLBAR (Traven ≥ 0.2.20)
  plugins: [
    new ExpandEmbedPlugin({
      resolve({ slug, heading, mode }) {
        return hostLookup(slug, heading);
      },
    }),
  ],
});
```

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
[expand slug="my-post" text="Finland"]
[expand slug="my-post" text="Click to expand…" heading="Optional Section"]
[expand="my-post#optional-heading"]
[embed slug="my-post" text="Sanremo"]
```

| Attribute | Meaning |
| :--- | :--- |
| `slug` | Target post id |
| `text` | Visible link / chip label (optional) |
| `heading` | Section to slice inside the target (optional; independent of `text`) |

**Label resolution** (chip + expand trigger): `text` → `heading` → host post title (when provided) → `slug`.

## Reader HTML

| Mode | Shell |
| :--- | :--- |
| `expand` | Phrasing-safe `<button class="traven-expand-trigger">` + `<template>` body. Click inserts a bordered `.traven-expand-panel` **immediately after the trigger** (next line under the link, not after the whole paragraph), with a callout arrow centered on the trigger. Trailing `.` / `,` etc. after the inert `<template>` (when followed by whitespace) are peeled into a span beside the trigger so they are not orphaned after the panel. |
| `embed` | Always-on `<div class="traven-embed">…</div>`. |

## Editor (WYSIWYM)

When the cursor is outside the shortcode, it collapses to an **inline chip** (`text` / `heading` / slug), styled like a normal link. Insert modals pre-fill **Link Text** from the current selection (same as Insert Link).

## Resolver interface

```ts
type ExpandResolveArgs = {
  slug: string;
  heading?: string | null;
  mode: 'expand' | 'embed';
};
type ExpandResolver = (args: ExpandResolveArgs) => string | null;
```

- Return HTML for the body (already rendered by the host), or `null` to omit (reader-facing silent miss).
- Editor WYSIWYM always shows an inline chip from attributes; it does not require a successful resolve.
