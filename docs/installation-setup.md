# Installation & Setup

Traven is framework-agnostic and has zero peer dependencies. You can easily integrate it into your projects by directly including the compiled assets.

## 1. Direct Include (Recommended for CMSs)

Copy `dist/traven.js` and your preferred skin stylesheet (from `assets/skins/`) into your host project directory, and include them:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Traven Integration</title>
  
  <!-- Load the stylesheet skin -->
  <link rel="stylesheet" href="assets/skins/skin-default.css">
  <link rel="stylesheet" href="assets/toolbars/toolbar-default.css">
</head>
<body>

  <!-- Parent containers for mounting -->
  <div class="editor-container">
    <div id="editor-mount"></div>
  </div>

  <script type="module">
    import { TravenEditor } from "./dist/traven.js";

    // Defer initialization until fonts are ready for CodeMirror coordinate caching
    document.fonts.ready.then(() => {
      const editor = new TravenEditor({
        element: document.getElementById("editor-mount"),
        initialValue: "# Hello Traven\n\nEdit **this bold text** to see delimiters appear!",
        lineNumbers: true
      });
    });
  </script>
</body>
</html>
```
