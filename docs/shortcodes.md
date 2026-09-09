# MDX Components

Traven extends Markdown with capitalized MDX tags for media and structured layout. Only tags matching `<[A-Z]\w+>` are components. Lowercase HTML such as `<video>`, `<audio>`, and `<image>` stays native HTML.

Toolbar insert modals emit these tags. Standard Markdown `![alt](src)` remains the non-advanced image path.

---

## Capitalization invariant

Component tag names **must** start with an uppercase letter (React / JSX / Astro convention). This is how Traven's Lezer parser (`src/mdx-parser.js`) distinguishes theme components from browser HTML.

| Authoring form | Meaning |
| :--- | :--- |
| `<Image src="…" />` | MDX component (widget + preview HTML) |
| `<video src="…">` | Native HTML5 video (not a Traven widget) |

---

## `<Image />`

Advanced, optional image component for captions, alignment, size, and CSS classes:

```mdx
<Image src="photo.jpg" alt="Description" caption="Caption text" align="center" size="medium" class="my-custom-class" />
```

* **Fully backwards-compatible**: Optional. Standard Markdown `![alt](src)` continues to render and compile.
* **Toolbar toggle**: The Insert Image modal switches between Advanced mode (emitting `<Image … />` with caption, class, size, and alignment) and Legacy mode (`![alt](src)`).
* **Decoupled styling**: Preview HTML is a semantic `<img>` (or `<figure>` when captioned) with class attributes and no inline `style=""`. Layout uses skin classes such as `.align-[alignment]` and `.size-[size]`.

---

## `<Video />`

Embed YouTube, Vimeo, or native video files:

```mdx
<Video src="https://youtu.be/dQw4w9WgXcQ" align="center" size="medium" caption="My Video" />
```

* **Platforms**: YouTube and Vimeo URLs compile to responsive `<iframe>` embeds. Direct files (`.mp4`, `.webm`, `.ogg`) compile to `<video controls>`.
* **WYSIWYM folding**: With the cursor outside the tag, the source folds into a preview card (platform, URL, caption). The pencil opens the Video modal.
* **Decoupled styling**: Semantic `<figure>` or `<div>` containers; alignment and size come from CSS skins (`.align-right`, `.size-large`, `.traven-video-figure`).

---

## `<Audio />`

Native audio player:

```mdx
<Audio src="track.mp3" align="center" size="medium" caption="My Audio" />
```

* Compiles audio files (`.mp3`, `.wav`, `.ogg`) to `<audio controls>`.
* Folds into a preview card when the cursor is outside the tag.
* Layout classes: `.traven-audio-container`, `.traven-audio-figure`.

---

## `<Figure>`

Block wrapper for nested Markdown (images, tables, code, or mixed content):

```mdx
<Figure align="center" caption="My Figure Caption">
Content
</Figure>
```

* Inner Markdown compiles inside a wrapping `<figure class="traven-figure …">`.
* Opening/closing tags collapse to a preview panel with an edit pencil when the cursor is outside.

---

## Quotes, callouts, and `<Component>`

Structured blocks use dedicated tags. Unknown names fall through to a generic card.

```mdx
<Quote author="James Baldwin" source="The Fire Next Time">
Not everything that is faced can be changed...
</Quote>

<Pullquote>
A highlighted excerpt
</Pullquote>

<Callout type="info" title="Title">
Helpful context
</Callout>

<Callout type="warning" title="Title" collapsible="true">
Collapsible warning
</Callout>

<Component name="newsletter" />
```

* **WYSIWYM folding**: Tag delimiters collapse when the cursor is outside. Block components show a styled preview with an edit pencil.
* **Fallback HTML** (zero inline styles):
  - **Quote**: `<blockquote class="traven-component-blockquote">…<cite>— Author, Source</cite></blockquote>`
  - **Pullquote**: `<blockquote class="traven-component-pullquote">…</blockquote>`
  - **Callout**: `<div class="traven-component traven-component-info">…</div>` / `traven-component-warning`
  - **Generic** (`<Component name="card">`): `<div class="traven-component traven-component-card">…</div>`

Inline highlight stays standard Markdown: `==highlighted text==` (compiles to `<mark>`).

---

## GitHub Alerts (Admonitions)

Traven natively supports GitHub-flavored Markdown alert blocks. These are blockquotes whose first line specifies an alert type using the `[!TYPE]` syntax:

```markdown
> [!NOTE]
> Useful information that users should know.

> [!TIP]
> Helpful advice for doing things more quickly or easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative consequences of an action.
```

### Supported Alert Types & Aliases

Traven supports the 5 standard GitHub alert types, mapping common alternatives as aliases:
*   `[!NOTE]` (and alias `[!INFO]` which maps to `note`)
*   `[!TIP]`
*   `[!IMPORTANT]`
*   `[!WARNING]`
*   `[!CAUTION]` (and alias `[!DANGER]` which maps to `caution`)

### Visual Presentation & Styling

*   **WYSIWYM Editor**: Alert blocks are styled with an alert-colored left border, upright regular text (non-italic), and a distinct background tint corresponding to the alert type. The `[!TYPE]` tag prefix collapses out of view when the cursor is on a different line, keeping the editing canvas clean.
*   **HTML Preview**: Compiles blockquote alerts into a `<div class="traven-alert traven-alert-[type]">...</div>` block. There are no built-in titles or icons, keeping Traven non-opinionated. Host applications can add custom icons, emojis, or titles via their CSS skin themes using pseudo-elements (e.g. `.traven-alert-note::before`).

---

## Custom component extensions

Developers can extend Traven with additional capitalized MDX tags using its decoupled architecture:

1.  **Grammar & Parser (`src/mdx-parser.js`)**: Tokenizes `<[A-Z]\w+>` as `MdxMediaTag` (self-closing) or `MdxContainerOpen` / `MdxContainerClose` (paired).
2.  **Replacement Widget (`src/plugins/component-plugin.js`)**: Mounts a CodeMirror `WidgetType` when the cursor is outside the tag range.
3.  **Themes (`packages/core/assets/skins/*.css`)**: Visual tokens for classes like `.cm-wysiwym-component`.

See [Building Custom MDX Components](dev/building-custom-shortcodes.md) for the extension blueprint.

## Preview HTML classes

Compiled preview markup uses `.traven-image`, `.traven-video`, `.traven-audio`, `.traven-figure`, and `.traven-component-*` (plus alignment/size modifiers). Editor widgets use `.cm-wysiwym-image-container`, `.cm-wysiwym-video-container`, `.cm-wysiwym-audio-container`, `.cm-wysiwym-component`, `.cm-wysiwym-figure`, and `.widget-meta`. These names no longer contain `shortcode`. The full selector list is in [Theme Development](dev/theme-development.md#3-the-selector-reference).
