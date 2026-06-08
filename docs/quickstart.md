# Quick Start

Add Traven to a PHP form or regular HTML page in three steps.

---

### Step 1 — Replace your textarea

Inside your form, swap `<textarea>` for `<traven-editor>`. To show the editor with the default toolbar, add the `toolbar` attribute.

```html
<form action="save.php" method="POST">

  <!-- Before: <textarea name="content">Write something...</textarea> -->
  <traven-editor name="content" toolbar>Write something...</traven-editor>

  <button type="submit">Save</button>
</form>
```

> [!NOTE]
> Displaying Traven without a toolbar is supported by design. If you want a minimalist writing space without a toolbar, simply remove the `toolbar` attribute from `<traven-editor>`. You can also customize the available actions by passing a comma-separated list of tool names (e.g., `toolbar="bold, italic, link, image"`).

---

### Step 2 — Load Traven in 1 line

Add this one line before the closing `</body>` tag.

```html
  <script type="module" src="https://cdn.jsdelivr.net/gh/slpstream/traven@v0.2.6/dist/traven.js"></script>
</body>
```

---

### Step 3 — Read it in PHP

In `save.php`, or any other file that processes your form, just read the content exactly like any other form field:

```php
$content = $_POST['content'] ?? '';
```

Traven submits like a standard textarea, so nothing in your existing PHP needs to change.
