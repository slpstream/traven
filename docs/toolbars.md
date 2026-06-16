# Toolbars

Use the ready-made toolbars in any way you can mix and match, or create your own styles and combinations to fit whatever you need. Traven provides a highly configurable and versatile toolbar system featuring three independent formatting layers that can be used in any combination, or disabled entirely for a distraction-free writing environment.

---

## The Three Toolbar Layers

| Layer | Description | Default State |
| :--- | :--- | :--- |
| **Main toolbar** (top rail) | A persistent bar at the top of the editor displaying formatting buttons. | **On** (if the `toolbar` attribute is present) |
| **Selection bubble** | A context-aware formatting bubble that floats above selected text (Medium-style). | **On** (in `hybrid` or `floating` modes) |
| **Gutter insertion menu** | A `+` icon in the left gutter that opens an insert menu for blocks, images, and other media. | **On** (in `hybrid` or `floating` modes) |

---

## Configuration Presets (A–G)

Configure these layouts on your `<traven-editor>` Web Component via the `toolbar` and `toolbar-mode` attributes.

### Configuration A: All three toolbars (Hybrid)
All three toolbars are active. The main toolbar appears at the top, the selection bubble appears on text selection, and the gutter menu appears in the left margin.
```html
<traven-editor name="body" toolbar-mode="hybrid" toolbar>Content here</traven-editor>
```

### Configuration B: Main toolbar only (Default)
By default, omitting `toolbar-mode` defaults the editor to `"static"` mode. Only the top main toolbar is visible. Selection bubble and gutter menus are disabled.
```html
<traven-editor name="body" toolbar>Content here</traven-editor>
```

### Configuration C: Bubble and gutter only (No main toolbar)
Enables the floating selection bubble and gutter insertion menu, while disabling the persistent top toolbar. This provides a clean, distraction-free writing surface with formatting controls available on demand.
```html
<traven-editor name="body" toolbar-mode="hybrid" toolbar="false">Content here</traven-editor>
```

### Configuration D: Slim rail + bubble + gutter (Floating)
Replaces the main top toolbar with a slim control rail pinned to the container, while maintaining active selection bubble and gutter insertion menus.
```html
<traven-editor name="body" toolbar-mode="floating" toolbar>Content here</traven-editor>
```

### Configuration E: Floating toolbar only (No slim rail)
Only the selection bubble and gutter insertion menu are active, with no top rail. Formatting controls only appear when text is selected or a new block is inserted.
```html
<traven-editor name="body" toolbar-mode="floating" toolbar="false">Content here</traven-editor>
```

### Configuration F: Custom button subset
Show only the buttons your users actually need, in any order. The pipe character `|` creates visual dividers between button groups.
```html
<traven-editor name="body" toolbar="bold, italic, link, image, |, heading, |, search">Content here</traven-editor>
```

### Configuration G: Vim mode + line numbers (Power user)
Full Vim keybindings (normal/visual/insert emulation), line numbers, and the complete default toolbar.
```html
<traven-editor name="body" toolbar line-numbers vim-mode>Content here</traven-editor>
```

---

## Toggling Toolbars at Runtime via JavaScript

You can dynamically show or hide individual toolbar layers at runtime by toggling CSS utility classes on the `<traven-editor>` element. This is useful for user preference toggles (such as persisting settings to `localStorage`).

```javascript
const editorEl = document.querySelector("traven-editor");

// Hide the main top toolbar
editorEl.classList.add("hide-main-toolbar");

// Hide the selection bubble
editorEl.classList.add("hide-selection-bubble");

// Hide the gutter insertion menu
editorEl.classList.add("hide-gutter-insertion");

// Restore any toolbar by removing its class
editorEl.classList.remove("hide-main-toolbar");
```

---

## Styling and Layouts

### Available Toolbar Stylesheets
Alternative pre-configured toolbar presentation sheets are available in `packages/core/assets/toolbars/` and can be loaded dynamically or statically to swap editor layouts:
*   `toolbar-default.css`: The default clean toolbar skin containing the full set of buttons.
*   `toolbar-compact.css` / `toolbar-compact-dark.css`: Slim layouts with reduced padding.
*   `toolbar-reduced.css` / `toolbar-reduced-dark.css`: Ultra-minimalist layouts for simplified interfaces.
*   `toolbar-expandable.css` / `toolbar-expandable-dark.css`: A dynamic "2-in-1" toolbar that toggles between core buttons and the full set when expanded.

### Custom Styling via CSS
Each button generated in the toolbar is assigned a generic `.toolbar-btn` class, along with a button-specific class matching its key name (e.g., `.btn-bold`).

To hide specific buttons or override their styles in your own CSS:
```css
/* Hide the Heading and Redo buttons from the toolbar */
.toolbar-btn.btn-heading,
.toolbar-btn.btn-redo {
  display: none;
}
```

For the complete mapping of buttons to their CSS class selectors and keyboard shortcuts, see **[Customization & Styling](dev/customization-styling.md)**.

---

## Going Further

Traven does not currently ship a bottom-rail or side-rail toolbar layout. But the toolbar is rendered with semantic CSS classes (`.toolbar-btn`, `.btn-bold`, `.btn-heading`, etc.) and the MIT license invites experimentation. If you build a creative toolbar layout, the architecture supports it — let a thousand flowers bloom.

**See also:** 
* **[Cheat Sheet](cheatsheet.md)** — For the complete list of toolbar button keys and attribute syntax.
* **[Customization & Styling](dev/customization-styling.md)** — For details on editor skin design and CSS variables.
