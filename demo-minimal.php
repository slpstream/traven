<?php
$content = $_POST['content'] ?? '**Unstyled and minimal, edit this text and write anything here...** The toolbar above is the full set: you can exclude it, or configure it to contain only the buttons you need.';
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traven Minimal Demo</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 0 20px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    button {
      align-self: flex-end;
      padding: 8px 16px;
      cursor: pointer;
    }

    .preview {
      margin-top: 30px;
      padding: 15px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .traven-toolbar-stats {
      display: none !important;
    }
  </style>
</head>

<body>

  <a href="index.php"
    style="font-family: sans-serif; font-size: 0.85rem; color: #cc4a0a; text-decoration: none; display: inline-block; margin-bottom: 15px;">&larr;
    Back</a>

  <!-- Step 1 — Replace your textarea -->
  <form action="" method="POST">
    <traven-editor name="content" toolbar-mode="hybrid"
      toolbar><?php echo htmlspecialchars($content); ?></traven-editor>
    <button type="submit">Save</button>
  </form>

  <?php if ($_SERVER['REQUEST_METHOD'] === 'POST'): ?>
    <div class="preview">
      <h3>Submitted Markdown:</h3>
      <pre><?php echo htmlspecialchars($content); ?></pre>
    </div>
  <?php endif; ?>

  <!-- Step 2 — Load Traven in 1 line -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@latest/dist/traven.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const editorEl = document.querySelector("traven-editor");
      if (editorEl) {
        editorEl.onUploadImage = async (file) => {
          console.log("Mock uploading file:", file.name);
          await new Promise(resolve => setTimeout(resolve, 1500));
          return URL.createObjectURL(file);
        };
      }
    });
  </script>
</body>

</html>
