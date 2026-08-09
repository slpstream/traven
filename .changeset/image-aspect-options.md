---
"@freedomware/traven": patch
---

Add optional `imageAspectOptions` / `getImageAspectOptions()` so hosts can declare theme-specific Aspect pills on the Edit/Insert Image modal. When set, advanced mode shows an Aspect row between Layout and CSS Class; selected values are managed as `class` tokens on `[image]` shortcodes. Omit or pass `[]` to leave the modal unchanged for other consumers.
