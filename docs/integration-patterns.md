# Integration Patterns

Traven supports two main options for handling YAML Frontmatter metadata (e.g. `title`, `tags`):

## Approach A: Freeform Editing (Inline)

Useful for markdown-first environments (like Obsidian or wikis) where authors prefer typing raw YAML manually.
*   **Usage**: Pass the raw file directly into `TravenEditor`. The editor automatically highlights the frontmatter boundaries `---`, styles the keys, and collapses them when focus is lost.

## Approach B: Structured Forms (Split-Before / Join-After) — *Recommended for CMSs*

Recommended for databases and dashboard layouts. Metadata (Title, Author, Status, Date) is typed into standard, validated HTML form fields, while Traven is initialized **only** with the Markdown body content. This prevents users from breaking frontmatter syntax formatting.

### Split/Join Helper Recipe (JavaScript)

Add these utilities to your integration pipeline to split content before loading, and join it on save:

```javascript
/**
 * Splits a raw Markdown file into its YAML block and body Markdown content.
 * Supports Windows (\r\n) line endings.
 */
export function splitFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { yaml: "", markdown: raw };
  }
  return { yaml: match[1], markdown: match[2] };
}

/**
 * Recombines a YAML metadata block and body Markdown back into a single file string.
 */
export function joinFrontmatter(yaml, markdown) {
  const trimmedYaml = yaml.trim();
  return trimmedYaml ? `---\n${trimmedYaml}\n---\n${markdown}` : markdown;
}
```
