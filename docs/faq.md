# Frequently Asked Questions

Common questions about the Traven Editor.

---

## 1. "What is Traven?"

Traven is a WYSIWYM (What You See Is What You Mean) Markdown editor that brings a Typora- or Obsidian-like inline editing experience to any web page or CMS — without requiring a massive NPM build pipeline.

**Traven sits squarely in the Typora/Obsidian lineage** — Markdown as the semantic layer, WYSIWYM as the editing experience, portable files as the output. This makes it "AI-friendly" because this lineage matters now: semantic structure + plain text = LLM-readable, git-diffable, tool-agnostic content.

---

## 2. "Who is Traven for?"

Traven is designed for developers building CMS systems, blog platforms, administrative dashboards, documentation sites, or any content-heavy forms where writers need a seamless, distraction-free editing experience. It's the perfect fit if:

- You want clean Markdown output that remains portable, readable, and perfectly formatted as raw text.
- You prefer an elegant inline editing experience that lets writers focus, rather than a divided split-pane view.
- You need an editor that integrates in minutes, not hours — dropping into PHP, Python, Django, Laravel, Rails, or plain HTML with a single `<script>` tag.
- You value independence: no API keys, no accounts, no required build steps, self-hostable or CDN-delivered.

---

## 3. "What is WYSIWYM and why does my Markdown syntax keep disappearing?"

**WYSIWYM = What You See Is What You Mean.** Also known as: How Typora does it (and Obsidian's Live Preview mode).

Traven hides Markdown syntax (`**bold**`, `# Heading`, `> quote`) when you're not actively editing that line, showing clean styled text instead. Move your cursor into the text, and the syntax reappears so you can edit it.

This is intentional — it gives writers a distraction-free reading experience while keeping the source as pure, portable Markdown.

**Prefer raw Markdown always visible?** Use `toolbar-mode="static"` with a minimal toolbar, or just don't add the `toolbar` attribute at all for a pure writing surface.

---

## 4. "Wait, this works with just a `<script>` tag? No npm, no build step?"

**Yes.** Traven is distributed as a single ES module (`traven.js`) and a stylesheet (`traven.css`). You can drop it into any HTML or PHP page instantly:

```html
<!-- That's it. One line. -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
```

No Node.js, no Webpack/Vite, no `package.json`, no bundler config. It works in plain `.html` files, PHP templates, Django templates, Laravel Blade, Rails ERB — anything that outputs HTML.

If you *are* in a Node/React/Vue/Svelte project, npm packages exist (`@freedomware/traven-react`, etc.), but they're optional conveniences, not requirements.

---

## 5. "How does Traven achieve that Typora-like experience in a browser?"

The short answer: **CodeMirror 6.**

Traven is built on CodeMirror 6, the same engine that powers Obsidian's Live Preview mode. CodeMirror 6 was rewritten from the ground up as a modular extension system, which is exactly what allows Traven to selectively hide Markdown syntax markers (like `**` or `_`) when they're not being edited — achieving that Typora-like behavior natively in the browser, without the fragility of raw `contenteditable` or the heaviness of HTML-first frameworks.

---

## 6. "Can I change the editor's appearance with Themes or Skins?"

**Skins** control appearance (colors, fonts, spacing). Traven comes with **eight ready-made skins** you can use out of the box, customize, or build from scratch:

| Skin | Vibe |
|------|------|
| `skin-starter.css` | Default, system fonts, zero network calls |
| `skin-light.css` | Clean light, Atkinson Hyperlegible |
| `skin-dark.css` | Dark mode companion to light |
| `skin-colorful.css` | Warm rust/indigo accents |
| `skin-editorial.css` | Paper-like, serif, distraction-free |
| `skin-modern.css` | Teal/slate, technical |
| `skin-academic.css` | LaTeX/Computer Modern aesthetic |
| `skin-custom.css` | Runtime font switching via CSS variables |

Skins are pure CSS — hot-swappable at runtime with no re-initialization needed. Just change the `<link>` href.

---

## 7. "Can I customize the toolbars, or choose which kind of toolbars should appear?"

Skins are independent from **Toolbars**, which are fully customizable. Traven includes **three toolbar modes** you can mix and match:

- **Floating** — Bubble appears near cursor (Typora- and Medium-style)
- **Static** — Traditional bar above editor
- **Hybrid** — Both static and floating
- **Gutter** — An insert menu, usually paired as a companion to the Floating bubble-menu.

You can show the default button set, a custom comma-separated list, or build your own toolbar from 30+ available buttons (bold, italic, link, image, headings, tables, video, audio, fullscreen, etc.). Developers can also extend with custom buttons for shortcodes or domain-specific actions.

---

## 8. "Is Traven AI-friendly? Can AI agents work with content created in Traven?"

**Yes — Traven is designed for the AI era.**

Because Traven outputs **pure, portable Markdown stored in flat files** (not opaque database blobs), it works seamlessly with modern AI-assisted workflows:

- **AI coding assistants** (Cursor, Copilot, Claude Code) can read, edit, and write your content files directly
- **RAG pipelines** can ingest your Markdown without custom extractors
- **Static site generators** (Astro, Next.js, Hugo, Eleventy) treat Traven content as first-class citizens
- **Git-based workflows** — every edit is a readable diff, reviewable by humans and AI alike
- **No vendor lock-in** — your content isn't trapped in a proprietary format or SaaS platform

Traven's philosophy: **the file *is* the API.** Whether the editor is a human or an AI agent, the interface is the same — clean, readable Markdown in a file.

---

## 9. "How does the form submission work? Do I need to add an event listener to get the content?"

**No event listeners needed.** `<traven-editor>` is a **form-associated custom element**. It behaves exactly like a straightforward `<textarea>`. On the server, read it like any other form field. The editor synchronizes a hidden `<textarea>` internally, so `FormData` and standard form serialization Just Work™.

---

## 10. "Can I use this with React / Vue / Svelte?"

**Yes.** Official wrappers exist:

```bash
# React
npm install @freedomware/traven-react @freedomware/traven

# Vue
npm install @freedomware/traven-vue @freedomware/traven

# Svelte
npm install @freedomware/traven-svelte @freedomware/traven
```

All wrappers are uncontrolled components — use `defaultValue` (not `value`) to prevent cursor jumping, and a `ref` to call `getValue()` on submit.

---

## 11. "Do I get the full features for free? Is there a Pro version of Traven?"

**Traven is 100% free and open source (MIT licensed).** There is no Pro version, no paid tier, no feature gating, no "phone home" telemetry. You get the full editor — including custom shortcodes, LaTeX math, Mermaid diagrams, optimistic media uploads, Vim mode, bidirectional sync, all toolbar modes, all skins — entirely free, forever. Commercial use is explicitly permitted, that's what the MIT license is for.

The project is for anyone who believes in framework-agnostic, privacy-first tooling as the best kind of infrastructure "plumbing" for a free and open, interconnected net.

---

## 12. "What powers features like math, diagrams, and media uploads?"

Traven includes features that tend to be hard to implement in custom web editors:

- **Optimistic Media Uploads** — Drag-and-drop or paste images/audio/video, instant spinner feedback, auto-replace with final URL
- **Custom Shortcodes** — Extend Markdown with interactive widgets (callouts, figures, video embeds, components)
- **Bidirectional Sync** — Split-screen raw Markdown ↔ WYSIWYM sync without recursive loops
- **LaTeX Math (KaTeX)** — Inline `$...$` and display `$$...$$` math, lazy-loaded, self-hostable
- **Mermaid Diagrams** — Flowcharts, sequence diagrams, Gantt charts rendered in-editor, lazy-loaded
- **Vim Mode** — Full Vim emulation (normal, visual, insert modes) toggleable at runtime

All lazy-loaded, optional, and configured via simple options.

---

## 13. "Why the name 'Traven'?"

**B. Traven** was the nym of a legendary privacy-first author who communicated with publishers exclusively through intermediaries, proving the work outlasts the author. It felt like the right name for a framework-agnostic, open-source editor meant to be embedded and stay out of the limelight, just getting the work done professionally and quietly behind the scenes without any tracking, accounts, or cloud connection (because you can selfhost the single `traven.js` bundle anywhere you want, yourself).

---

## Still have questions?

- **Full attribute reference:** [Cheat Sheet](cheatsheet.md)
- **Common recipes:** [Common Configurations](common-configurations.md)
- **Framework integration:** [Frameworks Guide](frameworks.md)
- **Troubleshooting:** [Troubleshooting Guide](troubleshooting.md)
- **API Reference:** [API Reference](api-reference.md)
- **Live demos:** [traven.dev](https://traven.dev)





