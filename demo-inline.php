<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traven Editor — Premium WYSIWYM Markdown Editor</title>
  
  <!-- Preload Critical Fonts & Styles -->
  <link rel="preload" href="assets/fonts/fonts.css" as="style">
  <link rel="preload" href="assets/fonts/AtkinsonHyperlegibleNext-Regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/mozilla-headline-v1-latin-700.woff2" as="font" type="font/woff2" crossorigin>
  
  <link rel="stylesheet" href="assets/fonts/fonts.css">
  <link rel="stylesheet" href="assets/skins/skin-default.css" id="editor-skin-link">
  
  <link rel="stylesheet" href="assets/toolbars/toolbar-default.css">
  <link rel="stylesheet" href="assets/css/demo.css">
</head>
<body class="inline-demo">

  <?php
    $header_nav_html = '
      <a href="demo-form.php" class="nav-btn">Switch to Form Demo &rarr;</a>
    ';
    include 'includes/_header.php';
  ?>

  <main>
    <div>
      <p class="description-text">
        Experience a framework-agnostic WYSIWYM editor. Editing syntax markers (like <code>**</code> and <code>_</code>) show smoothly as you edit, and collapse into clean formatted blocks when the cursor leaves them.
      </p>
    </div>

    <div class="sandbox-grid">
      <!-- Editor Card -->
      <div class="sandbox-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke: var(--accent)"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path></svg>
            Editing View
          </div>
        </div>
        <div class="traven-toolbar-container">
          <?php include 'includes/_toolbar.php'; ?>
        </div>
        <div id="editor" class="editor-mount"></div>
      </div>

      <!-- Live Sync Output Card -->
      <div class="sandbox-card">
        <div class="card-header">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke: #e11d48"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            Markdown Content
          </div>
          <span class="output-label-badge">RAW SOURCE</span>
        </div>
        <div id="raw-editor" class="raw-editor-mount"></div>
      </div>
    </div>
  </main>

  <script type="module">
    import { TravenEditor } from "./dist/traven.js";

    // Simulate async image upload
    const mockImageUpload = async (file) => {
      console.log("Mock uploading file:", file.name);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return URL.createObjectURL(file);
    };

    // Instantiate editor after fonts are loaded to prevent CodeMirror coordinate measuring cache errors
    document.fonts.ready.then(() => {
      window.editor = new TravenEditor({
        element: document.getElementById("editor"),
        sourceElement: document.getElementById("raw-editor"),
        initialValue: "---\ntitle: Traven Editor\nauthor: John Connor\n---\n\n# Welcome to Traven\n\nThis is a **standalone** WYSIWYM editor. Try moving your cursor into **this bold text** or *this italic text* to see the delimiters appear. \n\nHere is some `inline code` and a quote:\n\n> Blockquotes look elegant and simple.\n\n---\n\n### Drag & Drop / Paste Images\nTry pasting or dropping an image file below to see the optimistic loading UI spinner in action!",
        onUploadImage: mockImageUpload
      });
    });
  </script>
</body>
</html>
