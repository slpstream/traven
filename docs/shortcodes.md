# Traven Editor — Custom Shortcodes Architecture & Blueprint

This document outlines the technical blueprint and integration roadmap for adding custom shortcode support (e.g., `[gallery ids="1,2,3"]` or `{{ youtube id="ABC" }}`) to the Traven WYSIWYM Markdown Editor.

---

## 1. Architectural Roles & Separation of Concerns

Integrating custom shortcodes follows the established decoupling between editor logic (parsing) and theme aesthetics (styling).

```mermaid
graph TD
    Source[Raw Markdown Text] -->|1. Parse| RegExp[wysiwym.js Regex Engine]
    RegExp -->|2. Detect Bounds| StateField[CodeMirror StateField]
    StateField -->|3. Cursor Check| Decorator[Interactive Decorator]
    Decorator -->|Active Cursor: Show Code| Text[Raw Text Rendering]
    Decorator -->|Inactive Cursor: Hide Code| Widget[Replace Widget Injection]
    Widget -->|4. Render DOM| DOM[Shortcode Preview DOM]
    DOM -->|5. Apply Skin| CSS[assets/skins/*.css]
```

### A. Parser Logic (`src/wysiwym.js`)
* **Detection & AST Mapping**: Standard Markdown syntax trees (via `@lezer/markdown`) do not recognize custom shortcodes, parsing them as normal paragraphs. `wysiwym.js` will scan the document using structured regular expressions to identify shortcode blocks.
* **State Management**: It will track if the cursor is currently inside a shortcode's range.
* **Interactive Hiding**: When the cursor is outside, it collapses the shortcode syntax markers using `Decoration.replace({})` and mounts a CodeMirror replacement `WidgetType`. When the cursor enters the shortcode, the raw source string is instantly revealed for editing.

### B. Rich Previews (`src/widgets/*.js`)
* **Replace Widgets**: CodeMirror `WidgetType` classes will represent the shortcodes visually (e.g., `GalleryShortcodeWidget`, `YoutubeShortcodeWidget`).
* **Interactive DOM**: These widgets return DOM nodes representing the shortcode's output. They can fetch media previews asynchronously or display interactive UI elements (like placeholder cards).

### C. Skins & Themes (`assets/skins/*.css`)
The DOM elements rendered by the widgets are assigned semantic classes (e.g., `.cm-wysiwym-shortcode-widget`, `.cm-wysiwym-gallery-preview`).
* **Skin Decoupling**: The CSS skins handle color palettes, border styling, transition animations, and shadow treatments:
  - **Neutral Skin**: Renders the shortcode preview as a flat, distraction-free container with gray slate borders (`#cbd5e1`) and a clean background (`#f8fafc`).
  - **Colorful Skin**: Renders the shortcode preview with custom brand borders, colorful icon highlights, and transition effects.

---

## 2. Step-by-Step Implementation Strategy

### Step 1: Scanner in `wysiwym.js`
Create a helper function to find shortcodes in the document state:
```javascript
function findShortcodes(state) {
  const shortcodes = [];
  const text = state.doc.toString();
  // Regex matches bracketed shortcodes: [name key="val"]
  const regex = /\[([a-z_-]+)\s+([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    shortcodes.push({
      name: match[1],
      rawAttrs: match[2],
      from: match.index,
      to: match.index + match[0].length
    });
  }
  return shortcodes;
}
```

### Step 2: Decorating Shortcode Elements
During decoration generation inside `wysiwym.js`:
```javascript
const shortcodes = findShortcodes(state);
for (const sc of shortcodes) {
  const isCursorInside = cursorHead >= sc.from && cursorHead <= sc.to;
  if (!isCursorInside) {
    // Inject the custom visual preview widget
    collected.push({
      from: sc.from,
      to: sc.to,
      deco: Decoration.replace({
        widget: new ShortcodeWidget(sc.name, sc.rawAttrs),
        block: true
      })
    });
  }
}
```

### Step 3: Creating the Interactive Widget
Implement the widget subclass:
```javascript
class ShortcodeWidget extends WidgetType {
  constructor(name, attrs) {
    super();
    this.name = name;
    this.attrs = attrs;
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = `cm-wysiwym-shortcode-widget cm-wysiwym-shortcode-${this.name}`;
    
    // Add visual details (like an icon and properties tag)
    container.innerHTML = `
      <div class="shortcode-header">
        <span class="shortcode-icon">⚡</span>
        <span class="shortcode-title">${this.name.toUpperCase()} SHORTCODE</span>
      </div>
      <div class="shortcode-body">
        <code>${this.attrs}</code>
      </div>
    `;
    return container;
  }
}
```

---

## 3. Styling Token Roadmap

To support skinning, skins should declare definitions for the following selectors:

```css
/* Base Container for all shortcodes */
.cm-wysiwym-shortcode-widget {
  border-radius: 8px;
  padding: 12px 16px;
  font-family: inherit;
  margin: 8px 0;
}

/* Neutral Skin Definitions */
.neutral-theme-scope .cm-wysiwym-shortcode-widget {
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #475569;
}

/* Colorful Skin Definitions */
.colorful-theme-scope .cm-wysiwym-shortcode-widget {
  background-color: #fff0e8; /* Rust wash tint */
  border: 1px dashed #cc4a0a; /* Rust accent dashed border */
  color: #a83808;
}
```
