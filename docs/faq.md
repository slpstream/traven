# Frequently Asked Questions

Common questions about the Traven Editor.

---

## 1. "What is Traven?"

Traven is a WYSIWYM (What You See Is What You Mean) Markdown editor that brings a Typora- or Obsidian-like inline editing experience to any web page or CMS without requiring a massive NPM build pipeline. By storing content as plain Markdown, it produces clean, git-diffable, and AI-readable files. For a deeper look at its design philosophy, see the [Key Features](key-features.md) and [Editor Comparison](comparison.md).

---

## 2. "Who is Traven for?"

Traven is designed for developers building CMSs, blogs, or content-heavy forms who want a seamless, distraction-free Markdown editor. It is a perfect fit if you want clean Markdown output, a distraction-free inline experience, quick integration (via a `<script>` tag), and zero external dependencies (no APIs or build steps). Learn more in the [About Traven](https://traven.dev/site/about.php).

---

## 3. "What is WYSIWYM and why does my Markdown syntax keep disappearing?"

**WYSIWYM = What You See Is What You Mean.** Traven hides Markdown syntax (like `**bold**` or `# Heading`) when you're not actively editing that line, showing clean styled text instead. Move your cursor into the line, and the syntax reappears. This gives writers a distraction-free reading experience while keeping the source as pure, portable Markdown.

---

## 4. "Can I make the raw Markdown syntax always visible?"

Yes. To view raw Markdown, Traven supports **Split-Screen** layouts (editing WYSIWYM and raw Markdown side-by-side) or **Tabbed/Multi-Pane** setups where you can toggle between the WYSIWYM and raw Markdown views. Refer to the [Common Configurations Guide](common-configurations.md) for copy-pasteable split-screen and tabbed editor recipes.

---

## 5. "Wait, this works with just a `<script>` tag? No npm, no build step?"

**Yes.** Traven runs natively in the browser as a standard ES module. You can drop it into any HTML or server-side template (PHP, Django, Laravel, Rails) with a single line:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

 Learn more in the [Quickstart Guide](quickstart.md). For Node-based environments or framework integration (React, Vue, Svelte), see [Installation & Setup](installation-setup.md) and the [Frameworks Guide](frameworks.md).

---

## 6. "How does Traven achieve that Typora-like experience in a browser?"

Traven is built on **CodeMirror 6**, the same extensible editor engine that powers Obsidian. Its modular decoration system allows Traven to selectively hide and show Markdown syntax natively in the browser, avoiding the fragility of raw `contenteditable` or heavy HTML editors. For more on how Traven compares to other editors, see the [Editor Comparison](comparison.md).

---

## 7. "Can I change the editor's appearance with Themes or Skins?"

**Yes.** Traven's appearance is controlled by pure, hot-swappable CSS skins. It comes with eight ready-made skins (including light, dark, editorial, modern, and academic) that can be swapped at runtime by changing the stylesheet `<link>`. See the [Skins Guide](skins.md) for customization details and a list of available skins.

---

## 8. "Can I customize the toolbars, or choose which kind of toolbars should appear?"

**Yes.** Traven supports four toolbar modes: **Floating**, **Static**, **Hybrid**, and **Gutter**. You can configure standard buttons, custom button lists, or extend the editor with custom buttons for custom actions. See the [Toolbars Guide](toolbars.md) for setup and customization instructions.

---

## 9. "Is Traven AI-friendly? Can AI agents work with content created in Traven?"

**Yes.** Because Traven stores content as pure Markdown files rather than proprietary database blobs, it is natively compatible with AI coding assistants (like Claude, Cursor, Copilot), RAG ingestion pipelines, and Git-based version control. For more details on storing and saving Markdown, see the [Saving Guide](saving.md).

---

## 10. "How does the form submission work? Do I need to add an event listener to get the content?"

**No.** `<traven-editor>` is a standard, form-associated custom element. It behaves exactly like a `<textarea>`, automatically syncing its content so `FormData` and standard HTML form submission "Just Work" without event listeners. For server-side integration details, see the [Integration Patterns Guide](integration-patterns.md).

---

## 11. "Can I use this with React / Vue / Svelte?"

**Yes.** Official wrappers are available for React, Vue, and Svelte. Refer to the [Frameworks Guide](frameworks.md) for installation and usage instructions.

---

## 12. "Do I get the full features for free? Is there a Pro version of Traven?"

Traven is 100% free and open source under the MIT license. There is no Pro version, no paid tier, no telemetry, and no feature gating. You get every feature (also LaTeX math, Mermaid diagrams, and media uploads, and everything else) completely free. For Traven's' philosophy regarding data, see [Telemetry](telemetry.md).

---

## 13. "What powers features like math, diagrams, and media uploads?"

Traven includes advanced, optional features that are lazy-loaded on demand:
- **Media Uploads** — Drag-and-drop or paste with optimistic UI (see [Images & Media](images.md))
- **Shortcodes** — Embed custom interactive widgets (see [Shortcodes](shortcodes.md))
- **LaTeX Math** — Render formulas via KaTeX (see [LaTeX Support](latex-support.md))
- **Mermaid Diagrams** — In-editor flowchart rendering (see [Mermaid Support](mermaid-support.md))
- **Vim Mode & Sync** — Standard Vim emulation and side-by-side editing modes (see [Common Configurations](common-configurations.md))

---

## 14. "Why the name 'Traven'?"

It is named after **B. Traven**, a legendary privacy-first author. The name reflects the aim of building a framework-agnostic, self-hostable editor that gets the job done quietly in the background without tracking, accounts, or cloud connections for users who prefer to self-host. Read more about the reasons behind this name and philosophy in [Who was B. Traven?](name.md)

---

## Still have questions?

- **Full attribute reference:** [Cheat Sheet](cheatsheet.md)
- **Common recipes:** [Common Configurations](common-configurations.md)
- **Framework integration:** [Frameworks Guide](frameworks.md)
- **Troubleshooting:** [Troubleshooting Guide](troubleshooting.md)
- **API Reference:** [API Reference](api-reference.md)
- **Live demos:** [traven.dev](https://traven.dev)


