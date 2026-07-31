# @freedomware/traven-expand-embed

## 0.1.11

### Patch Changes

- 1c9e5ff: Fix ReDoS vulnerability (CodeQL Alert #64) in shortcode attribute parsing by replacing polynomial regular expressions with a linear O(N) state machine parser.
- Updated dependencies [1c9e5ff]
  - @freedomware/traven@0.2.23

## 0.1.10

### Patch Changes

- Add `onListExpandTargets` / `getListExpandTargets()` so hosts can supply frontmatter deck plus section headings for the Expand/Embed insert modal. expand-embed gains `source="deck"` shortcode support, Summary modal target, and Read more link styles.
- Updated dependencies
  - @freedomware/traven@0.2.22

## 0.1.9

### Patch Changes

- Add `onListHeadings` / `getListHeadings()` so hosts can supply section headings for the Expand/Embed insert modal. When set, the expand-embed plugin shows a Heading dropdown (Whole post + sections) instead of free-text.
- Updated dependencies
  - @freedomware/traven@0.2.21
