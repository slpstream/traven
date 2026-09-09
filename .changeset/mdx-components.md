---
"@freedomware/traven": minor
---

Replace bracket `[image]` / `[quote]` / `[component]` authoring with capitalized MDX tags (`<Image />`, `<Quote>`, `<Callout>`, `<Figure>`, `<Component>`). Only `<[A-Z]\w+>` is a component; lowercase `<video>` / `<audio>` stay HTML. `![alt](src)` remains the non-advanced image path. Help modal tab is now `data-tab="components"` / `#help-tab-components`.
