<?php
/**
 * demo-typography.php
 * Traven Editor — Parameterized Typography Demo
 * Allows dynamic customization of Display, Body, and Monospace fonts at runtime.
 */

$message = '';
$submittedContent = '';
$isPost = $_SERVER['REQUEST_METHOD'] === 'POST';

if ($isPost) {
  $submittedContent = $_POST['editor_content'] ?? '';
  if (!empty(trim($submittedContent))) {
    $message = "Success: Content saved! Received " . strlen($submittedContent) . " characters.";
  } else {
    $message = "Warning: Content was empty.";
  }
} else {
  $submittedContent = "# LIVE HOT-SWAPPING OF FONTS\n\nWelcome to the Traven Typography sandbox! This page allows you to customize the fonts used in the editor and HTML preview in real-time.\n\nUse the dropdown selectors above to pair different Display (headings/components), Body (paragraphs), and Monospace (code/frontmatter) typefaces.\n\n## Custom Shortcode Elements\n\nNotice how the Display font affects headings, captions, and shortcodes like pullquotes:\n\n[pullquote]“Design is not just what it looks like and feels like. Design is how it works.” — Steve Jobs[/pullquote]\n\nAnd how the Mono font applies to inline code like `const version = '0.2.5';` and code blocks:\n\n```js\n// Code blocks look best with mono fonts like this one.\nfunction greet(user) {\n  return `Hello, \${user}!`;\n}\n```\n\n[component name=\"info\" title=\"CALLOUT COMPONENTS CAN DISPLAY IMPORTANT INFORMATION\"]This info box is also styled using the Display font for its header but inherits the Body typeface for content consistency.[/component]\n\nTry selecting different combinations and feel free to submit this form or view the static HTML preview!\n\n";
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traven Editor — Parameterized Typography Demo</title>
  <meta name="description"
    content="A dynamic typography customization environment for Traven Editor utilizing the skin-custom.css parameterized overlay.">

  <!-- Core stylesheets -->
  <link rel="stylesheet" href="packages/core/assets/skins/skin-custom.css" id="editor-skin-link">
  <link rel="stylesheet" href="packages/core/assets/toolbars/toolbar-default.css" id="editor-toolbar-link">
  <link rel="stylesheet" href="packages/core/assets/css/demo.css">

  <style>
    /* Premium Design Theme System */
    :root {
      --bg-gradient: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      --card-bg: rgba(255, 255, 255, 0.95);
      --text-main: #0f172a;
      --text-secondary: #475569;
      --accent-color: #0f172a;
      --border-color: #cbd5e1;
      --shadow-premium: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.01);

      /* Active font families default to variables defined in skin-custom.css */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      background: var(--bg-gradient);
      color: var(--text-main);
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .container {
      width: 100%;
      max-width: 900px;
      margin: 60px auto 100px auto;
      padding: 0 24px;
      box-sizing: border-box;
    }

    /* Wordmark branding */
    .brand-link {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      margin-bottom: 24px;
      opacity: 0.75;
      transition: opacity 0.2s ease;
    }

    .brand-link:hover {
      opacity: 1;
    }

    .brand-link img {
      height: 24px;
      width: auto;
    }

    /* Controls Panel */
    .control-panel {
      background: var(--card-bg);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-premium);
      backdrop-filter: blur(8px);
    }

    .control-header {
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 1.25em;
      font-weight: 700;
      color: var(--text-main);
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 12px;
    }

    .control-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .control-label {
      font-size: 0.82em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .control-select {
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.9em;
      color: var(--text-main);
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .control-select:focus {
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
    }

    /* Preset Grid & Mini-Cards Styling */
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      width: 100%;
    }

    .preset-card,
    .preset-card-gray {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 12px;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-family: inherit;
      outline: none;
    }

    .preset-card {
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .preset-card:hover {
      border-color: var(--text-main);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transform: translateY(-1px);
    }

    .preset-card.is-active {
      border-color: var(--accent-color);
      background: var(--accent-color);
      color: #ffffff;
    }

    .preset-card.is-active .preset-desc {
      color: rgba(255, 255, 255, 0.7);
    }

    .preset-card-gray {
      opacity: 0.6;
      cursor: default;
      pointer-events: none;
    }

    .preset-name {
      font-weight: 700;
      font-size: 0.9em;
    }

    .preset-desc {
      font-size: 0.75em;
      color: var(--text-secondary);
      line-height: 1.25;
    }

    /* Status Box */
    .status-box {
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-weight: 500;
      font-size: 0.95em;
    }

    .status-success {
      background-color: #ecfdf5;
      border: 1px solid #10b981;
      color: #065f46;
    }

    .status-warning {
      background-color: #fef2f2;
      border: 1px solid #ef4444;
      color: #991b1b;
    }

    /* Workspace Card */
    .workspace-card {
      background: var(--card-bg);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 16px;
      box-shadow: var(--shadow-premium);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .workspace-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #f1f5f9;
      background-color: #fafafa;
    }

    .tab-bar {
      display: flex;
      gap: 16px;
    }

    .tab-btn {
      background: none;
      border: none;
      font-size: 0.9em;
      font-weight: 600;
      color: #94a3b8;
      cursor: pointer;
      padding: 6px 0;
      border-bottom: 2px solid transparent;
      transition: color 0.2s, border-color 0.2s;
    }

    .tab-btn.is-active {
      color: var(--text-main);
      border-bottom-color: var(--accent-color);
    }

    .tab-btn:hover:not(.is-active) {
      color: var(--text-secondary);
    }

    .copy-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border-radius: 6px;
      transition: color 0.2s, background-color 0.2s;
    }

    .copy-btn:hover {
      color: var(--text-main);
      background-color: #f1f5f9;
    }

    .copy-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Editor Wrapper & Mounts */
    .editor-wrapper {
      width: 100% !important;
      min-height: 450px !important;
      display: flex !important;
      flex-direction: column !important;
      position: relative !important;
      border: none !important;
      border-radius: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    .editor-mount,
    .raw-editor-mount,
    .html-preview-mount {
      width: 100%;
      outline: none;
      box-sizing: border-box;
    }

    #editor {
      display: flex !important;
      flex-direction: column;
    }

    /* Tab show/hide toggles */
    .editor-wrapper:not(.mode-wysiwym) #editor {
      display: none !important;
    }

    .editor-wrapper:not(.mode-markdown) #raw-editor {
      display: none !important;
    }

    .editor-wrapper:not(.mode-preview) #html-preview {
      display: none !important;
    }

    /* Form Action area */
    .action-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background-color: #fafafa;
      border-top: 1px solid #f1f5f9;
    }

    .btn-save {
      background-color: var(--accent-color);
      color: #ffffff;
      border: none;
      padding: 10px 24px;
      font-size: 0.9em;
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
      transition: background-color 0.2s, transform 0.1s;
    }

    .btn-save:hover {
      background-color: #1e293b;
    }

    .btn-save:active {
      transform: scale(0.98);
    }

    /* Toast Notification styles */
    .toast-notification {
      position: fixed;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background-color: #1e293b;
      color: #f8fafc;
      padding: 12px 24px;
      border-radius: 30px;
      font-size: 0.9em;
      font-weight: 600;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
    }

    .toast-notification.is-show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    .toast-notification svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: #10b981;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  </style>
</head>

<body>

  <?php
  $hide_skin_select = true;
  include "includes/_customization-dropdowns.php";
  $header_nav_html = $customization_dropdowns_html;
  include "includes/_header.php";
  ?>

  <!-- Toast Notification -->
  <div id="save-toast" class="toast-notification">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    <span>Content Saved Successfully</span>
  </div>

  <div class="container">

    <!-- Controls Panel: Preset -->
    <div class="control-panel">
      <h2 class="control-header">Choose a Preset</h2>
      <div class="preset-grid">
        <button type="button" class="preset-card" data-preset="default">
          <span class="preset-name">Default</span>
          <span class="preset-desc">System Default</span>
        </button>
        <button type="button" class="preset-card" data-preset="scifi">
          <span class="preset-name">Sci-fi Tech</span>
          <span class="preset-desc">Science Gothic + Rajdhani</span>
        </button>
        <button type="button" class="preset-card" data-preset="retro">
          <span class="preset-name">Retro-Literary</span>
          <span class="preset-desc">Special Elite + Goudy</span>
        </button>
        <button type="button" class="preset-card" data-preset="startup">
          <span class="preset-name">Tech Startup</span>
          <span class="preset-desc">Outfit + Inter</span>
        </button>
        <button type="button" class="preset-card" data-preset="literary">
          <span class="preset-name">Longform Writing</span>
          <span class="preset-desc">Playfair + Baskerville</span>
        </button>
        <button type="button" class="preset-card" data-preset="newsroom">
          <span class="preset-name">Newsroom</span>
          <span class="preset-desc">Oswald + Epunda Slab</span>
        </button>
        <button type="button" class="preset-card" data-preset="whimsical">
          <span class="preset-name">Whimsical</span>
          <span class="preset-desc">Macondo + Comic Relief</span>
        </button>
        <button type="button" class="preset-card" data-preset="casual">
          <span class="preset-name">Casual</span>
          <span class="preset-desc">Comic Relief + Inter</span>
        </button>
        <button type="button" class="preset-card" data-preset="typed">
          <span class="preset-name">Typed Report</span>
          <span class="preset-desc">Courier Prime + JetBrains</span>
        </button>
        <button type="button" class="preset-card-gray">
          <span class="preset-name">Make Your Own</span>
          <span class="preset-desc">Mix and Match fonts below</span>
        </button>
      </div>
    </div>

    <!-- Controls Panel: Mix and Match -->
    <div class="control-panel">
      <h2 class="control-header">Or Mix and Match</h2>
      <div class="control-row">
        <!-- Display Font Selector -->
        <div class="control-group">
          <label class="control-label" for="select-display">Display Typeface (Headings)</label>
          <select id="select-display" class="control-select">
            <!-- Populated via Javascript -->
          </select>
        </div>
        <!-- Body Font Selector -->
        <div class="control-group">
          <label class="control-label" for="select-body">Body Typeface (Paragraphs)</label>
          <select id="select-body" class="control-select">
            <!-- Populated via Javascript -->
          </select>
        </div>
        <!-- Monospace Font Selector -->
        <div class="control-group">
          <label class="control-label" for="select-mono">Mono Typeface (Code Blocks)</label>
          <select id="select-mono" class="control-select">
            <!-- Populated via Javascript -->
          </select>
        </div>
      </div>
    </div>

    <!-- Status Message -->
    <?php if ($message): ?>
      <div class="status-box <?php echo strpos($message, 'Success') !== false ? 'status-success' : 'status-warning'; ?>">
        <?php echo htmlspecialchars($message); ?>
      </div>
    <?php endif; ?>

    <!-- Main Workspace Form -->
    <form action="" method="POST">
      <!-- Hidden textarea to bind editor value -->
      <textarea id="editor-textarea-binding" name="editor_content" style="display: none;"></textarea>

      <div class="workspace-card">
        <div class="workspace-header">
          <div class="tab-bar">
            <button type="button" id="tab-wysiwym" class="tab-btn is-active">WYSIWYM</button>
            <button type="button" id="tab-markdown" class="tab-btn">Markdown</button>
            <button type="button" id="tab-preview" class="tab-btn">Preview</button>
          </div>
          <div>
            <button type="button" class="copy-btn" id="copy-btn" title="Copy Content">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                <rect width="256" height="256" fill="none" />
                <polyline points="168 168 216 168 216 40 88 40 88 88" fill="none" stroke="currentColor"
                  stroke-linecap="round" stroke-linejoin="round" stroke-width="16" />
                <rect x="40" y="88" width="128" height="128" fill="none" stroke="currentColor" stroke-linecap="round"
                  stroke-linejoin="round" stroke-width="16" />
              </svg>
            </button>
          </div>
        </div>

        <div class="editor-wrapper mode-wysiwym">
          <div id="editor" class="editor-mount"></div>
          <div id="raw-editor" class="raw-editor-mount"></div>
          <div id="html-preview" class="html-preview-mount traven-preview"
            style="padding: 24px 32px; overflow-y: auto; height: 100%; box-sizing: border-box;"></div>
        </div>

        
      </div>
    </form>
  </div>

  <!-- Load KaTeX globally for LaTeX support -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>

  <!-- Script Modules initialization -->
  <script type="module">
    import { TravenEditor, DEFAULT_TOOLBAR } from "./packages/core/dist/traven.js";

    // Setup Mermaid globally
    TravenEditor.configureMermaid(true);

    // Dynamic Font Catalog
    const FONT_CATALOG = {
      display: [
        { name: "System Sans (Default)", css: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', gfonts: null },
        { name: "Science Gothic", css: "'Science Gothic', sans-serif", gfonts: "Science+Gothic:wght@700;900" },
        { name: "Macondo", css: "'Macondo', cursive", gfonts: "Macondo" },
        { name: "Playfair Display", css: "'Playfair Display', serif", gfonts: "Playfair+Display:wght@700;900" },
        { name: "Oswald", css: "'Oswald', sans-serif", gfonts: "Oswald:wght@700" },
        { name: "Outfit", css: "'Outfit', sans-serif", gfonts: "Outfit:wght@700;800;900" },
        { name: "Special Elite", css: "'Special Elite', cursive", gfonts: "Special+Elite" },
        { name: "Comic Relief", css: "'Comic Relief', cursive", gfonts: "Comic+Relief" },
        { name: "Courier Prime", css: "'Courier Prime', monospace", gfonts: "Courier+Prime:ital,wght@0,400;0,700;1,400;1,700" }
      ],
      body: [
        { name: "Georgia (Default)", css: 'Georgia, Cambria, "Times New Roman", Times, serif', gfonts: null },
        { name: "Epunda Slab", css: "'Epunda Slab', Georgia, serif", gfonts: "Epunda+Slab:ital,wght@0,400;0,700;1,400;1,700" },
        { name: "Rajdhani", css: "'Rajdhani', sans-serif", gfonts: "Rajdhani:wght@500;600;700" },
        { name: "Goudy Bookletter 1911", css: "'Goudy Bookletter 1911', serif", gfonts: "Goudy+Bookletter+1911" },
        { name: "Inter", css: "'Inter', sans-serif", gfonts: "Inter:wght@400;600;700" },
        { name: "Libre Baskerville", css: "'Libre Baskerville', serif", gfonts: "Libre+Baskerville:ital,wght@0,400;0,700;1,400" },
        { name: "Comic Relief", css: "'Comic Relief', cursive", gfonts: "Comic+Relief" },
        { name: "Courier Prime", css: "'Courier Prime', monospace", gfonts: "Courier+Prime:ital,wght@0,400;0,700;1,400;1,700" }
      ],
      mono: [
        { name: "System Mono (Default)", css: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', gfonts: null },
        { name: "JetBrains Mono", css: "'JetBrains Mono', monospace", gfonts: "JetBrains+Mono:ital,wght@0,400;0,700;1,400;1,700" },
        { name: "Share Tech Mono", css: "'Share Tech Mono', monospace", gfonts: "Share+Tech+Mono" },
        { name: "Victor Mono", css: "'Victor Mono', monospace", gfonts: "Victor+Mono:ital,wght@0,400;0,700;1,400;1,700" },
        { name: "Courier Prime", css: "'Courier Prime', monospace", gfonts: "Courier+Prime:ital,wght@0,400;0,700;1,400;1,700" }
      ]
    };

    // Load initial values from PHP variable
    const initialText = <?php echo json_encode($submittedContent); ?>;
    document.getElementById('editor-textarea-binding').value = initialText;

    // Font injection function
    function applyFont(role, fontIndex) {
      const fontList = FONT_CATALOG[role];
      const fontEntry = fontList[fontIndex] || fontList[0];

      // Save selection
      localStorage.setItem(`traven-custom-font-${role}`, fontIndex);

      // Set CSS Custom Property
      document.documentElement.style.setProperty(`--traven-font-${role}`, fontEntry.css);

      // Manage Google Fonts CDN Link
      const linkId = `gfont-link-${role}`;
      let linkEl = document.getElementById(linkId);

      if (fontEntry.gfonts) {
        const url = `https://fonts.googleapis.com/css2?family=${fontEntry.gfonts}&display=swap`;
        if (!linkEl) {
          linkEl = document.createElement('link');
          linkEl.id = linkId;
          linkEl.rel = 'stylesheet';
          document.head.appendChild(linkEl);
        }
        linkEl.href = url;
      } else {
        if (linkEl) {
          linkEl.remove();
        }
      }

      // Re-measure CodeMirror viewport sizing once layout completes
      document.fonts.ready.then(() => {
        if (window.editor && typeof window.editor.getView === "function") {
          const view = window.editor.getView();
          if (view) {
            view.requestMeasure();
          }
        }
      });
    }

    const PRESETS = {
      default: { display: 0, body: 0, mono: 0 },
      scifi: { display: 1, body: 2, mono: 2 },
      retro: { display: 6, body: 3, mono: 3 },
      startup: { display: 5, body: 4, mono: 1 },
      literary: { display: 3, body: 5, mono: 4 },
      newsroom: { display: 4, body: 1, mono: 1 },
      whimsical: { display: 2, body: 6, mono: 4 },
      casual: { display: 7, body: 4, mono: 3 },
      typed: { display: 8, body: 7, mono: 1 }
    };

    function updatePresetDropdownState() {
      const selectDisplay = document.getElementById('select-display').value;
      const selectBody = document.getElementById('select-body').value;
      const selectMono = document.getElementById('select-mono').value;

      let matchedPreset = 'custom';
      for (const [key, config] of Object.entries(PRESETS)) {
        if (
          config.display === parseInt(selectDisplay, 10) &&
          config.body === parseInt(selectBody, 10) &&
          config.mono === parseInt(selectMono, 10)
        ) {
          matchedPreset = key;
          break;
        }
      }

      // Update active states on preset cards
      document.querySelectorAll('.preset-card').forEach(card => {
        const isMatch = card.getAttribute('data-preset') === matchedPreset;
        card.classList.toggle('is-active', isMatch);
      });

      localStorage.setItem('traven-custom-font-preset', matchedPreset);
    }

    // Populate selectors and restore settings
    function setupDropdowns() {
      const roles = ['display', 'body', 'mono'];

      // Populate options
      roles.forEach(role => {
        const select = document.getElementById(`select-${role}`);
        const optionsList = FONT_CATALOG[role];

        optionsList.forEach((font, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.textContent = font.name;
          select.appendChild(opt);
        });
      });

      // Restore selections
      const savedPreset = localStorage.getItem('traven-custom-font-preset');
      if (savedPreset && savedPreset !== 'custom' && PRESETS[savedPreset]) {
        const config = PRESETS[savedPreset];
        roles.forEach(role => {
          const select = document.getElementById(`select-${role}`);
          const idx = config[role];
          select.value = idx;
          applyFont(role, idx);
        });
      } else {
        roles.forEach(role => {
          const select = document.getElementById(`select-${role}`);
          const savedIdx = localStorage.getItem(`traven-custom-font-${role}`);
          const optionsList = FONT_CATALOG[role];
          if (savedIdx !== null && optionsList[savedIdx]) {
            select.value = savedIdx;
            applyFont(role, savedIdx);
          } else {
            select.value = 0;
            applyFont(role, 0);
          }
        });
      }
      updatePresetDropdownState();

      // Add change listeners to individual selects
      roles.forEach(role => {
        const select = document.getElementById(`select-${role}`);
        select.addEventListener('change', (e) => {
          const idx = parseInt(e.target.value, 10);
          applyFont(role, idx);
          updatePresetDropdownState();
        });
      });

      // Add click listeners to preset cards
      document.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
          const val = card.getAttribute('data-preset');
          if (val && PRESETS[val]) {
            const config = PRESETS[val];
            roles.forEach(role => {
              const select = document.getElementById(`select-${role}`);
              const idx = config[role];
              select.value = idx;
              applyFont(role, idx);
            });
            updatePresetDropdownState();
          }
        });
      });
    }

    // Toast logic
    const toast = document.getElementById('save-toast');
    let toastTimeout = null;
    function showSaveToast() {
      if (toast) {
        toast.classList.add('is-show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
          toast.classList.remove('is-show');
        }, 2500);
      }
    }

    // Simulate async image upload
    const mockImageUpload = async (file) => {
      console.log("Mock uploading file:", file.name);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return URL.createObjectURL(file);
    };

    // Page initialization
    setupDropdowns();

    document.fonts.ready.then(() => {
      // Initialize Traven
      window.editor = new TravenEditor({
        element: document.getElementById("editor"),
        sourceElement: document.getElementById("raw-editor"),
        initialValue: initialText,
        onUploadImage: mockImageUpload,
        toolbar: DEFAULT_TOOLBAR,
        theme: "light",
        katex: true,
        onSave: (content) => {
          document.getElementById('editor-textarea-binding').value = content;
          showSaveToast();
        }
      });

      // Synchronize editor changes into form submission element
      window.editor.on("update", (content) => {
        document.getElementById('editor-textarea-binding').value = content;
      });

      // Tab selector logic
      const wysiwymTab = document.getElementById('tab-wysiwym');
      const markdownTab = document.getElementById('tab-markdown');
      const previewTab = document.getElementById('tab-preview');
      const editorWrapper = document.querySelector('.editor-wrapper');
      const copyBtn = document.getElementById('copy-btn');

      const copyIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="168 168 216 168 216 40 88 40 88 88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><rect x="40" y="88" width="128" height="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;
      const checkIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="40 144 96 200 224 72" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>`;

      let activeTabMode = 'wysiwym';
      let copyTimeout = null;

      copyBtn.addEventListener('click', () => {
        const textToCopy = (activeTabMode === 'preview') ? window.editor.getContentHtml() : window.editor.getValue();
        navigator.clipboard.writeText(textToCopy).then(() => {
          copyBtn.innerHTML = checkIconHtml;
          if (copyTimeout) clearTimeout(copyTimeout);
          copyTimeout = setTimeout(() => {
            copyBtn.innerHTML = copyIconHtml;
          }, 2000);
        });
      });

      function activateTab(mode) {
        activeTabMode = mode;
        const isWysiwym = mode === 'wysiwym';
        const isMarkdown = mode === 'markdown';
        const isPreview = mode === 'preview';

        wysiwymTab.classList.toggle('is-active', isWysiwym);
        markdownTab.classList.toggle('is-active', isMarkdown);
        previewTab.classList.toggle('is-active', isPreview);

        editorWrapper.classList.toggle('mode-wysiwym', isWysiwym);
        editorWrapper.classList.toggle('mode-markdown', isMarkdown);
        editorWrapper.classList.toggle('mode-preview', isPreview);

        if (isPreview) {
          const previewEl = document.getElementById("html-preview");
          previewEl.innerHTML = window.editor.getContentHtml();
          TravenEditor.initMermaid(previewEl);
        }

        // Measure editor sizing context
        const view = window.editor.getView();
        if (view) {
          view.requestMeasure();
        }
      }

      wysiwymTab.addEventListener('click', () => activateTab('wysiwym'));
      markdownTab.addEventListener('click', () => activateTab('markdown'));
      previewTab.addEventListener('click', () => activateTab('preview'));
    });
  </script>
</body>

</html>
