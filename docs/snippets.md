# Custom Snippets

Traven includes a built-in Custom Snippets manager that allows you to save and instantly insert reusable text blocks, boilerplate code, or Markdown templates directly from the editor toolbar.

## Features

- **Global Snippet Library:** Snippets are saved to your browser's local storage (`localStorage`). This means any snippet you create is available across all documents and sessions within the same browser.
- **Dynamic Dropdown Menu:** Your saved snippets appear in a convenient dropdown menu in the Traven toolbar.
- **Inline Editor:** Easily manage your snippets using the built-in modal interface without leaving the editor.

## Using Custom Snippets

### Inserting a Snippet

1. Locate the **Custom Snippets** icon (the Phosphor Lego brick `{...}`) in the main formatting toolbar.
2. Click the icon to reveal a dropdown menu listing all your saved snippets.
3. Select a snippet from the list.
4. The snippet's content will be inserted at your cursor's current position. 
   - *Note:* If you have text currently selected, inserting a snippet will **replace** your selection.

### Managing Snippets

To create, edit, or delete snippets, you use the Snippet Management Modal:

1. Click the Custom Snippets icon in the toolbar.
2. Select **Manage Snippets…** from the bottom of the dropdown menu. (If you have no snippets saved yet, clicking the toolbar icon will open the management modal directly).
3. The modal provides a clean interface to view your snippet library.

#### Adding a New Snippet

1. In the management modal, click **+ Add Snippet**.
2. Enter a descriptive **Name** (e.g., "Email Signature", "HTML Boilerplate", "Alert Box"). This name will appear in your toolbar dropdown.
3. Enter the **Content**. This can be plain text, Markdown, HTML, or any other content you frequently use.
4. Click **Save Snippet**. Your new snippet is instantly available in the toolbar.

#### Editing an Existing Snippet

1. Locate the snippet you want to change in the management list.
2. Click the **Edit** (pencil) icon next to its name.
3. Modify the Name or Content as needed.
4. Click **Save Snippet** to apply your changes.

#### Deleting a Snippet

1. Locate the snippet you want to remove in the management list.
2. Click the **Delete** (trash can) icon next to its name.
3. Confirm the deletion when prompted. The snippet will be permanently removed from your library.

## Advanced Usage & Integration

Because Custom Snippets insert plain text directly into the editor, they can be highly versatile:

- **Template Tags & Shortcodes:** If the application hosting Traven processes template tags (like Twig, Liquid, or Blade) or shortcodes, you can save these tags as snippets. For example, saving `{{ user.signature }}` or `[contact-form id="1"]`.
- **Markdown Structures:** Save complex Markdown structures you use often, such as advanced tables, multi-level lists, or frontmatter boilerplate.
- **HTML Components:** If you frequently inject custom HTML (like a specific div structure for styling), save the raw HTML as a snippet for quick insertion.

> [!WARNING]
> **Security Caveat**: Traven does **not** sanitize HTML output. Since snippets can contain raw HTML, any HTML inserted via a snippet will be rendered unescaped in the final HTML output. If you are rendering untrusted or user-submitted Markdown, you must run the resulting HTML through a secure HTML sanitizer library (e.g., `DOMPurify`) before injecting it into the page.

Snippets are stored locally in the browser (`traven-snippets` key).
