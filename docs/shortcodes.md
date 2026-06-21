# Custom Shortcodes Architecture

Traven supports custom shortcodes to extend the standard Markdown syntax. By default, it features native support for custom `[image]`, `[video]`, `[audio]`, and `[figure]` shortcodes, as well as a block-level `[component]` shortcode with blockquote/pullquote aliases:

---

## Custom `[image]` Shortcode

Traven includes an advanced, optional `[image]` shortcode (e.g. `[image src="..." alt="..." align="center" size="medium" class="my-custom-class"]`) designed for modular, responsive layouts:
* **Fully Backwards-Compatible**: The custom shortcode is completely optional. Traven remains fully backwards-compatible and non-breaking for standard legacy Markdown syntax (`![alt](src)`). Existing standard images continue to render and compile flawlessly.
* **Toolbar Toggle**: The "Insert Image" toolbar modal contains a sliders-icon toggle to switch between Advanced mode (generating the custom `[image]` shortcode with support for captions, custom CSS classes, sizing, and alignment settings) and Legacy mode (producing standard `![alt](src)` Markdown).
* **Decoupled Presentation Styling**: The fallback renderer compiles the shortcode to clean semantic HTML (an `<img>` tag with class attributes and no inline `style=""` declarations). Layout formatting (width, display, float, margin) is delegated entirely to the skin stylesheets (e.g. `packages/core/assets/skins/skin-light.css`) via `.align-[alignment]` and `.size-[size]` selector classes.

---

## Custom `[video]` Shortcode

Traven includes native, optional support for a custom `[video src="..." align="center" size="medium" caption="My Video" class="custom-video"]` shortcode for embedding video media:
* **Multiple Platforms Supported**: Detects and compiles YouTube and Vimeo URLs into responsive embedded `<iframe>` elements. Direct links to video files (e.g. `.mp4`, `.webm`, `.ogg`) are compiled into native `<video controls>` HTML tags.
* **YouTube Shorthand Alias**: For authoring ease, `[youtube src="..."]` can be used as a shorthand alias for the video shortcode, automatically defaulting to YouTube embedding (supporting both full YouTube URLs and raw YouTube IDs directly).
* **WYSIWYM Widget folding**: When the cursor is outside the shortcode, the text folds into an interactive preview card displaying the detected platform logo/name, source URL, and caption. Clicking the edit icon on the card opens the Video Modal.
* **Decoupled Styling**: Compiles into semantic HTML containers (`<figure>` or `<div>`) and tags with no inline styles. Alignment and sizing layouts (e.g. `.align-right`, `.size-large`, `.traven-video-figure`) are controlled entirely via CSS skins.

---

## Custom `[audio]` Shortcode

Traven includes native, optional support for a custom `[audio src="..." align="center" size="medium" caption="My Audio" class="custom-audio"]` shortcode for embedding audio media:
* **Native Audio Elements**: Compiles audio files (e.g. `.mp3`, `.wav`, `.ogg`) into standard `<audio controls>` HTML tags.
* **WYSIWYM Widget folding**: When the cursor is outside, folds into an interactive preview card displaying the audio icon, source URL, and caption.
* **Decoupled Styling**: Renders inside layout-safe container classes (`.traven-audio-container`, `.traven-audio-figure`) with zero inline styles.

---

## Custom `[figure]` Shortcode

Traven includes native support for an optional block-level `[figure align="center" size="medium" caption="My Figure Caption" class="custom-figure"]...[/figure]` shortcode system:
* **Nested Block-Level Content**: Designed as a pair-tag shortcode that can wrap any block elements (such as images, tables, code blocks, or custom markdown content) inside a captioned block.
* **WYSIWYM Widget Folding**: When the cursor is outside, the opening/closing shortcode tags collapse, displaying a styled preview panel with the caption at the bottom and an edit/modal trigger icon.
* **Decoupled Styling**: Compiles into standard semantic HTML `<figure>` containers (with classes like `.traven-figure`, `.align-[alignment]`, and `.size-[size]`) and `<figcaption class="traven-figure-caption">` with zero inline styles.

---

## Custom `[component]` & Blockquote/Notice/Highlight Aliases

Traven includes native support for a pair-tag `[component]...[/component]` shortcode system, designed to handle structural block-level content:
* **Flexible Syntax**: Supported formats:
  - Canonical: `[component name="blockquote" author="James Baldwin" source="The Fire Next Time"]Not everything that is faced can be changed...[/component]`
  - Short Attribute Fallback: `[component="blockquote" author="..." source="..."]...[/component]`
* **Shorthand Aliases**: For writing convenience, Traven translates shorthand tags under the hood:
  - Blockquote Alias: `[quote author="..." source="..."]...[/quote]` or `[blockquote author="..." source="..."]...[/blockquote]`
  - Pullquote Alias: `[pullquote]...[/pullquote]`
  - Notice Block Aliases: `[info]...[/info]` and `[warning]...[/warning]`
  - Inline Highlight Alias: `[highlight]...[/highlight]` (an alias for `==highlight==` that compiles to `<mark>...</mark>`)
* **WYSIWYM Widget Folding**: In the editor, when the cursor is outside the tag range, the tag delimiters collapse. For block components, it renders a styled preview block with an edit/modal trigger. For the inline `[highlight]` tag, it applies smooth inline background color markers.
* **Clean Fallback HTML Output**: The fallback compiler renders these shortcodes into standard HTML structure with **zero inline styles**:
  - **Blockquotes**: `<blockquote class="traven-component-blockquote">...<footer><cite>— Author, Source</cite></footer></blockquote>`
  - **Pullquotes**: `<blockquote class="traven-component-pullquote">...</blockquote>`
  - **Notice Blocks**: `<div class="traven-component traven-component-info">...</div>` / `<div class="traven-component traven-component-warning">...</div>`
  - **Highlights**: `<mark>...</mark>`
  - **Generic/Unknown Blocks (e.g. `[component="card"]`)**: Compiles to a standard wrapper `<div class="traven-component traven-component-[name]">...</div>`, allowing theme authors to style them independently.

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

## Custom Shortcode Extensions

Developers can also extend Traven to support other custom shortcodes using its decoupled architecture:

1.  **Grammar & Parser (`src/component-parser.js`)**: Extends the Lezer Markdown parser to detect tag pairs, attributes, and values.
2.  **Replacement Widget (`src/wysiwym.js`)**: Injets a custom CodeMirror `WidgetType` returning custom interactive preview elements when the cursor is outside the shortcode range.
3.  **Themes (`packages/core/assets/skins/*.css`)**: Defines visual tokens (e.g. background colors, border styles, hand-drawn styles) for classes like `.cm-wysiwym-component-shortcode`.
