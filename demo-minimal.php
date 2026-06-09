<?php
$content = $_POST['content'] ?? '**Unstyled and minimal, edit this text and write anything here...** The toolbar above is the full set: you can exclude it, or configure it to show only the buttons you need, or you can mix-n-match between 3 toolbars. There is the toolbar you see here, a Medium-like bubble bar that is context aware, and an insert toolbar that appears in the gutter. Use none, or any combination of the three.';
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
      align-self: flex-start;
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
  </style>
</head>
<body>


  <!-- Step 1 — Replace your textarea -->
  <form action="" method="POST">
    <traven-editor name="content" toolbar><?php echo htmlspecialchars($content); ?></traven-editor>
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
</body>
</html>
