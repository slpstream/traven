<?php
// Step 3 — Read it in PHP
$content = $_POST['content'] ?? 'Write something...';
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

  <h1>Traven Minimal Demo</h1>

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
  <script type="module" src="https://cdn.jsdelivr.net/gh/slpstream/traven/dist/traven.js"></script>
</body>
</html>
