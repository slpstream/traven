# Plain PHP Helpers

If you are building a lightweight project without a major framework, you can use simple PHP helper functions to quickly drop the Traven editor into any form.

## 1. Define the Helpers

Create a `helpers.php` (or similar include file) to store the render functions. These functions ensure your Markdown content is safely escaped for HTML output.

```php
<?php
// includes/traven_helpers.php

/**
 * Renders the <traven-editor> Web Component.
 * 
 * @param string $name The name attribute for the form submission
 * @param string $initialContent The raw Markdown to populate the editor with
 */
function traven_editor(string $name = 'body', string $initialContent = '') {
    $escapedName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $escapedContent = htmlspecialchars($initialContent, ENT_NOQUOTES, 'UTF-8');
    
    echo "<traven-editor name=\"{$escapedName}\">\n{$escapedContent}\n</traven-editor>";
}

/**
 * Renders the required Traven script tag.
 */
function traven_scripts() {
    echo '<script type="module" src="https://cdn.jsdelivr.net/gh/slpstream/traven@v0.2.7/dist/traven.js"></script>';
}
```

## 2. Implement the Form

Include the helpers in your view and drop them into a standard HTML form (for example, a comment-submission box):

```php
<?php
// post-comment.php
require_once 'includes/traven_helpers.php';

// If editing an existing comment, you would pull this from the database
$existingMarkdown = "I think this is a **great** idea!";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Submit a Comment</title>
</head>
<body>

    <form action="save-comment.php" method="POST">
        <h2>Leave a comment</h2>
        
        <label for="author_name">Name:</label>
        <input type="text" id="author_name" name="author_name" required>

        <label>Your Comment (Markdown Supported):</label>
        <?php traven_editor('comment_body', $existingMarkdown); ?>

        <button type="submit">Post Comment</button>
    </form>

    <!-- Drop the script at the bottom of the page -->
    <?php traven_scripts(); ?>

</body>
</html>
```

## 3. Process the Submission

When the form is submitted, the Markdown is automatically included in the standard `$_POST` superglobal via Traven's hidden textarea fallback.

```php
<?php
// save-comment.php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Retrieve the raw Markdown directly from $_POST
    $authorName = $_POST['author_name'] ?? 'Anonymous';
    $commentMarkdown = $_POST['comment_body'] ?? '';

    if (empty(trim($commentMarkdown))) {
        die("Comment cannot be empty!");
    }

    // Save $commentMarkdown to the database...
    echo "Saved comment from " . htmlspecialchars($authorName) . "!";
}
```
