<?php
/**
 * demo-toolbars.php
 * A showcase of Traven Editor's multiple toolbars, allowing users to toggle
 * the Top Toolbar, Selection Bubble, and Gutter Insertion Menu individually.
 */

$message = '';
$submittedContent = '';
$isPost = $_SERVER['REQUEST_METHOD'] === 'POST';

if ($isPost) {
    // The custom element name attribute is "body", matching the POST variable name
    $submittedContent = $_POST['body'] ?? '';
    if (!empty(trim($submittedContent))) {
        $message = "Success: Form submitted! Received " . strlen($submittedContent) . " characters.";
    } else {
        $message = "Warning: Editor content was empty.";
    }
} else {
    // Default fallback text on load
    $submittedContent = "# Traven Toolbar Controls Showcase\n\nThis page allows you to toggle each of Traven's three independent toolbars dynamically using the dashboard toggle switches above.\n\n### The Three Core Toolbars:\n\n1. **Main Top Toolbar**: A persistent editor bar at the top of the container. Excellent for comprehensive formatting and structure actions.\n2. **Selection Bubble**: A Medium-style floating tooltip that automatically appears when you select text. Perfect for quick formatting of active selections.\n3. **Gutter Menu**: A margin-based block insertion button (`+`) that appears when hovering over any empty lines. Useful for adding components, figures, codeblocks, or media elements at the exact location of the click.\n\n### Try It Out:\n- Hover over an empty line to see the **Gutter Insertion (+)** indicator.\n- Select any text to trigger the **Selection Bubble**.\n- Use the toggles in the header to instantly add or remove these toolbars!";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Traven Editor — Dynamic Toolbar Customization</title>
    <meta name="description" content="An interactive demo showing how to toggle Traven's Top Toolbar, Selection Bubble, and Gutter Insertion features.">

    <!-- Google Fonts CDN -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Code:wght@400..700&family=Mozilla+Headline:wght@700;800;900&display=swap" rel="stylesheet">

    <!-- Core Styles and Default Toolbar Style -->
    <link rel="stylesheet" href="packages/core/assets/toolbars/toolbar-default.css" id="editor-toolbar-link">
    <link rel="stylesheet" href="packages/core/assets/css/demo.css">

    <style>
        .demo-container {
            max-width: 960px;
            margin: 40px auto;
            padding: 0 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            flex: 1;
        }
        
        .demo-intro {
            text-align: left;
        }
        
        .demo-intro h1 {
            font-family: 'Mozilla Headline', sans-serif;
            font-size: 2.25rem;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
        }
        
        .demo-intro .lead {
            font-size: 1.125rem;
            color: var(--text-secondary);
            margin: 0;
            line-height: 1.6;
        }

        .status-box {
            padding: 14px 18px;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.95rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .status-success {
            background-color: #d1fae5;
            border: 1px solid #10b981;
            color: #065f46;
        }
        .status-warning {
            background-color: #fee2e2;
            border: 1px solid #ef4444;
            color: #991b1b;
        }

        .editor-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .editor-card {
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--border-color);
            background-color: var(--bg-card);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .toolbar-demo-header {
            padding: 16px 24px;
            background-color: #fafafa;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }

        .demo-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .btn-toggle {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            border: 1px solid var(--border-color);
            color: #0f172a;
            cursor: pointer;
            padding: 6px 12px;
            font-size: 0.825rem;
            font-weight: 600;
            border-radius: 8px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .btn-toggle:hover {
            background-color: #f8fafc;
            border-color: #cbd5e1;
        }

        .btn-toggle svg {
            width: 28px;
            height: 28px;
            display: block;
            color: var(--accent);
        }

        .btn-toggle.toggle-off {
            color: #64748b;
            background-color: #f1f5f9;
            opacity: 0.75;
        }

        .btn-toggle.toggle-off svg {
            color: #94a3b8;
        }

        .btn-toggle .icon-toggle-off {
            display: none;
        }
        
        .btn-toggle.toggle-off .icon-toggle-on {
            display: none;
        }
        
        .btn-toggle.toggle-off .icon-toggle-off {
            display: block;
        }

        .editor-mount-wrapper {
            padding: 0;
            min-height: 450px;
            display: flex;
            flex-direction: column;
        }

        traven-editor {
            display: flex;
            flex-direction: column;
            flex: 1;
        }

        .btn-submit {
            align-self: flex-start;
            background-color: #0f172a;
            color: #ffffff;
            border: none;
            padding: 12px 28px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .btn-submit:hover {
            background-color: var(--accent);
            box-shadow: 0 4px 12px rgba(204, 74, 10, 0.2);
        }

        .output-card {
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
            margin-top: 20px;
        }

        .output-card h2 {
            font-family: 'Mozilla Headline', sans-serif;
            font-size: 1.1rem;
            margin-top: 0;
            margin-bottom: 12px;
            color: #1e293b;
        }

        .output-data {
            background-color: #0f172a;
            color: #e2e8f0;
            padding: 16px;
            border-radius: 8px;
            font-family: 'Fira Code', monospace;
            white-space: pre-wrap;
            font-size: 0.875rem;
            overflow-x: auto;
            border: 1px solid #1e293b;
            line-height: 1.6;
        }

        /* --- Toolbar Toggle CSS rules targeting Traven Editor elements --- */
        traven-editor.hide-main-toolbar .traven-hybrid-toolbar {
            display: none !important;
        }
        
        traven-editor.hide-selection-bubble .cm-tooltip {
            display: none !important;
        }
        
        traven-editor.hide-gutter-insertion .cm-traven-gutter {
            display: none !important;
        }
        
        /* Smooth border radius adjustment if the main toolbar is toggled off */
        traven-editor.hide-main-toolbar .cm-editor {
            border-top: none !important;
        }
    </style>
</head>
<body>

    <?php
    include "includes/_customization-dropdowns.php";
    $header_nav_html = $customization_dropdowns_html;
    include "includes/_header.php";
    ?>

    <main class="demo-container">
        <div class="demo-intro">
            <p class="lead">
                Experiment with different editor setups. Enable or disable Traven's three toolbars to find the layout that best fits your content authoring flow.
            </p>
        </div>

        <?php if ($message): ?>
            <div id="status-message" class="status-box <?php echo strpos($message, 'Success') !== false ? 'status-success' : 'status-warning'; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <!-- Simple POST Form -->
        <form id="simple-editor-form" class="editor-form" action="" method="POST">
            <div class="sandbox-card editor-card">
                <div class="card-header toolbar-demo-header">
                    <div class="card-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                          stroke-linecap="round" stroke-linejoin="round" style="stroke: var(--accent)">
                          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                          <polyline points="2 17 12 22 22 17"></polyline>
                          <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                        Workspace Editor
                    </div>
                    
                    <div class="demo-controls">
                        <!-- Main Toolbar Toggle -->
                        <button type="button" id="btn-toggle-main-toolbar" class="btn-toggle" title="Toggle Main Toolbar">
                            <svg class="icon-toggle-on" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="16" y="64" width="224" height="128" rx="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="176" cy="128" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                            <svg class="icon-toggle-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="16" y="64" width="224" height="128" rx="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="80" cy="128" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                            <span>Main Toolbar</span>
                        </button>
                        
                        <!-- Selection Bubble Toggle -->
                        <button type="button" id="btn-toggle-selection-bubble" class="btn-toggle" title="Toggle Selection Bubble">
                            <svg class="icon-toggle-on" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="16" y="64" width="224" height="128" rx="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="176" cy="128" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                            <svg class="icon-toggle-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="16" y="64" width="224" height="128" rx="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="80" cy="128" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                            <span>Selection Bubble</span>
                        </button>
                        
                        <!-- Gutter Insertion Toggle -->
                        <button type="button" id="btn-toggle-gutter-insertion" class="btn-toggle" title="Toggle Gutter Insertion">
                            <svg class="icon-toggle-on" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="16" y="64" width="224" height="128" rx="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="176" cy="128" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                            <svg class="icon-toggle-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="16" y="64" width="224" height="128" rx="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="80" cy="128" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                            <span>Gutter Menu</span>
                        </button>
                    </div>
                </div>
                
                <div class="editor-mount-wrapper">
                    <!-- Initializes with hybrid layout to support all three types of toolbars natively -->
                    <traven-editor id="traven-default-instance" name="body" toolbar-mode="hybrid" toolbar><?php echo htmlspecialchars($submittedContent); ?></traven-editor>
                </div>
            </div>
            
            <button type="submit" id="btn-submit-form" class="btn-submit">Submit Form</button>
        </form>

        <!-- Preview Received Content -->
        <?php if ($isPost): ?>
            <div id="form-output-preview" class="output-card">
                <h2>Raw Markdown Received by Server ($_POST['body']):</h2>
                <div class="output-data"><?php echo htmlspecialchars($submittedContent); ?></div>
            </div>
        <?php endif; ?>
    </main>

    <!-- Load the Traven Editor Web Component module -->
    <script type="module">
        import { TravenEditor } from "./packages/core/dist/traven.js";

        document.addEventListener("DOMContentLoaded", () => {
            // Enable Mermaid rendering support
            TravenEditor.configureMermaid(true);

            const editorEl = document.getElementById("traven-default-instance");
            
            // Simulate async image upload
            const mockImageUpload = async (file) => {
                console.log("Mock uploading file:", file.name);
                await new Promise(resolve => setTimeout(resolve, 1500));
                return URL.createObjectURL(file);
            };
            editorEl.onUploadImage = mockImageUpload;

            const btnToggleMain = document.getElementById("btn-toggle-main-toolbar");
            const btnToggleBubble = document.getElementById("btn-toggle-selection-bubble");
            const btnToggleGutter = document.getElementById("btn-toggle-gutter-insertion");

            // 1. Read initial states from localStorage or default to true
            let mainToolbarVisible = localStorage.getItem('traven-demo-main-toolbar') !== 'false';
            let selectionBubbleVisible = localStorage.getItem('traven-demo-selection-bubble') !== 'false';
            let gutterInsertionVisible = localStorage.getItem('traven-demo-gutter-insertion') !== 'false';

            // 2. Helper to apply visibility class and update toggle button state
            function applyState(element, button, className, isVisible, storageKey) {
                if (isVisible) {
                    element.classList.remove(className);
                    button.classList.remove("toggle-off");
                } else {
                    element.classList.add(className);
                    button.classList.add("toggle-off");
                }
                localStorage.setItem(storageKey, isVisible);
            }

            // 3. Initial application on page load
            applyState(editorEl, btnToggleMain, "hide-main-toolbar", mainToolbarVisible, "traven-demo-main-toolbar");
            applyState(editorEl, btnToggleBubble, "hide-selection-bubble", selectionBubbleVisible, "traven-demo-selection-bubble");
            applyState(editorEl, btnToggleGutter, "hide-gutter-insertion", gutterInsertionVisible, "traven-demo-gutter-insertion");

            // 4. Attach event listeners
            btnToggleMain.addEventListener("click", () => {
                mainToolbarVisible = !mainToolbarVisible;
                applyState(editorEl, btnToggleMain, "hide-main-toolbar", mainToolbarVisible, "traven-demo-main-toolbar");
            });

            btnToggleBubble.addEventListener("click", () => {
                selectionBubbleVisible = !selectionBubbleVisible;
                applyState(editorEl, btnToggleBubble, "hide-selection-bubble", selectionBubbleVisible, "traven-demo-selection-bubble");
            });

            btnToggleGutter.addEventListener("click", () => {
                gutterInsertionVisible = !gutterInsertionVisible;
                applyState(editorEl, btnToggleGutter, "hide-gutter-insertion", gutterInsertionVisible, "traven-demo-gutter-insertion");
            });
        });
    </script>

    <!-- Load KaTeX globally for LaTeX math support -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
</body>
</html>
