<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traven Editor — Form-Managed Metadata Demo</title>

  <!-- Google Fonts CDN -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Code:wght@400..700&family=Mozilla+Headline:wght@700;800;900&display=swap" rel="stylesheet">


  <link rel="stylesheet" href="packages/core/assets/toolbars/toolbar-default.css" id="editor-toolbar-link">
  <link rel="stylesheet" href="packages/core/assets/css/demo.css">
</head>

<body class="form-demo">

  <?php
  include "includes/_customization-dropdowns.php";
  $header_nav_html = $customization_dropdowns_html;
  include "includes/_header.php";
  ?>

  <main>
    <!-- Left Area: Sidebar Form & Terminal Console (stacked vertically) -->
    <div class="form-sidebar" style="display: flex; flex-direction: column; gap: 30px;">
      <!-- Form Input Card -->
      <div class="sandbox-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Document Metadata
          </div>
        </div>
        <div class="form-body">
          <div class="form-group">
            <label class="form-label" for="meta-title">Post Title</label>
            <input type="text" id="meta-title" class="form-input" placeholder="e.g. My First Post">
          </div>
          <div class="form-group">
            <label class="form-label" for="meta-author">Author Name</label>
            <input type="text" id="meta-author" class="form-input" placeholder="e.g. Sarah Connor">
          </div>
          <div class="form-group">
            <label class="form-label" for="meta-status">Status</label>
            <select id="meta-status" class="form-input" style="cursor: pointer;">
              <option value="Draft">Draft</option>
              <option value="Review">In Review</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Combined Output Card -->
      <div class="sandbox-card" style="flex: 1; display: flex; flex-direction: column;">
        <div class="card-header">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            Unified Output File
          </div>
        </div>
        <div class="terminal-container">
          <div class="terminal-titlebar">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <textarea id="combined-preview" class="terminal-view" readonly></textarea>
        </div>
      </div>
    </div>

    <!-- Right Area: Traven WYSIWYM Editor -->
    <div class="sandbox-card editor-card">
      <div class="card-header">
        <div class="card-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Body Content Editor
        </div>
        <button type="button" class="copy-btn" id="copy-markdown-btn" title="Copy Markdown to Clipboard">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="168 168 216 168 216 40 88 40 88 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="40" y="88" width="128" height="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
        </button>
      </div>
      <div class="editor-wrapper">
        <div id="editor" class="editor-mount"></div>
      </div>
    </div>
  </main>

  <script type="module">
    import { TravenEditor, DEFAULT_TOOLBAR } from "./packages/core/dist/traven.js";

    // Raw starting document (loaded from database)
    const initialRawFile = `---
title: Traven Structured Demo
author: Sarah Connor
status: Published
---
# Form-Managed Metadata Demo

This demo illustrates **Split-Before / Join-After** which is the recommended pattern for CMS integrations.

Notice that:
1. The editor container **only shows the Markdown body**. The YAML metadata is completely hidden and protected from writing accidents.
2. The metadata (Title, Author, Status) is managed via the **standard HTML form fields** on the left.
3. The terminal view on the bottom-left shows the **unified combined file content** in real-time as you edit!

Try modifying the inputs in the form or editing the body text here to see how they are seamlessly combined!`;

    // 1. Splitting/Joining utilities
    function splitFrontmatter(raw) {
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      if (!match) {
        return { yaml: "", markdown: raw };
      }
      return { yaml: match[1], markdown: match[2] };
    }

    function joinFrontmatter(yaml, markdown) {
      const trimmedYaml = yaml.trim();
      return trimmedYaml ? `---\n${trimmedYaml}\n---\n${markdown}` : markdown;
    }

    // 2. Simple self-contained YAML parser/serializer for the form
    function parseSimpleYaml(yaml) {
      const lines = yaml.split(/\r?\n/);
      const result = { title: "", author: "", status: "Draft" };
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          const key = line.substring(0, colonIdx).trim().toLowerCase();
          const val = line.substring(colonIdx + 1).trim();
          if (key in result) {
            result[key] = val;
          }
        }
      }
      return result;
    }

    // 3. Initialize fields on page load
    const { yaml, markdown } = splitFrontmatter(initialRawFile);
    const initialMetadata = parseSimpleYaml(yaml);

    const titleInput = document.getElementById("meta-title");
    const authorInput = document.getElementById("meta-author");
    const statusSelect = document.getElementById("meta-status");
    const combinedPreview = document.getElementById("combined-preview");

    titleInput.value = initialMetadata.title;
    authorInput.value = initialMetadata.author;
    statusSelect.value = initialMetadata.status;

    // Helper to compile and update combined raw preview
    function updateCombinedPreview() {
      if (!window.editor) return;
      const bodyMarkdown = window.editor.getValue();
      const currentMeta = {
        title: titleInput.value.trim(),
        author: authorInput.value.trim(),
        status: statusSelect.value
      };
      const serializedYaml = `title: ${currentMeta.title}\nauthor: ${currentMeta.author}\nstatus: ${currentMeta.status}`;
      const combined = joinFrontmatter(serializedYaml, bodyMarkdown);
      combinedPreview.value = combined;
    }

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

    // Attach listeners to form inputs
    titleInput.addEventListener("input", updateCombinedPreview);
    authorInput.addEventListener("input", updateCombinedPreview);
    statusSelect.addEventListener("change", updateCombinedPreview);



    // Dynamic toolbar selector handler
    document.getElementById("toolbar-select")?.addEventListener("change", (e) => {
      const toolbarLink = document.getElementById("editor-toolbar-link");
      if (toolbarLink) {
        toolbarLink.href = "packages/core/assets/toolbars/" + e.target.value + ".css";
      }
    });

    // Simulate async image upload
    const mockImageUpload = async (file) => {
      console.log("Mock uploading file:", file.name);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return URL.createObjectURL(file);
    };

    // 4. Initialize Traven with only the Markdown body content
    document.fonts.ready.then(() => {
      // Enable Mermaid rendering support
      TravenEditor.configureMermaid(true);

      window.editor = new TravenEditor({
        element: document.getElementById("editor"),
        initialValue: markdown,
        onChange: () => {
          updateCombinedPreview();
        },
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
      // Initial preview compilation
      updateCombinedPreview();

      // Set up the copy button
      setupCopyButton('copy-markdown-btn', () => window.editor.getValue());
    });
  </script>
</body>

</html>
