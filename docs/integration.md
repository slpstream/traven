# Traven Editor — Host Integration Guide

This guide details recommended practices for integrating the Traven editor into host applications, CMS systems, and administrative interfaces.

---

## 1. YAML Frontmatter & Metadata Management

Writers often use YAML frontmatter blocks at the beginning of Markdown files to manage structured metadata (e.g. titles, tags, publish dates, authors). 

When integrating Traven, you have two architectural approaches for managing this frontmatter:

### Approach A: Freeform Editing (Inside the Editor)
* **Best for:** Personal wikis, Obsidian-like environments, or power-user developer tools where authors prefer editing raw metadata manually in text format.
* **How it works:** Pass the entire raw Markdown file (including the frontmatter boundaries `---`) directly to Traven. Traven detects the frontmatter block, formats it with a monospace gray left-rail design, and collapses the boundaries when the editor is unfocused.

```javascript
// Approach A: Pass the entire raw file directly
const editor = new TravenEditor({
  element: document.getElementById("editor-mount"),
  initialValue: data.content // Includes raw frontmatter block
});
```

---

### Approach B: Structured Forms (Split-Before / Join-After) — *Recommended for CMSs*
* **Best for:** Corporate CMSs, headless platforms, and databases where metadata must be typed into structured input forms (e.g. date-pickers, tag dropdowns, author select elements) and validated against a schema (like Pydantic, Laravel Request validation, etc.).
* **Why it is recommended:** Letting users edit YAML directly as freeform text inside the editor introduces the risk of schema corruption (e.g. malformed spaces, incorrect keys, syntax errors). By splitting the frontmatter, **the host application manages metadata validation, and the editor focuses entirely on body Markdown**.

#### 1. JavaScript Splitting/Joining Recipe
Add these helper utilities to your host CMS frontend bundle. The regex pattern handles both standard Linux/macOS (`\n`) and Windows (`\r\n`) line endings, and matches even if the closing delimiter lacks a trailing newline:

```javascript
/**
 * Splits a raw Markdown file into its YAML block and body Markdown content.
 * Supports Windows (\r\n) line endings and files without trailing newlines.
 * @param {string} raw - The full markdown file content.
 * @returns {{yaml: string, markdown: string}}
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
 * @param {string} yaml - The YAML string (without the leading/trailing --- bounds).
 * @param {string} markdown - The markdown body content.
 * @returns {string}
 */
export function joinFrontmatter(yaml, markdown) {
  const trimmedYaml = yaml.trim();
  return trimmedYaml ? `---\n${trimmedYaml}\n---\n${markdown}` : markdown;
}
```

#### 2. Usage Flow in your CMS Dashboard

**On Page Load:**
```javascript
import { splitFrontmatter } from "./helpers.js";

// 1. Fetch raw markdown file from backend API
const response = await fetch("/api/posts/42");
const data = await response.json(); // e.g. { content: "---\ntitle: Hello\n---\nBody here" }

// 2. Parse frontmatter
const { yaml, markdown } = splitFrontmatter(data.content);

// 3. Populate your CMS metadata form inputs
// (For YAML parsing, we recommend a lightweight library like 'js-yaml')
const metadata = jsyaml.load(yaml) || {}; 
document.getElementById("post-title-input").value = metadata.title || "";

// 4. Initialize Traven with only the Markdown body content
const editor = new TravenEditor({
  element: document.getElementById("editor-mount"),
  initialValue: markdown
});
```

**On Document Save:**
```javascript
import { joinFrontmatter } from "./helpers.js";

// 1. Pull current body content from Traven
const bodyMarkdown = editor.getValue();

// 2. Serialize host form inputs back to a YAML string
// (Using 'js-yaml' to ensure standard YAML serialization)
const updatedYaml = jsyaml.dump({
  title: document.getElementById("post-title-input").value,
  // ...other metadata fields
});

// 3. Recombine them into the unified document
const finalFileContent = joinFrontmatter(updatedYaml, bodyMarkdown);

// 4. Send the combined file back to your server API
await fetch("/api/posts/42", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content: finalFileContent })
});
```

*Note: For the parsing and serialization steps above, we recommend using the MIT-licensed `js-yaml` library, but you can also delegate the parsing entirely to your backend API (e.g. sending `yaml` and `markdown` as separate fields in the payload).*

By decoupling the structured data from the editor, you maintain clean architectural boundaries and prevent authors from breaking document parsing layouts.

---

## 2. Server-Side Framework Forms (PHP, Django, Laravel)

Traven's `<traven-editor>` Web Component is specifically designed to work natively inside standard HTML forms without requiring any JavaScript glue code. 

**Why this works:** `<traven-editor>` is `formAssociated` (so the form can find it via `ElementInternals`) and synchronizes a hidden `<textarea name="…">` as a child of itself (so `FormData` always serializes it via the normal textarea code path). The hidden textarea is the load-bearing piece for any backend — `ElementInternals.setFormValue` is the modern supplement, but the textarea is what every server-side framework actually reads.

### Plain PHP `$_POST` Example

```html
<form action="/save.php" method="POST">
  <label for="post-title">Title</label>
  <input type="text" id="post-title" name="title" value="Hello World">

  <label for="post-body">Body Content</label>
  <!-- The editor acts exactly like a <textarea> -->
  <traven-editor name="body" theme="light"># Initial markdown content...</traven-editor>

  <button type="submit">Publish</button>
</form>

<!-- Load the module once in the page footer -->
<script type="module" src="/dist/traven.js"></script>
```

When the user submits the form, your backend receives the data precisely as if it were a standard textarea:

```php
<?php
// save.php
$title = $_POST['title'];
$markdownBody = $_POST['body']; // Automatically contains the updated Markdown

// Validate and save to database...
```

### Laravel / Django equivalents

The behavior is identical for modern frameworks. In Laravel, you can retrieve the editor content using `$request->input('body')`. In Django, if you map it to a field in a `ModelForm`, it will be available in `form.cleaned_data['body']`. No special client-side JavaScript handlers (`onSubmit`, `fetch`, etc.) are necessary unless you want to use them.
