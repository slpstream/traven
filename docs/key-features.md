# Key Features

Traven Editor includes a variety of advanced, built-in features that make it a robust and flexible choice for modern content editing:

*   **WYSIWYM Collapsing**: Formatting syntax markers (like `**` for bold and `*` for italic) display dynamically only when the cursor is inside the formatted text. When the cursor leaves, they transition smoothly into clean, styled blocks.
*   **Optimistic Media Uploads**: Drag and drop or paste image files directly into the editor. The view immediately embeds an optimistic spinner loader and replaces it with the final URL once your upload handler resolves.
*   **Decoupled Styling (Skins)**: Theme aesthetics (colors, padding, borders) are decoupled from the JavaScript logic. Swap between the neutral **Default Skin** and optional skins such as a **Dark Skin** and a contemporary **Colorful Skin** by changing a single `<link>` stylesheet, with no rebuilding required.
*   **Custom Shortcode System**: Built-in support for modular `[image]`, `[video]`, `[audio]`, `[figure]`, and nested block `[component]` shortcodes (with blockquote, pullquote, info, warning, highlight, and youtube aliases). These automatically fold into WYSIWYM interactive widgets inside the editor while compiling into clean semantic HTML structure.
*   **Bidirectional Raw Sync**: Easily bind a secondary raw Markdown viewer/editor in split-screen layouts. Changes flow incrementally between editors, maintaining cursor positions and separate histories without circular synchronization loops.
*   **Smart Keyboard Utilities**: Includes keyboard helpers that prevent cursors from getting trapped inside collapsed markdown delimiters during arrow navigation.
*   **Vim Emulation Mode**: Toggleable Vim normal/visual/insert mode keybindings dynamically at runtime.
*   **Real-Time Statistics**: Out-of-the-box support for tracking words, characters, and estimated reading times with statistics update event listeners.
*   **Dynamic HTML Preview Rendering**: Features a compilation hook for registering custom Markdown renderers to generate structural, skin-synced HTML previews.
*   **LaTeX Math Rendering**: Native support for inline (`$ ... $`) and display (`$$ ... $$`) LaTeX equations. Math is dynamically parsed via custom Lezer syntax extensions and rendered asynchronously using KaTeX (supporting pre-loaded global instances, locally-hosted files, or optional CDN assets). Delimiters collapse gracefully, and equations automatically update in both the WYSIWYM editing canvas and the fallback HTML preview.
*   **Zero Peer Dependencies**: Bundles CodeMirror and Vim emulation modules internally using `esbuild`. Simply drop in the compiled script and a stylesheet to start editing.
