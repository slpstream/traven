<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traven Editor — Write Demo</title>

  <!-- Google Fonts CDN -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Goudy+Bookletter+1911&family=Victor+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="assets/skins/skin-write.css" id="editor-skin-link">
  <link rel="stylesheet" href="assets/toolbars/toolbar-expandable.css" id="editor-toolbar-link">

  <style>
    /* Reset & Base distraction-free styles */
    body {
      background-color: #fcfbf9 !important;
      color: #1a1a1a !important;
      font-family: 'Goudy Bookletter 1911', Georgia, serif !important;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }

    /* Clean Paper Container */
    .write-container {
      width: 100%;
      max-width: 720px;
      margin: 80px auto 120px auto;
      padding: 0 20px;
      box-sizing: border-box;
      position: relative;
    }

    /* Minimal Tabs Bar */
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 12px;
    }

    .unified-tab-bar {
      display: flex;
      gap: 20px;
    }

    .unified-tab {
      background: none;
      border: none;
      font-family: inherit;
      font-size: 0.9em;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px 0;
      transition: color 0.2s ease, border-color 0.2s ease;
      border-bottom: 2px solid transparent;
      font-weight: 500;
    }

    .unified-tab.is-active {
      color: #1a1a1a;
      border-bottom-color: #1a1a1a;
      font-weight: 600;
    }

    .unified-tab:hover:not(.is-active) {
      color: #475569;
    }

    .copy-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      transition: color 0.2s ease;
    }

    .copy-btn:hover {
      color: #1a1a1a;
    }

    .copy-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Editor Wrapper Overrides - No borders, no shadows */
    .editor-wrapper {
      width: 100%;
      background: transparent;
      display: flex;
      flex-direction: column;
    }

    .editor-mount, .raw-editor-mount, .html-preview-mount {
      width: 100%;
      outline: none;
    }

    #editor {
      display: flex !important;
      flex-direction: column;
    }

    /* Hide WYSIWYM workspace when not in WYSIWYM mode */
    .editor-wrapper:not(.mode-wysiwym) #editor .cm-editor {
      display: none !important;
    }

    /* Hide Raw Markdown workspace when not in Markdown mode */
    .editor-wrapper:not(.mode-markdown) #raw-editor {
      display: none !important;
    }

    /* Hide Preview workspace when not in Preview mode */
    .editor-wrapper:not(.mode-preview) #html-preview {
      display: none !important;
    }



    /* Fixed Centered Top Toolbar Styling - Always On in WYSIWYM Mode */
    .traven-toolbar-container {
      position: fixed !important;
      top: 24px !important;
      left: 50% !important;
      transform: translateX(-50%) translateY(0) !important;
      z-index: 1000 !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      background-color: transparent !important;
      border: none !important;
      border-radius: 6px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
      padding: 0 !important;
      /* Fly-in / fade transition */
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  visibility 0.3s !important;
    }

    /* Hide toolbar when not in WYSIWYM mode */
    .editor-wrapper:not(.mode-wysiwym) .traven-toolbar-container {
      display: none !important;
    }

    /* Hide toolbar with fade & fly-out animation when toggled off */
    .editor-wrapper.toolbar-hidden .traven-toolbar-container {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      transform: translateX(-50%) translateY(-20px) !important;
    }

    /* Fullscreen Mode styling overrides for distraction-free writing layout */
    .editor-wrapper.is-fullscreen {
      background-color: #fcfbf9 !important;
      overflow-y: auto !important;
      padding: 0 !important;
    }

    .editor-wrapper.is-fullscreen .editor-mount,
    .editor-wrapper.is-fullscreen .raw-editor-mount,
    .editor-wrapper.is-fullscreen .html-preview-mount {
      max-width: 960px !important;
      margin: 80px auto 40px auto !important;
      padding: 0 20px !important;
      box-sizing: border-box !important;
    }

    /* Brand Link top-left */
    .write-brand {
      position: absolute;
      top: 24px;
      left: 24px;
      z-index: 100;
      opacity: 0.55;
      transition: opacity 0.2s ease;
    }

    .write-brand:hover {
      opacity: 1;
    }

    .write-brand img {
      height: 20px;
      width: auto;
      display: block;
    }

    @media (max-width: 1024px) {
      .write-brand {
        position: static;
        margin: 24px auto 0 auto;
      }
      .write-container {
        margin-top: 40px;
      }
    }

    /* Toast Notification */
    .save-toast {
      position: fixed;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background-color: #1a1a1a;
      color: #fcfbf9;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .save-toast.is-show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    .save-toast svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  </style>
</head>
<body>

  <!-- Toast Notification element -->
  <div id="save-toast" class="save-toast">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
    <span>Saved</span>
  </div>

  <!-- Return to traven.dev wordmark -->
  <a href="https://traven.dev" class="write-brand" title="Return to Traven homepage">
    <img src="assets/images/traven.png" alt="Traven logo">
  </a>

  <div class="write-container">
    <!-- Header with clean tabs -->
    <div class="tab-header">
      <div class="unified-tab-bar">
        <button type="button" id="tab-wysiwym" class="unified-tab is-active">WYSIWYM</button>
        <button type="button" id="tab-markdown" class="unified-tab">Markdown</button>
        <button type="button" id="tab-preview" class="unified-tab">Preview</button>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <button type="button" class="copy-btn" id="toggle-toolbar-btn" title="Hide Toolbar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polygon points="16 104 128 168 240 104 128 40 16 104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="16 144 128 208 240 144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
        </button>
        <button type="button" class="copy-btn" id="copy-markdown-btn" title="Copy Markdown">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="168 168 216 168 216 40 88 40 88 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="40" y="88" width="128" height="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
        </button>
      </div>
    </div>

    <!-- Clean Editor Area -->
    <div class="editor-wrapper mode-wysiwym">
      <div id="editor" class="editor-mount"></div>
      <div id="raw-editor" class="raw-editor-mount"></div>
      <div id="html-preview" class="html-preview-mount traven-preview"></div>
    </div>
  </div>

  <script type="module">
    import { TravenEditor, DEFAULT_TOOLBAR } from "./dist/traven.js";

    const initialText = `# A Quiet Space

This is Traven's distraction-free writing layout. The design features Goudy Bookletter 1911 as the primary typeface and a fixed, top-centered floating toolbar. Switch between WYSIWYM, Markdown, and Preview tabs above to view raw markdown or see what your work will look like when rendered as a web page.

[image src="https://traven.dev/img/vignette.png" align="center" size="medium" caption="- Life is good..."]

## Focus on Writing

To maintain a clean screen, use the manual toolbar toggle button (located at the top right next to "Copy Markdown") to show or hide the floating toolbar at any time.

1. Toggle the toolbar on to access formatting tools for **bold**, *italics*, **[links](https://traven.dev)**, \`inline code\`, and a lot more that users expect in a featurerich text editor.
2. Toggle it off to hide all visual styling controls and write in complete peace.
3. The toolbar itself can be expanded to a full-length feature set of all available buttons, or collapsed to show just the most frequently-used tools.

\`\`\`
Victor Mono handles the code styling
const message = "A clean canvas for your thoughts";
console.log(message);
\`\`\`

Feel free to write here, format text, or switch views above. ==You can edit both in the WYSIWYM tab and the Markdown tab==, with live updates in both without reload or any need to save (only the Preview tab is a static view.) 
Think of this page as an interactive sandbox, so use all the toys in the toolbar to play around and see the power of a fast, unobtrusive Markdown editor.`;

    // Simulate async image upload
    const mockImageUpload = async (file) => {
      console.log("Mock uploading file:", file.name);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return URL.createObjectURL(file);
    };

    // Toast notification logic
    const toast = document.getElementById('save-toast');
    let toastTimeout = null;
    function showSaveToast() {
      if (toast) {
        toast.classList.add('is-show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
          toast.classList.remove('is-show');
        }, 2000);
      }
    }

    // Initialize Traven Editor
    document.fonts.ready.then(() => {
      window.editor = new TravenEditor({
        element: document.getElementById("editor"),
        sourceElement: document.getElementById("raw-editor"),
        initialValue: initialText,
        onUploadImage: mockImageUpload,
        toolbar: DEFAULT_TOOLBAR,
        theme: "light",
        katex: true,
        onSave: (content) => {
          showSaveToast();
        }
      });

      // Setup copy button
      const copyBtn = document.getElementById('copy-markdown-btn');
      const markdownIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="168 168 216 168 216 40 88 40 88 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="40" y="88" width="128" height="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;
      const mdIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M208,224V88L152,32H56a8,8,0,0,0-8,8v72" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="152 32 152 88 208 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M128,152v56h16a28,28,0,0,0,0-56Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="96 208 96 152 68 192 40 152 40 208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;
      const htmlIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M48,120V40a8,8,0,0,1,8-8h96l56,56v32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="152 32 152 88 208 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="24" y1="160" x2="24" y2="208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="60" y1="160" x2="60" y2="208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="100" y1="160" x2="100" y2="208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="116" y1="160" x2="84" y2="160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="60" y1="184" x2="24" y2="184" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="140 208 140 160 164 192 188 160 188 208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="216 160 216 208 244 208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;
      const checkIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="40 144 96 200 224 72" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;
      let timeoutId = null;
      let activeTabMode = 'wysiwym';

      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const textToCopy = (activeTabMode === 'preview') ? window.editor.getContentHtml() : window.editor.getValue();
          navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.innerHTML = checkIconHtml;
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              if (activeTabMode === 'preview') {
                copyBtn.innerHTML = htmlIconHtml;
              } else if (activeTabMode === 'markdown') {
                copyBtn.innerHTML = mdIconHtml;
              } else {
                copyBtn.innerHTML = markdownIconHtml;
              }
            }, 2000);
          });
        });
      }

      // Tab switcher
      const wysiwymTab = document.getElementById('tab-wysiwym');
      const markdownTab = document.getElementById('tab-markdown');
      const previewTab = document.getElementById('tab-preview');
      const editorWrapper = document.querySelector('.editor-wrapper');
      const toggleToolbarBtn = document.getElementById('toggle-toolbar-btn');

      // Toolbar Toggle Logic
      const savedToolbarState = localStorage.getItem('traven-write-toolbar-visible');
      let toolbarVisible = savedToolbarState !== 'false';

      const hideIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polygon points="16 104 128 168 240 104 128 40 16 104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="16 144 128 208 240 144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;
      const showIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="32 128 128 184 224 128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polygon points="32 80 128 136 224 80 128 24 32 80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="184" y1="200" x2="232" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="208" y1="176" x2="208" y2="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="32 176 128 232 144 222.67" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;

      function updateToolbarToggleUI() {
        if (toolbarVisible) {
          editorWrapper.classList.remove('toolbar-hidden');
          toggleToolbarBtn.innerHTML = hideIconHtml;
          toggleToolbarBtn.title = "Hide Toolbar";
          toggleToolbarBtn.setAttribute('aria-label', "Hide Toolbar");
        } else {
          editorWrapper.classList.add('toolbar-hidden');
          toggleToolbarBtn.innerHTML = showIconHtml;
          toggleToolbarBtn.title = "Show Toolbar";
          toggleToolbarBtn.setAttribute('aria-label', "Show Toolbar");
        }
      }

      if (toggleToolbarBtn) {
        toggleToolbarBtn.addEventListener('click', () => {
          toolbarVisible = !toolbarVisible;
          localStorage.setItem('traven-write-toolbar-visible', toolbarVisible);
          updateToolbarToggleUI();
        });
        updateToolbarToggleUI();
      }

      function activateTab(mode) {
        const isWysiwym = mode === 'wysiwym';
        const isMarkdown = mode === 'markdown';
        const isPreview = mode === 'preview';

        activeTabMode = mode;

        wysiwymTab.classList.toggle('is-active', isWysiwym);
        markdownTab.classList.toggle('is-active', isMarkdown);
        previewTab.classList.toggle('is-active', isPreview);
        
        editorWrapper.classList.toggle('mode-wysiwym', isWysiwym);
        editorWrapper.classList.toggle('mode-markdown', isMarkdown);
        editorWrapper.classList.toggle('mode-preview', isPreview);

        if (toggleToolbarBtn) {
          toggleToolbarBtn.style.display = isWysiwym ? "inline-flex" : "none";
        }

        if (copyBtn) {
          if (isPreview) {
            copyBtn.innerHTML = htmlIconHtml;
            copyBtn.title = "Copy HTML";
            copyBtn.setAttribute('aria-label', "Copy HTML");
          } else if (isMarkdown) {
            copyBtn.innerHTML = mdIconHtml;
            copyBtn.title = "Copy Markdown";
            copyBtn.setAttribute('aria-label', "Copy Markdown");
          } else {
            copyBtn.innerHTML = markdownIconHtml;
            copyBtn.title = "Copy Markdown";
            copyBtn.setAttribute('aria-label', "Copy Markdown");
          }
        }

        if (isPreview) {
          const previewEl = document.getElementById("html-preview");
          previewEl.innerHTML = window.editor.getContentHtml();
        }

        if (window.editor) {
          const view = window.editor.getView();
          if (view) view.requestMeasure();
        }
      }

      wysiwymTab.addEventListener('click', () => activateTab('wysiwym'));
      markdownTab.addEventListener('click', () => activateTab('markdown'));
      previewTab.addEventListener('click', () => activateTab('preview'));

    });
  </script>

</body>
</html>
