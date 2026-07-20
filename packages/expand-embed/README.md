# @freedomware/traven-expand-embed

Traven plugin for site-owned post transclusion via `[expand]` and `[embed]` shortcodes.

Core `traven.js` stays storage-agnostic. This package owns the grammar, WYSIWYM folding card, fallback HTML shells, and **optional toolbar tools** (Insert Expand / Insert Embed modals with host typeahead). The **host** implements the resolver (`slug` → content | not-found) and `onSuggestLinks` for slug picking.

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
} from '@freedomware/traven-expand-embed';

registerTools(expandEmbedTools); // or pass extraTools: expandEmbedTools

const editor = new TravenEditor({
  element,
  initialValue,
  onSuggestLinks: async (query) => hostSuggest(query), // powers Link + Expand/Embed typeahead
  toolbar: [...DEFAULT_TOOLBAR, '|', ...EXPAND_EMBED_TOOLBAR],
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

Toolbar buttons are **opt-in**: they never appear in core `DEFAULT_TOOLBAR`. Hosts that omit `expand`/`embed` from `toolbar` get grammar/WYSIWYM only (or nothing if the plugin is not loaded).

## Icons

- **Expand** — acorn (homage to [Nicky Case’s Nutshell](https://github.com/ncase/nutshell))
- **Embed** — arrows-out (always-visible)

## Syntax

```
[expand slug="my-post" heading="Optional Heading"]
[expand="my-post#optional-heading"]
[embed slug="my-post"]
```

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
- Editor WYSIWYM always shows a preview card from attributes; it does not require a successful resolve.
