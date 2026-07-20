# @freedomware/traven-expand-embed

Traven plugin for site-owned post transclusion via `[expand]` and `[embed]` shortcodes.

Core `traven.js` stays storage-agnostic. This package owns the grammar, WYSIWYM folding card, and fallback HTML shells. The **host** implements the resolver (`slug` → content | not-found).

## Load contract

```js
import { TravenEditor } from '@freedomware/traven';
import { ExpandEmbedPlugin } from '@freedomware/traven-expand-embed';

const editor = new TravenEditor({
  element,
  initialValue,
  plugins: [
    new ExpandEmbedPlugin({
      resolve({ slug, heading, mode }) {
        // Host-specific: return HTML string, or null if missing.
        // Heading-not-found: fall back to whole post (product default).
        return hostLookup(slug, heading);
      },
    }),
  ],
});
```

Also load `expand-embed.css` (or override with host skin tokens).

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
