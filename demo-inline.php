<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traven Editor — WYSIWYM Markdown Editor</title>

  <!-- Google Fonts CDN -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Code:wght@400..700&family=Mozilla+Headline:wght@700;800;900&display=swap" rel="stylesheet">


  <link rel="stylesheet" href="assets/toolbars/toolbar-default.css" id="editor-toolbar-link">
  <link rel="stylesheet" href="assets/css/demo.css"></head>
</head>

<body class="inline-demo">

  <?php
  include "includes/_customization-dropdowns.php";
  $header_nav_html = $customization_dropdowns_html;
  include "includes/_header.php";
  ?>

  <main>

    <div class="sandbox-grid">
      <!-- Editor Card -->
      <div class="sandbox-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" style="stroke: var(--accent)">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
            </svg>
            Editing View
          </div>
        </div>
        <div id="editor" class="editor-mount"></div>
      </div>

      <!-- Live Sync Output Card -->
      <div class="sandbox-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" style="stroke: #e11d48">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            Markdown Content
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="copy-btn" id="copy-markdown-btn" title="Copy Markdown to Clipboard">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="168 168 216 168 216 40 88 40 88 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="40" y="88" width="128" height="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
            </button>
          </div>
        </div>
        <div id="raw-editor" class="raw-editor-mount"></div>
      </div>
    </div>
  </main>

  <script type="module">
    import { TravenEditor, DEFAULT_TOOLBAR } from "./dist/traven.js";

    // Simulate async image upload
    const mockImageUpload = async (file) => {
      console.log("Mock uploading file:", file.name);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return URL.createObjectURL(file);
    };

    // Helper to setup flat copy button
    function setupCopyButton(buttonId, textSourceFn) {
      const button = document.getElementById(buttonId);
      if (!button) return;

      const copyIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="168 168 216 168 216 40 88 40 88 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="40" y="88" width="128" height="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;
      const checkIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="40 144 96 200 224 72" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;

      let timeoutId = null;

      button.addEventListener('click', () => {
        const textToCopy = textSourceFn();
        navigator.clipboard.writeText(textToCopy).then(() => {
          button.innerHTML = checkIconHtml;
          button.classList.add('copied');

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          timeoutId = setTimeout(() => {
            button.innerHTML = copyIconHtml;
            button.classList.remove('copied');
            timeoutId = null;
          }, 10000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      });
    }



    // Dynamic toolbar selector handler
    document.getElementById("toolbar-select")?.addEventListener("change", (e) => {
      const toolbarLink = document.getElementById("editor-toolbar-link");
      if (toolbarLink) {
        toolbarLink.href = "assets/toolbars/" + e.target.value + ".css";
      }
    });

    // Instantiate editor after fonts are loaded to prevent CodeMirror coordinate measuring cache errors
    document.fonts.ready.then(() => {
      // Enable Mermaid rendering support
      TravenEditor.configureMermaid(true);

      window.editor = new TravenEditor({
        element: document.getElementById("editor"),
        sourceElement: document.getElementById("raw-editor"),
        initialValue: "---\ntitle: Traven Editor\nauthor: John Connor\n---\n\n# Try Traven\n\nThis is a **standalone** WYSIWYM editor. Move your cursor into **this bold text** or *this italic text* to see the delimiters appear. \n\nHere is some `inline code` and a quote:\n\n> Blockquotes look elegant and simple.\n\n---\n\n### Drag & Drop / Paste Images\nTry pasting or dropping an image file below to see the optimistic loading UI spinner in action!",
        toolbarMode: "floating",
        onUploadImage: mockImageUpload,
        toolbar: DEFAULT_TOOLBAR,
        theme: localStorage.getItem("traven-selected-theme") || "light",
        vimMode: localStorage.getItem("traven-selected-vim") === "true",
        katex: true,
        onSave: (content) => {
          if (typeof window.showSaveToast === "function") {
            window.showSaveToast();
          }
        }
      });

      // Set up the copy button to copy only editable content (excluding YAML frontmatter)
      setupCopyButton('copy-markdown-btn', () => {
        const raw = window.editor.getValue();
        return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
      });
    });
  </script>
</body>

</html>
