---
"@freedomware/traven-expand-embed": minor
---

Replace `[expand]` / `[embed]` shortcodes with wikilinks: `[[slug]]` / `[[slug|Label]]` (link), `[[!slug]]` (embed), `[[>slug]]` (expand). Headings use `#Section`; Summary/Deck use `^summary` / `^deck`. Typing `[[` opens in-editor typeahead via `onSuggestLinks`. Single brackets stay CommonMark. `[expand]` / `[embed]` are not parsed.
