# Traven — MDX components, wikilinks, and CSS class rename

Paste into the GitHub Release for the next `@freedomware/traven` **minor** and `@freedomware/traven-expand-embed` **minor** (after `changeset version` / publish). Breaking for authors and skin authors; JS widget class names are unchanged.

## Summary

Traven no longer uses custom `[shortcode]` syntax.

1. **MDX tags** (`<Image />`, `<Quote>`, `<Callout>`, …) for components, media, and layout.
2. **Wikilinks** (`[[slug]]`, `[[!slug]]`, `[[>slug]]`) for internal links and transclusion (`@freedomware/traven-expand-embed`).
3. **Single brackets** are 100% CommonMark again (`[text](url)`, `- [ ]`, `> [!NOTE]`).

`![alt](src)` is still the non-advanced image path.

## `@freedomware/traven`

### Authoring (breaking)

| Was | Now |
| :--- | :--- |
| `[image src="…" …]` | `<Image src="…" … />` |
| `[video]` / `[audio]` | `<Video />` / `<Audio />` |
| `[quote]` / `[info]` / `[component]` | `<Quote>`, `<Callout>`, `<Component>` |
| `[figure]…[/figure]` | `<Figure>…</Figure>` |

Only capitalized tags (`<[A-Z]\w+>`) are MDX components. Lowercase `<video>` / `<audio>` / `<image>` stay HTML.

### Preview / theme CSS (breaking for skins)

| Role | Old class | New class |
| :--- | :--- | :--- |
| MDX Image widget | `.cm-wysiwym-image-shortcode-container` | `.cm-wysiwym-image-container` |
| MDX Video / Audio widgets | `.cm-wysiwym-*-shortcode-container` | `.cm-wysiwym-*-container` |
| Quote / Callout / Component | `.cm-wysiwym-component-shortcode` | `.cm-wysiwym-component` |
| Figure widget | `.cm-wysiwym-figure-shortcode` | `.cm-wysiwym-figure` |
| Media meta row | `.shortcode-meta` | `.widget-meta` |
| Preview `<img>` | `.traven-image-shortcode` | `.traven-image` |
| Preview native video / audio | `.traven-video-shortcode` / `.traven-audio-shortcode` | `.traven-video` / `.traven-audio` |
| Preview `<Figure>` | `.traven-figure-shortcode` | `.traven-figure` |

Markdown `![alt](src)` still uses `.cm-wysiwym-image-widget-container` in the editor. Do not reuse that name for `<Image />`.

Unchanged: `ImageShortcodeWidget` (and siblings), `ShortcodePlugin` export alias, `ComponentPlugin.name === "component"`.

Help modal: the Components tab is `data-tab="components"` / `#help-tab-components` (was `shortcodes`).

### Host APIs

- `onPickImage` / `openImageModal(attrs)` (0.2.28) unchanged.
- `imageAspectOptions` writes class tokens on `<Image class="…" />`.
- `onSuggestLinks` also drives in-editor `[[` completion when expand-embed is loaded.

## `@freedomware/traven-expand-embed`

| Was | Now |
| :--- | :--- |
| `[expand slug="x"]` | `[[>x]]` |
| `[embed slug="x"]` | `[[!x]]` |
| (new) internal link | `[[x]]` / `[[x\|Label]]` |

Extras after the slug: `#Heading`, `^summary` / `^deck`. First `|` starts the label. If heading and source are both present, **source wins** on serialize.

Reader HTML is unchanged in spirit: expand → `.traven-expand-trigger` + `<template>`; embed → `.traven-embed`; link → `a.traven-wikilink`.

`[expand]` / `[embed]` are **not** parsed.

## Upgrade

1. Convert saved documents from `[image]` / `[expand]` to MDX / wikilinks (host CMS job).
2. Update skins to the new CSS class names.
3. Rebuild host bundles that vendor `dist/traven.js` / `dist/traven.css`.
