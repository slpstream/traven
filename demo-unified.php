<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traven Editor — Unified Editing Demo</title>

  <!-- Google Fonts CDN -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Code:wght@400..700&family=Mozilla+Headline:wght@700;800;900&display=swap" rel="stylesheet">


  <link rel="stylesheet" href="packages/core/assets/toolbars/toolbar-default.css" id="editor-toolbar-link">
  <link rel="stylesheet" href="packages/core/assets/css/demo.css">
</head>

<body class="unified-demo">

  <?php
  include "includes/_customization-dropdowns.php";
  $header_nav_html = $customization_dropdowns_html;
  include "includes/_header.php";
  ?>

  <main>
    <!-- Top Row: Metadata Form (Horizontal Layout) -->
    <div class="top-row">
      <!-- Form Input Card -->
      <div class="sandbox-card form-card is-collapsed">
        <div class="card-header" id="metadata-accordion-trigger">
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
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
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
    </div>

    <!-- Bottom Row: Unified Editor Card with Tabs -->
    <div class="bottom-row">
      <div class="sandbox-card editor-card">
        <div class="card-header">
          <div class="unified-tab-bar">
            <button type="button" id="tab-wysiwym" class="unified-tab is-active">WYSIWYM</button>
            <button type="button" id="tab-markdown" class="unified-tab">Markdown</button>
            <button type="button" id="tab-preview" class="unified-tab">Preview</button>
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <div id="preview-actions" style="display: none; gap: 12px; align-items: center;">
              <button type="button" id="toggle-raw-html-btn" class="nav-btn" style="padding: 4px 10px; font-size: 0.8em; font-weight: 600; cursor: pointer; border: 1px solid var(--border-color); background-color: #ffffff; border-radius: 6px; user-select: none;">View Raw HTML</button>
              <button type="button" class="copy-btn" id="copy-html-btn" title="Copy HTML to Clipboard">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="168 168 216 168 216 40 88 40 88 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="40" y="88" width="128" height="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
              </button>
            </div>
            <button type="button" class="copy-btn" id="copy-markdown-btn" title="Copy Markdown to Clipboard">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="168 168 216 168 216 40 88 40 88 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="40" y="88" width="128" height="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
            </button>
          </div>
        </div>
        <div class="editor-wrapper mode-wysiwym">
          <div id="editor" class="editor-mount"></div>
          <div id="raw-editor" class="raw-editor-mount"></div>
          <div id="html-preview" class="html-preview-mount traven-preview" style="display: none; padding: 24px 32px; overflow-y: auto; height: 100%; box-sizing: border-box;"></div>
          <div id="html-raw-preview" style="display: none; padding: 24px 32px; overflow-y: auto; height: 100%; box-sizing: border-box; font-family: 'Fira Code', monospace; font-size: 0.9em; white-space: pre-wrap; word-break: break-all;"></div>
        </div>
        <div class="card-footer" style="padding: 12px 20px; border-top: 1px solid var(--border-color); font-size: 0.85em; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between; background-color: #fafafa; font-weight: 500; font-family: inherit;">
          <!-- Vim Mode Status Indicator -->
          <div id="vim-status-container" style="display: none; align-items: center; gap: 8px;">
            <span id="vim-mode-badge" style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; font-size: 0.8em; letter-spacing: 0.05em; background-color: #64748b; color: #ffffff; transition: background-color 0.2s ease, color 0.2s ease;">NORMAL</span>
          </div>
          <!-- Right Stats -->
          <div style="display: flex; gap: 20px; margin-left: auto;">
            <span id="stats-words">Words: 0</span>
            <span id="stats-chars">Characters: 0</span>
            <span id="stats-readtime">Read Time: 0 min</span>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script type="module">
    import { TravenEditor, DEFAULT_TOOLBAR, getCM } from "./packages/core/dist/traven.js";

    // Raw starting document (loaded from database)
    const initialRawFile = `---
title: Traven Unified
author: Miles Dyson
status: Published
---
# Unified Editing Demo

This demo illustrates a unified layout where:
1. The document metadata (Title, Author, Status) is managed via form fields and synced to the YAML frontmatter on the top.
2. The Markdown body is edited in a single workspace. Switch between WYSIWYM mode and Markdown mode using the tabs above.
3. Editing is limited strictly to the actual Markdown content. The frontmatter is kept clean and safe from editing accidents.`;

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

    titleInput.value = initialMetadata.title;
    authorInput.value = initialMetadata.author;
    statusSelect.value = initialMetadata.status;



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

    // 4. Initialize Traven Editor with tabbed layout
    document.fonts.ready.then(() => {
      // Enable Mermaid rendering support
      TravenEditor.configureMermaid(true);

      window.editor = new TravenEditor({
        element: document.getElementById("editor"),
        sourceElement: document.getElementById("raw-editor"),
        initialValue: markdown,
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

      // Vim mode listener helper
      function updateVimStatusUI(mode) {
        const container = document.getElementById("vim-status-container");
        const badge = document.getElementById("vim-mode-badge");
        const vimEnabled = localStorage.getItem("traven-selected-vim") === "true";

        if (!vimEnabled) {
          container.style.display = "none";
          return;
        }

        container.style.display = "flex";
        badge.textContent = mode;

        if (mode === "insert") {
          badge.style.backgroundColor = "#8fcc00";
          badge.style.color = "#000000";
        } else if (mode === "visual") {
          badge.style.backgroundColor = "#f59e0b";
          badge.style.color = "#000000";
        } else if (mode === "replace") {
          badge.style.backgroundColor = "#ef4444";
          badge.style.color = "#ffffff";
        } else {
          badge.style.backgroundColor = "#64748b";
          badge.style.color = "#ffffff";
        }
      }

      function attachVimModeListener() {
        const view = window.editor.getView();
        if (!view) return;
        const cm = getCM(view);
        if (cm) {
          cm.on("vim-mode-change", (modeObj) => {
            updateVimStatusUI(modeObj.mode);
          });
          updateVimStatusUI("normal");
        }
      }

      // Initialize Vim Mode Status UI on load
      const vimEnabledOnLoad = localStorage.getItem("traven-selected-vim") === "true";
      if (vimEnabledOnLoad) {
        attachVimModeListener();
      }

      // Listen for Vim mode settings checkbox changes
      const vimCheckbox = document.getElementById("vim-checkbox");
      if (vimCheckbox) {
        vimCheckbox.addEventListener("change", (e) => {
          setTimeout(() => {
            if (e.target.checked) {
              attachVimModeListener();
            } else {
              document.getElementById("vim-status-container").style.display = "none";
            }
          }, 100);
        });
      }

      // Update statistics
      window.editor.on("statsUpdate", (stats) => {
        document.getElementById("stats-words").textContent = `Words: ${stats.words}`;
        document.getElementById("stats-chars").textContent = `Characters: ${stats.characters}`;
        document.getElementById("stats-readtime").textContent = `Read Time: ${stats.readTime} min`;
      });

      // Set up the copy button (only copy editable content, excluding metadata)
      setupCopyButton('copy-markdown-btn', () => window.editor.getValue());

      // Set up the copy HTML button
      setupCopyButton('copy-html-btn', () => window.editor.getContentHtml());

      // Toggle raw HTML state
      let showRawHtml = false;
      const toggleRawHtmlBtn = document.getElementById('toggle-raw-html-btn');
      if (toggleRawHtmlBtn) {
        toggleRawHtmlBtn.addEventListener('click', () => {
          showRawHtml = !showRawHtml;
          toggleRawHtmlBtn.textContent = showRawHtml ? "View Rendered HTML" : "View Raw HTML";
          activateTab('preview');
        });
      }

      // Tab switching logic
      const wysiwymTab = document.getElementById('tab-wysiwym');
      const markdownTab = document.getElementById('tab-markdown');
      const previewTab = document.getElementById('tab-preview');
      const editorWrapper = document.querySelector('.editor-wrapper');

      function activateTab(mode) {
        const isWysiwym = mode === 'wysiwym';
        const isMarkdown = mode === 'markdown';
        const isPreview = mode === 'preview';

        wysiwymTab.classList.toggle('is-active', isWysiwym);
        markdownTab.classList.toggle('is-active', isMarkdown);
        previewTab.classList.toggle('is-active', isPreview);

        editorWrapper.classList.toggle('mode-wysiwym', isWysiwym);
        editorWrapper.classList.toggle('mode-markdown', isMarkdown);
        editorWrapper.classList.toggle('mode-preview', isPreview);

        const editorEl = document.getElementById("editor");
        const rawEditorEl = document.getElementById("raw-editor");
        const previewEl = document.getElementById("html-preview");
        const rawPreviewEl = document.getElementById("html-raw-preview");
        const previewActions = document.getElementById("preview-actions");
        const copyMarkdownBtn = document.getElementById("copy-markdown-btn");

        if (isWysiwym) {
          editorEl.style.display = "flex";
          rawEditorEl.style.display = "none";
          previewEl.style.display = "none";
          rawPreviewEl.style.display = "none";
          previewActions.style.display = "none";
          copyMarkdownBtn.style.display = "inline-flex";
        } else if (isMarkdown) {
          editorEl.style.display = "flex";
          rawEditorEl.style.display = "flex";
          previewEl.style.display = "none";
          rawPreviewEl.style.display = "none";
          previewActions.style.display = "none";
          copyMarkdownBtn.style.display = "inline-flex";
        } else if (isPreview) {
          editorEl.style.display = "flex";
          rawEditorEl.style.display = "none";
          previewActions.style.display = "flex";
          copyMarkdownBtn.style.display = "none";

          if (showRawHtml) {
            previewEl.style.display = "none";
            rawPreviewEl.style.display = "block";
          } else {
            previewEl.style.display = "block";
            rawPreviewEl.style.display = "none";
          }

          // Apply custom rendering or fallback rendering
          const isDark = localStorage.getItem("traven-selected-theme") === "dark";
          if (isDark) {
            previewEl.style.backgroundColor = "#0f172a";
            previewEl.style.color = "#e2e8f0";
            rawPreviewEl.style.backgroundColor = "#0f172a";
            rawPreviewEl.style.color = "#94a3b8";
          } else {
            previewEl.style.backgroundColor = "#ffffff";
            previewEl.style.color = "#1e293b";
            rawPreviewEl.style.backgroundColor = "#fafafa";
            rawPreviewEl.style.color = "#334155";
          }
          const htmlContent = window.editor.getContentHtml();
          previewEl.innerHTML = htmlContent;
          rawPreviewEl.textContent = htmlContent;

          // Render Mermaid diagrams in HTML preview
          TravenEditor.initMermaid(previewEl);
        }

        // Grey out toolbar in Markdown and Preview modes
        const toolbar = document.querySelector('.traven-toolbar-container');
        if (toolbar) {
          toolbar.classList.toggle('is-disabled', !isWysiwym);
        }

        // Force CodeMirror views to measure coordinates again to prevent layout corruption
        if (window.editor) {
          const view = window.editor.getView();
          if (view) view.requestMeasure();
        }
      }

      wysiwymTab.addEventListener('click', () => activateTab('wysiwym'));
      markdownTab.addEventListener('click', () => activateTab('markdown'));
      previewTab.addEventListener('click', () => activateTab('preview'));

      // Accordion toggle logic
      const accordionTrigger = document.getElementById('metadata-accordion-trigger');
      const formCard = document.querySelector('.form-card');

      accordionTrigger.addEventListener('click', () => {
        formCard.classList.toggle('is-collapsed');
      });
    });
  </script>
</body>

</html>
