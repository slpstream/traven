# Key Features

Traven is a modern, high-performance Markdown editor designed for seamless integration and a premium editing experience. By combining a "Native-First" developer integration philosophy with a rich visual WYSIWYM (What You See Is What You Mean) editing canvas, Traven represents a complete solution for embedding Markdown content editing into web applications.

Below are the key features and design decisions that set Traven apart.

---

## 1. Native-First Form Integration

Traven integrates natively with standard web workflows:

*   **Form Association:** Built as a form-associated custom element (`<traven-editor>`), it registers values directly with the browser's form submission API using `ElementInternals`.
*   **No Data Binding Required:** Works inside standard HTML `<form method="POST">` out of the box. The surrounding backend (PHP, Django, Laravel, Rails, or Node) receives raw Markdown via standard form fields without needing JSON parsing.
*   **Direct DOM Access:** Standard JavaScript properties like `document.querySelector('traven-editor').value` work exactly as they would on a native `<textarea>`.
*   **Framework Compatibility:** Integrates cleanly with modern reactive frameworks (React, Vue, Svelte) because the Web Component wrapper provides a standard, framework-agnostic integration boundary.
*   **Dual Integration API:** Developers can choose the integration pattern that best fits their stack. Use the standard `<traven-editor>` Web Component for simple, declarative markup, or instantiate the programmatic `TravenEditor` JavaScript class directly on any arbitrary DOM container for complete lifecycle control.

---

## 2. Performance at Scale (CodeMirror 6 Engine)

Unlike editors built on top of standard textareas or simple contenteditable wrappers that degrade under load, Traven is powered by a customized CodeMirror 6 engine:

*   **Virtual Viewport Rendering:** CodeMirror only mounts the visible portion of the document into the DOM, allowing Traven to handle files with **10,000+ lines of text** with zero input lag, cursor stuttering, or browser freezing.
*   **Smart Rendering Pipeline:** Updates to formatting markers, checklist states, and shortcode widgets are decoupled and run on CodeMirror's fast state transaction pipeline.
*   **Robust Editor State:** Leverages CodeMirror's industrial-grade document representation, guaranteeing flawless native undo/redo history, precise cursor and selection tracking, and robust support for international Input Method Editors (IMEs) for multilingual text input.

---

## 3. Accessible by Default (A11y)

Accessibility is built directly into Traven’s core:

*   **ARIA Landmark Roles:** Toolbars use `role="toolbar"`, menus use `role="menu"` with `aria-haspopup` and `aria-expanded` states, and status footers act as screen-reader accessible landmarks.
*   **Screen Reader Announcements:** Contains an internal `aria-live="polite"` announcer that dynamically reads state changes (e.g., toggled toolbar modes or search matches) to assistive technologies.
*   **Keyboard Focus Restoring:** Modals (such as link, image, or table insertion dialogues) trap focus when open and return it cleanly to the triggering button upon closure.

---

## 4. CSS Framework Isolation (Zero Global Conflicts)

*   **Scoped Styling:** All layout, theme, and widget styling rules are scoped strictly under `.traven-editor-wrapper`, `.cm-editor`, and `.traven-modal` parent classes.
*   **No Global Resets:** Traven does not inject global CSS resets (e.g. Tailwind Preflight elements or Bootstrap Reboot rules) that affect common elements like headers, lists, or buttons. You can safely embed Traven on pages built with Tailwind, Bootstrap, or custom CSS without breaking your layout.

---

## 5. WYSIWYM Formatting & Collapsing Syntax

*   **Distraction-Free Aesthetics:** Formatting characters (like `**` for bold and `_` for italic) collapse out of sight when the cursor moves away, revealing a clean, beautifully styled block. They transition back into plain view immediately when the cursor returns.
*   **Smart Keyboard Controls:** Custom keyboard navigation helpers prevent the cursor from getting trapped inside collapsed delimiters during arrow key navigation.

---

## 6. Custom Shortcode System & Widgets

*   **Semantic Extensions:** Rich media options such as `[image]`, `[video]`, `[audio]`, and `[figure]` are supported. Traven parses these into interactive WYSIWYM block widgets with placeholder previews inside the editing canvas, while compiling them into semantic HTML structures.
*   **Nested Block Components:** Employs a robust `[component]` shortcode structure for injecting callouts, pullquotes, highlights, and custom components with native layouts.

---

## 7. Optimistic Media Uploads

*   **Modern Media Pipeline:** Supports drag-and-drop and clipboard paste events for media files.
*   **Optimistic UI:** When a file is dropped or pasted, Traven instantly embeds a loading spinner widget at the target position, replacing it with the uploaded URL automatically once the host app's upload handler resolves.

---

## 8. Extensible APIs & Developer Tooling

*   **Vim Emulation:** Users can toggle Vim normal, visual, and insert mode bindings dynamically at runtime.
*   **Bi-directional Syncing:** Synchronizes cursor positions and edit history across multi-pane split-screen configurations without infinite recursive event loops.
*   **Custom Renderers:** Allows developers to register custom compilation callbacks for specific tags and shortcodes, making it easy to adapt markdown exports to any CMS database scheme.
*   **LaTeX KaTeX Integration:** Includes native folding and KaTeX rendering for math equations, both in the visual editor and the fallback HTML compile modes.
*   **Zero Peer Dependencies:** Bundled cleanly as a standalone ES module and stylesheet, requiring zero external bundlers or node_modules to run.
