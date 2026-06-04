# Code Syntax Highlighting

To keep the Traven JS bundle lightweight and fast to load, it does **not** include language-specific syntax parsers (like JavaScript, Python, C++, etc.) in the core distribution. Doing so would more than double the compiled bundle size of the editor.

Instead, Traven provides an extensible, opt-in mechanism to enable syntax highlighting in both the interactive WYSIWYM editor and your compiled HTML output.

---

## 1. Enabling Highlighting in the WYSIWYM Editor

Fenced code blocks inside the editor (e.g. ` ```javascript `) can be highlighted by passing CodeMirror language metadata to the `codeLanguages` configuration option. 

### Step 1: Install `@codemirror/language-data`
If you are using a bundler (npm/yarn/pnpm), install the language registry:

```bash
npm install @codemirror/language-data
```

### Step 2: Initialize Traven with `codeLanguages`
Import the `languages` array and pass it when instantiating the editor. CodeMirror will automatically load and parse syntax highlighting for over 100 languages.

```javascript
import { TravenEditor } from "traven";
import { languages } from "@codemirror/language-data";

const editor = new TravenEditor({
  element: document.getElementById("editor"),
  initialValue: "```javascript\nconst hello = 'world';\n```",
  // Pass the languages array to enable code block syntax highlighting
  codeLanguages: languages
});
```

### Using the Web Component wrapper
If you are using the `<traven-editor>` Web Component, you can set the `codeLanguages` property on the element instance before mounting it or immediately in your script:

```javascript
import { languages } from "@codemirror/language-data";

const el = document.querySelector("traven-editor");
el.codeLanguages = languages;
```

---

## 2. Enabling Highlighting in the Rendered HTML Output

When you compile Markdown using `editor.getContentHtml()`, the default fallback renderer generates semantic HTML with a `class="language-*"` attribute:

```html
<pre><code class="language-javascript">const hello = 'world';</code></pre>
```

Since the compiled HTML is static, you have two options to highlight code blocks on your target rendering pages:

### Option A: Sideloading a client-side library (Prism.js / Highlight.js)
You can include a stylesheet and a script for a library like **Prism.js** or **Highlight.js** on the page that renders the content. 

Here is an example using Prism via CDN:

```html
<head>
  <!-- Load Prism CSS -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" rel="stylesheet" />
</head>
<body>
  <!-- Insert rendered HTML output from editor.getContentHtml() -->
  <div class="content">
    <pre><code class="language-javascript">const hello = 'world';</code></pre>
  </div>

  <!-- Load Prism JS to highlight code elements -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
</body>
```

### Option B: Using a custom server/client Markdown renderer (Shiki / Markdown-it)
If you register a custom Markdown compiler (such as `marked` or `markdown-it`) using `editor.registerRenderer(renderFn)`, you can configure it with pre-built or built-in highlighters:

```javascript
import { TravenEditor } from "traven";
import markdownIt from "markdown-it";
import hljs from "highlight.js";

const md = markdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return ''; // Use default escaping
  }
});

const editor = new TravenEditor({
  element: document.getElementById("editor"),
  initialValue: "```javascript\nconst hello = 'world';\n```"
});

// Register the custom highlighter-enabled markdown-it renderer
editor.registerRenderer((markdown) => md.render(markdown));
```
