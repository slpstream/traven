# Cheat Sheet

ELI5 setup guide plus a full reference list of every option you can put next to `toolbar` and `line-numbers` on the `<traven-editor>` tag.

---

## Easy Setup, the 5-minute version

Imagine `<textarea>` is a plain notepad. **Traven turns that notepad into a full Markdown editor** — with formatting buttons, code blocks, tables, image uploads, and a "pretty" view that hides the asterisks when you're not looking at them.

You don't have to learn a framework or build anything. You just change one tag.

### Step 1 — Find your `<textarea>`

Anywhere in your HTML, PHP, Blade, Django, Jinja, etc. you probably have something like this:

```html
<form action="/save" method="POST">
  <textarea name="body">Initial content...</textarea>
  <button type="submit">Save</button>
</form>
```

### Step 2 — Swap the tag

Change `<textarea>` into `<traven-editor>`. Add `toolbar` if you want the formatting buttons. The text between the tags is the **initial value** (what shows up when the page loads).

```html
<form action="/save" method="POST">
  <traven-editor name="body" toolbar>Initial content...</traven-editor>
  <button type="submit">Save</button>
</form>
```

That's literally it for the markup. Traven secretly keeps a hidden `<textarea>` inside itself, so when the form submits, the server gets the same data it would have gotten from a plain textarea. No JavaScript glue code required on your end.

### Step 3 — Load the script once

Drop this single `<script>` tag anywhere at the **bottom of the page** (before `</body>`). It only needs to be loaded once per page, even if you have multiple editors.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

**That's the whole setup.**  Seriously.  You're done. Core CSS is auto-injected by the script, so you do not need to link a separate stylesheet to get a working editor (unless you want to customize. More on that below).

> **Production tip:** Replace `@latest` with a pinned version like `@0.2.9` so a future update can never silently break your site. The CDN URL stays the same forever. If you prefer, you can of course also load the `traven.js` bundle locally, from your own machine, and everything will work the same even offline.

### Optional Step 4 — Tweak it with attributes

Want line numbers? Just add `line-numbers`. Want a dark theme? Add `theme="dark"`. Every option is just an HTML attribute. You can mix and match, and add as many or as a few (or none) as you want. Just separate each one with a space.

```html
<traven-editor
  name="body"
  toolbar
  line-numbers
  theme="dark"
  toolbar-mode="floating"
  vim-mode
  read-only
>
  # Hello Traven
</traven-editor>
```

### What if my page has a strict Content Security Policy?

Some corporate sites block the script from injecting its own CSS file. Tell Traven to skip the auto-inject and link the stylesheet yourself:

```html
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@0.2.9/dist/traven.css">
</head>
...
<traven-editor name="body" auto-load-styles="false"># Hello</traven-editor>
```

### A complete, copy-pasteable example

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
<body>

  <form action="/save.php" method="POST">
    <label for="title">Title</label>
    <input type="text" id="title" name="title" value="My first post">

    <label>Body (Markdown)</label>
    <traven-editor name="body" toolbar line-numbers>
      # Welcome

      This is **Markdown**. It will be saved exactly as you see it here.
    </traven-editor>

    <button type="submit">Publish</button>
  </form>

  <script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@0.2.9/dist/traven.js"></script>
</body>
</html>
```

And in `save.php`:

```php
$body = $_POST['body'] ?? '';
// Save $body to your database...
```

Done. The editor renders, the user types Markdown, the form submits, the server receives the raw Markdown string. No build step, no bundler, no framework. Traven is built to be easy, but powerful, and to be extremely flexible so it can be made to fit any use case you can imagine.

---

## Full Configuration Options List / Attribute Reference

These are the HTML attributes you can put on `<traven-editor>`. Each one is **optional**. Combine them by separating with spaces.

### Layout & chrome

| Attribute | Values | Default | What it does |
| :--- | :--- | :--- | :--- |
| `name` | any string | *(none)* | The form-field name used when submitting. Mirrors `<textarea name="…">`. |
| `toolbar` | see [Toolbar Mode](#toolbar-mode--the-toolbar-attribute) | `false` (no toolbar) | Enables the formatting toolbar. See below for all valid forms. |
| `line-numbers` | `line-numbers` (on) or omit | *off* | Show line numbers in the gutter on the left. |
| `theme` | `"light"` \| `"dark"` | `"light"` | Light or dark cursor/highlight base. Loads a `cm-wysiwym-dark` class. |
| `toolbar-mode` | `"static"` \| `"floating"` \| `"hybrid"` | `"static"` | How the toolbar is presented. See the [Toolbar Mode](#toolbar-mode--the-toolbar-attribute) section. |
| `read-only` | `read-only` (on) or omit | *off* | Lock the editor so users can read but not type. |
| `vim-mode` | `vim-mode` (on) or omit | *off* | Enable Vim keybindings (normal/visual/insert emulation). |
| `auto-load-styles` | `"true"` \| `"false"` | `"true"` | Whether the script auto-injects `traven.css`. Set to `"false"` for strict CSP sites. |

#### Boolean attributes — quick primer

For on/off attributes, **the presence of the attribute means "on"**, regardless of value. Two ways to write them:

```html
<traven-editor toolbar line-numbers vim-mode>             <!-- all on -->
<traven-editor toolbar="true" line-numbers="true">         <!-- also on -->
<traven-editor toolbar="false" vim-mode="false">           <!-- on, but explicitly false → off -->
```

To explicitly turn an attribute **off** if a parent template puts it on, write `attribute="false"`.

### Initial content

Put raw Markdown between the opening and closing tags:

```html
<traven-editor name="body" toolbar>
  # Welcome

  Edit **this** to see the delimiters appear.
</traven-editor>
```

Or use JavaScript to set it later:

```js
const el = document.querySelector("traven-editor");
el.value = "# New content\n\nSet at runtime.";
```

---

## Part 3 — `toolbar` reference

The `toolbar` attribute is special. It supports **three different forms** depending on what you write between the quotes.

### Form A — Bare attribute (default button set)

```html
<traven-editor toolbar>...</traven-editor>
```

Gives you the full default toolbar with all 30+ buttons. It is static, sits on top. Traditional, like Word or Google Docs. This is what most people are used to, but you can also choose to trim the buttons and show less. A full toolbar with 30 buttons can seem like more than what everyone needs, but Traven has it to show you all the options that are built in from the start. See "Form D", below, for how to trim.

### Form B — Empty or `"true"` or `"default"`

```html
<traven-editor toolbar>...
<traven-editor toolbar="true">...
<traven-editor toolbar="default">...
```

All three are equivalent — same as Form A.

### Form C — `"false"` (no toolbar)

```html
<traven-editor toolbar="false">...
```

Disables the toolbar entirely. You get a clean, distraction-free writing space. You can also just leave out the word `toolbar` and that does the same. No mention of a toolbar = no tollbar shows up.

### Form D — Comma-separated list (custom button set)

```html
<traven-editor toolbar="bold, italic, link, image, |, help">...
```

Pick exactly which buttons you want and in what order. Use the pipe character `|` as a visual separator (a thin vertical divider) between groups.

> **Note for developers:** The `toolbar` attribute is **construction-only**. Changing it after the editor has mounted has no effect. If you need to swap button sets at runtime, destroy the element and re-create it.

### Every available button key

This table is the canonical list of every `toolbar=` value you can plug in. The "Action" column describes what the button does, and the "Shortcut" column shows the default keyboard shortcut (Cmd on Mac, Ctrl elsewhere).

#### History

| Key | Action | Shortcut |
| :--- | :--- | :--- |
| `undo` | Undo the last change | `Ctrl+Z` |
| `redo` | Redo the change you just undid | `Ctrl+Y` |

#### Inline formatting

| Key | Action | Shortcut |
| :--- | :--- | :--- |
| `bold` | Wrap selection in `**bold**` | `Ctrl+B` |
| `italic` | Wrap selection in `*italic*` | `Ctrl+I` |
| `strikethrough` | Wrap selection in `~~strikethrough~~` | `Ctrl+Shift+S` |
| `highlight` | Wrap selection in `==highlight==` | `Ctrl+Shift+H` |
| `code` | Wrap selection in `` `inline code` `` | — |
| `link` | Open the Insert Link modal (URL + text) | `Ctrl+K` |

#### Headings & blocks

| Key | Action | Shortcut |
| :--- | :--- | :--- |
| `heading` | Dropdown that picks Heading 1–6 for the current line | — |
| `blockquote` | Format selection as `> blockquote` | — |
| `bulletlist` | Format selection as unordered list (`- `) | — |
| `numberedlist` | Format selection as ordered list (`1. `) | — |
| `tasklist` | Format selection as checklist (`- [ ] `) | `Ctrl+Shift+C` |
| `hr` | Insert a horizontal rule (`---`) | — |
| `codeblock` | Wrap selection in a fenced code block (`` ``` ``) | — |

#### Tables, dates, and search

| Key | Action | Shortcut |
| :--- | :--- | :--- |
| `table` | Open the interactive 3×3 table editor | — |
| `datetime` | Insert the current date and time at the cursor | — |
| `search` | Open the find / replace panel | `Ctrl+F` |
| `gotoline` | Prompt for a line number and jump to it | `Ctrl+G` |

#### Media insertion (opens a modal)

| Key | Action | Shortcut |
| :--- | :--- | :--- |
| `image` | Open the Insert Image modal (URL or file upload) | — |
| `video` | Open the Insert Video modal (YouTube/Vimeo/direct) | — |
| `audio` | Open the Insert Audio modal | — |
| `figure` | Open the Insert Figure modal (captioned block wrapper) | — |
| `component` | Open the Insert Component modal (info/warning/pullquote cards) | — |

#### Document-wide actions

| Key | Action | Shortcut |
| :--- | :--- | :--- |
| `fullscreen` | Toggle fullscreen mode on the editor wrapper | — |
| `clear` | Wipe the entire document (with a confirmation) | — |
| `help` | Open the keyboard shortcuts & Markdown cheat-sheet modal | `Ctrl+/` |

#### Text case transformations

| Key | Action | Shortcut |
| :--- | :--- | :--- |
| `uppercase` | Convert the current selection to UPPERCASE | — |
| `lowercase` | Convert the current selection to lowercase | — |
| `capitalize` | Capitalize The First Letter Of Every Word | — |
| `removeformatting` | Strip inline and block Markdown styling from the selection | — |

#### Separator

| Key | Action |
| :--- | :--- |
| `\|` | A thin vertical divider between button groups (visual only) |

### Common toolbar configurations

```html
<!-- Full kitchen sink (30+ buttons) -->
<traven-editor toolbar>

<!-- Minimal writing toolbar -->
<traven-editor toolbar="bold, italic, link, |, bulletlist, numberedlist, tasklist, |, help">

<!-- Comment-box style (super compact) -->
<traven-editor toolbar="bold, italic, |, link">

<!-- No toolbar at all -->
<traven-editor toolbar="false">
```

---

## Part 4 — `line-numbers` & other simple toggles

These are pure on/off boolean attributes. Write them with no value to turn them on; omit them entirely to leave them off.

| Attribute | Result |
| :--- | :--- |
| `<traven-editor line-numbers>` | Line numbers and a folding gutter on the left |
| `<traven-editor read-only>` | Editor is locked; users can copy but not type |
| `<traven-editor vim-mode>` | Vim normal/visual/insert keybindings |

You can stack them:

```html
<traven-editor name="body" toolbar line-numbers vim-mode read-only>
  ...
</traven-editor>
```

---

## Part 5 — `toolbar-mode` (how the toolbar is presented)

Traven has **three toolbar layouts** you can pick from with the `toolbar-mode` attribute. They control how/where the buttons appear.

| Mode | Behavior | Best for |
| :--- | :--- | :--- |
| `"static"` *(default)* | A full-width bar of buttons at the top of the editor. Always visible. | Forms, comment boxes, predictable UI. |
| `"floating"` | A slim icon rail pinned to one side. The classic "Medium.com" experience. | Long-form writing, distraction-free work. |
| `"hybrid"` | Combines both: a top bar of the most-used buttons, plus a side rail and a selection bubble that appears when text is highlighted. | Power-user dashboards, full-featured apps. |

```html
<traven-editor name="body" toolbar toolbar-mode="static">  <!-- Always-on top bar -->
<traven-editor name="body" toolbar toolbar-mode="floating"> <!-- Side rail + bubble -->
<traven-editor name="body" toolbar toolbar-mode="hybrid">   <!-- Everything at once -->
```

> NOTE: On phones (touch + small viewport), Traven automatically falls back to `"static"` mode no matter what you set, so the buttons stay reachable with a thumb.

---

## Part 6 — `theme` (light vs dark)

```html
<traven-editor name="body" theme="dark">...
<traven-editor name="body" theme="light">...    <!-- the default -->
```

This toggles the `cm-wysiwym-dark` class on the editor host, which flips cursor color, selection highlight, and a few chrome colors. The actual typography, accent, and overall look come from the **skin** stylesheet (see below), not from `theme`.

You can also flip it at runtime with JavaScript:

```js
const el = document.querySelector("traven-editor");
el.setAttribute("theme", "dark");   // or "light"
```

---

## Part 7 — `vim-mode` (Vim emulation)

Add `vim-mode` to enable Vim keybindings (normal, visual, and insert modes, with the `:` command line):

```html
<traven-editor name="body" toolbar vim-mode>...
```

Or toggle it dynamically:

```js
const el = document.querySelector("traven-editor");
el.setAttribute("vim-mode", "true");   // turn on
el.setAttribute("vim-mode", "false");  // turn off
```

---

## Part 8 — `read-only` (display mode)

Add `read-only` to render the document but block any editing. Useful for preview pages, audit logs, or read-only CMS views.

```html
<traven-editor name="body" read-only>...
```

Toggle at runtime:

```js
const el = document.querySelector("traven-editor");
if (el.readOnly) el.removeAttribute("read-only");
else el.setAttribute("read-only", "");
```

---

## Part 9 — `auto-load-styles` (CSP escape hatch)

By default, Traven's script auto-injects its `traven.css` stylesheet into the page. In environments with a strict Content Security Policy (e.g. `style-src 'self'`), this dynamic `<link>` injection is blocked.

To work around it, set `auto-load-styles="false"` and link the stylesheet yourself in the `<head>`:

```html
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@0.2.9/dist/traven.css">
</head>
...
<traven-editor name="body" toolbar auto-load-styles="false">...</traven-editor>
```

---

## Part 10 — Skins (changing the look)

The `<traven-editor>` tag itself doesn't change visual styling beyond what `theme="dark"` does. To pick a different look, link a **skin** stylesheet. External skins override the built-in defaults via normal CSS cascade.

| Skin | Vibe |
| :--- | :--- |
| `skin-starter.css` *(built-in default)* | Modern neutral baseline, system fonts, no network calls |
| `skin-light.css` | Atkinson Hyperlegible + Fira Code, light mode |
| `skin-colorful.css` | Warm rust + indigo accents, light mode |
| `skin-dark.css` | Premium slate dark mode |
| `skin-editorial.css` | Goudy Bookletter 1911 serif + Macondo display |
| `skin-modern.css` | Epunda Slab + Saira Condensed, modern premium feel |
| `skin-academic.css` | Source Serif 4 + Courier Prime, LaTeX booktabs look |
| `skin-custom.css` | Fully parameterised via CSS custom properties |

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@freedomware/traven@0.2.9/assets/skins/skin-dark.css">
```

For toolbar layouts (compact, expandable, etc.) the same pattern applies — see [Customization & Styling Guide](dev/customization-styling.md) for the full list.

---

## Quick reference — every attribute on one page

```html
<traven-editor
  name="body"                       <!-- form field name -->
  toolbar                           <!-- show the toolbar (or toolbar="bold, italic, |, help") -->
  line-numbers                      <!-- show line numbers in the gutter -->
  theme="light"                     <!-- "light" or "dark" -->
  toolbar-mode="static"             <!-- "static", "floating", or "hybrid" -->
  read-only                         <!-- lock editing -->
  vim-mode                          <!-- enable Vim keybindings -->
  auto-load-styles="true"           <!-- "true" or "false"; set false for strict CSP -->
>
  # Initial Markdown content goes here.
</traven-editor>
```

Just looking for the absolute minimum that'll get you off to a running start? Use the original example at the top of this file: `<traven-editor name="body" toolbar>...</traven-editor>` plus a single `<script>` tag. Everything else in this cheat sheet is **opt-in** and you can safely *ignore it all, if you don't have a specific need to customize.*





