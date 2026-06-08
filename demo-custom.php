<?php
/**
 * demo-custom.php
 * A minimal, out-of-the-box Traven Editor integration demo with a dropdown for skins (themes).
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
    $submittedContent = "# Choose a Theme for Traven\n\nThis is a minimal Traven Editor instance running with zero customizations.\n\n* Edit this text to test the WYSIWYM formatting.\n* Bold or italicize words to see delimiters fade in/out.\n* Submit the form below to verify server-side integration.\n\n\n\n";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Traven Editor — Out-of-the-Box Custom Demo</title>
    <meta name="description" content="A basic PHP form demonstrating a default Traven Editor integration with zero custom configuration.">
    <style>
        /* Minimal clean page layout wrapping the editor */
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            background-color: #f8fafc;
            color: #0f172a;
            line-height: 1.5;
        }
        h1 {
            font-size: 2.2rem;
            margin-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        .lead {
            font-size: 1.1rem;
            color: #475569;
            margin-bottom: 24px;
        }
        .status-box {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-weight: 500;
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
            gap: 16px;
        }
        .btn-submit {
            align-self: flex-start;
            background-color: #0f172a;
            color: #ffffff;
            border: none;
            padding: 10px 24px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            border-radius: 4px;
            transition: background-color 0.2s ease;
        }
        .btn-submit:hover {
            background-color: #cc4a0a;
        }
        .output-card {
            margin-top: 40px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .output-card h2 {
            font-size: 1.25rem;
            margin-top: 0;
            margin-bottom: 12px;
            color: #1e293b;
        }
        .output-data {
            background-color: #f1f5f9;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 0.9rem;
            overflow-x: auto;
            border: 1px solid #cbd5e1;
        }
        .demo-controls {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }
        .skin-select {
            appearance: auto;
            background: transparent;
            border: 1px solid #cbd5e1;
            color: #0f172a;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            outline: none;
            transition: background-color 0.2s ease;
        }
        .skin-select:hover {
            background-color: #f1f5f9;
        }
        .btn-toggle {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: transparent;
            border: none;
            color: #0f172a; /* Dark black for ON */
            cursor: pointer;
            padding: 4px 8px;
            font-size: 0.875rem;
            font-weight: 600;
            border-radius: 6px;
            transition: opacity 0.2s ease, background-color 0.2s ease;
        }
        .btn-toggle:hover {
            background-color: #f1f5f9;
        }
        .btn-toggle svg {
            width: 32px;
            height: 32px;
            display: block;
        }
        .btn-toggle.toggle-off {
            opacity: 0.55; /* 55% opacity for OFF state */
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
    </style>
</head>
<body>

    <main>
        <h1 id="demo-page-title">Traven — Custom Out-of-the-Box Demo</h1>
        <p class="lead">
            This page mounts the default custom element <code>&lt;traven-editor&gt;</code> inside a standard HTML form and lets you choose a custom editor skin.
        </p>

        <?php if ($message): ?>
            <div id="status-message" class="status-box <?php echo strpos($message, 'Success') !== false ? 'status-success' : 'status-warning'; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <div class="demo-controls">
            <select id="skin-selector" class="skin-select" title="Choose Editor Skin">
                <option value="skin-starter">Starter Skin (Default)</option>
                <option value="skin-academic">Academic Skin</option>
                <option value="skin-light">Light Skin</option>
                <option value="skin-colorful">Colorful Skin</option>
                <option value="skin-dark">Dark Skin</option>
                <option value="skin-editorial">Editorial Skin</option>
                <option value="skin-modern">Modern Skin</option>
            </select>

            <button type="button" id="btn-toggle-toolbar" class="btn-toggle" title="Toggle Toolbar">
                <!-- Toggle ON (Default) -->
                <svg class="icon-toggle-on" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="16" y="64" width="224" height="128" rx="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="176" cy="128" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                <!-- Toggle OFF -->
                <svg class="icon-toggle-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="16" y="64" width="224" height="128" rx="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="80" cy="128" r="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                <span>Toolbar</span>
            </button>
        </div>

        <!-- Simple POST Form -->
        <form id="simple-editor-form" class="editor-form" action="" method="POST">
            <!-- No configurations/themes passed: uses starter theme and default toolbar -->
            <traven-editor id="traven-default-instance" name="body" toolbar="undo, redo, |, bold, italic, strikethrough, highlight, code, codeblock, |, heading, |, bulletlist, numberedlist, tasklist, blockquote, hr, table, component, figure, |, datetime, search, link, image, video, audio, fullscreen, clear, uppercase, lowercase, capitalize, removeformatting, gotoline, help"><?php echo htmlspecialchars($submittedContent); ?></traven-editor>
            
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

            const toggleBtn = document.getElementById("btn-toggle-toolbar");
            const editorEl = document.getElementById("traven-default-instance");

            const skinSelector = document.getElementById("skin-selector");

            skinSelector.addEventListener("change", (e) => {
                const selectedSkin = e.target.value;
                let skinLink = document.getElementById("editor-skin-link");

                if (selectedSkin === "skin-starter") {
                    // Starter is bundled, so we remove the override link if it exists
                    if (skinLink) {
                        skinLink.remove();
                    }
                } else {
                    // Inject or update the link tag for the selected custom skin
                    if (!skinLink) {
                        skinLink = document.createElement("link");
                        skinLink.id = "editor-skin-link";
                        skinLink.rel = "stylesheet";
                        document.head.appendChild(skinLink);
                    }
                    skinLink.href = `packages/core/assets/skins/${selectedSkin}.css`;
                }
            });

            toggleBtn.addEventListener("click", () => {
                const toolbarEl = editorEl.querySelector(".traven-toolbar-container");
                if (!toolbarEl) {
                    console.warn("Traven toolbar container not found inside editor.");
                    return;
                }

                if (toolbarEl.style.display === "none") {
                    toolbarEl.style.display = "flex";
                    toggleBtn.classList.remove("toggle-off");
                } else {
                    toolbarEl.style.display = "none";
                    toggleBtn.classList.add("toggle-off");
                }
            });
        });
    </script>

    <!-- Load KaTeX globally for LaTeX support -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
</body>
</html>
