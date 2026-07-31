---
"@freedomware/traven": patch
"@freedomware/traven-expand-embed": patch
---

Expand/Embed Target picker supports dedicated frontmatter `summary` alongside `deck`: host `onListExpandTargets` returns `{ summary?, deck?, headings }`; modal offers Whole post | Summary | Deck | sections mapping to `source="summary"` / `source="deck"`.
