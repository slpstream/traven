<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traven Editor — Form-Managed Metadata Demo</title>
  
  <!-- Preload Critical Fonts & Styles -->
  <link rel="preload" href="assets/fonts.css" as="style">
  <link rel="preload" href="assets/fonts/AtkinsonHyperlegibleNext-Regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/mozilla-headline-v1-latin-700.woff2" as="font" type="font/woff2" crossorigin>
  
  <link rel="stylesheet" href="assets/fonts.css">
  <link rel="stylesheet" href="assets/skins/default.css" id="editor-skin-link">
  
  <link rel="stylesheet" href="assets/toolbars/default.css">
  <link rel="stylesheet" href="assets/demo.css">
</head>
<body class="form-demo">
  
  <?php
    $header_nav_html = '<a href="demo-inline.php" class="nav-btn">&larr; Switch to Inline YAML Demo</a>';
    include 'includes/_header.php';
  ?>

  <main>
    <!-- Left Sidebar: Metadata Form and Unified Source -->
    <div style="display: flex; flex-direction: column; gap: 30px;">
      <!-- Form Input Card -->
      <div class="sandbox-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Body Content Editor
        </div>
      </div>
      <div class="editor-wrapper">
        <!-- Toolbar Container -->
        <div class="traven-toolbar-container">
          <button class="toolbar-btn btn-undo" onclick="triggerUndo()" title="Undo (Ctrl+Z)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
            Undo
          </button>
          <button class="toolbar-btn btn-redo" onclick="triggerRedo()" title="Redo (Ctrl+Y)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>
            Redo
          </button>
          <button class="toolbar-btn btn-bold" onclick="applyFormat('**', '**', 'bold text')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
            Bold
          </button>
          <button class="toolbar-btn btn-italic" onclick="applyFormat('*', '*', 'italic text')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
            Italic
          </button>
          <button class="toolbar-btn btn-code" onclick="applyFormat('`', '`', 'code')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            Code
          </button>
          <button class="toolbar-btn btn-heading" onclick="applyFormat('### ', '', 'Heading')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="4" x2="4" y2="20"></line><line x1="20" y1="4" x2="20" y2="20"></line></svg>
            Heading
          </button>
          <select id="skin-select" class="toolbar-btn btn-skin-select" style="padding: 4px 8px; font-family: inherit;">
            <option value="neutral">Neutral Skin</option>
            <option value="colorful">Colorful Skin</option>
          </select>
        </div>
        <div id="editor" class="editor-mount"></div>
      </div>
    </div>
  </main>

  <script type="module">
    import { TravenEditor } from "./dist/traven.js";

    // Raw starting document (loaded from database)
    const initialRawFile = `---
title: Traven Structured Demo
author: Sarah Connor
status: Published
---

# Form-Managed Metadata Demo

This demo illustrates **Approach B (Split-Before / Join-After)** which is the recommended pattern for CMS integrations.

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

    // Attach listeners to form inputs
    titleInput.addEventListener("input", updateCombinedPreview);
    authorInput.addEventListener("input", updateCombinedPreview);
    statusSelect.addEventListener("change", updateCombinedPreview);

    // 4. Initialize Traven with only the Markdown body content
    document.fonts.ready.then(() => {
      window.editor = new TravenEditor({
        element: document.getElementById("editor"),
        initialValue: markdown,
        onChange: () => {
          updateCombinedPreview();
        }
      });
      // Initial preview compilation
      updateCombinedPreview();
    });

    // Formatting API helpers
    window.applyFormat = (before, after, placeholder) => {
      if (window.editor) {
        window.editor.insertSnippet(before, after, placeholder);
      }
    };

    window.triggerUndo = () => {
      if (window.editor) {
        window.editor.undo();
      }
    };

    window.triggerRedo = () => {
      if (window.editor) {
        window.editor.redo();
      }
    };

    // Handle dynamic skin switching
    document.getElementById('skin-select')?.addEventListener('change', (e) => {
      document.getElementById('editor-skin-link').href = 'assets/skins/' + e.target.value + '.css';
    });
  </script>
</body>
</html>
