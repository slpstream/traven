import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TravenEditor } from '../src/index.js';
import { parseMarkdownTable, serializeTableToMarkdown, openComponentModal } from '../src/toolbar/modal.js';
import { skipDelimiter } from '../src/delimiter-skip.js';

// Polyfill Range.prototype.getClientRects and getBoundingClientRect for JSDOM / CodeMirror 6 compatibility
if (typeof window !== 'undefined') {
  window.Range.prototype.getClientRects = function() {
    return {
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {}
    };
  };
  window.Range.prototype.getBoundingClientRect = function() {
    return {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0
    };
  };

  window.katex = {
    renderToString: (math, opts) => {
      const tag = opts && opts.displayMode ? 'div' : 'span';
      const mode = opts && opts.displayMode ? 'display' : 'inline';
      return `<${tag} class="katex-${mode}-mocked">${math}</${tag}>`;
    }
  };
}

describe('TravenEditor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('can be instantiated', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Hello World',
    });
    expect(editor).toBeDefined();
    expect(editor.getValue()).toBe('Hello World');
  });

  it('can focus the editor programmatically', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Focus Test',
    });
    editor.focus();
    expect(document.activeElement).toBe(editor.getView().contentDOM);
  });

  it('can set and get values', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Start',
    });
    editor.setValue('Updated Content');
    expect(editor.getValue()).toBe('Updated Content');
  });

  it('can toggle read-only mode dynamically', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Read Only Test',
      readOnly: false,
    });
    
    expect(editor.isReadOnly()).toBe(false);

    editor.setReadOnly(true);
    expect(editor.isReadOnly()).toBe(true);

    editor.setReadOnly(false);
    expect(editor.isReadOnly()).toBe(false);
  });

  it('correctly tracks document stats', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'One two three four words.',
    });
    expect(editor.getCharacterCount()).toBe(25);
    expect(editor.getWordCount()).toBe(5);
    expect(editor.getReadTime()).toBe(1);
  });

  it('can get and set selection range', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select this text',
    });
    editor.setSelection(7, 11);
    expect(editor.getSelection()).toBe('this');
  });

  it('can manipulate text casing', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'hello world',
    });
    
    editor.setSelection(0, 5);
    editor.toUpperCase();
    expect(editor.getValue()).toBe('HELLO world');

    editor.setSelection(0, 11);
    editor.toLowerCase();
    expect(editor.getValue()).toBe('hello world');

    editor.setSelection(0, 11);
    editor.capitalizeWords();
    expect(editor.getValue()).toBe('Hello World');
  });

  it('can strip markdown formatting with removeFormatting()', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '### Hello **World** with `code`, ~~strike~~ and ==highlight==',
    });

    // Select the whole document to strip formatting
    editor.setSelection(0, editor.getValue().length);
    editor.removeFormatting();
    expect(editor.getValue()).toBe('Hello World with code, strike and highlight');
  });

  describe('frontmatter handling', () => {
    it('strips YAML frontmatter correctly in fallback renderer', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '---\ntitle: test\n---\n# Hello World',
      });
      const html = editor.getContentHtml();
      expect(html).toContain('<h1>Hello World</h1>');
      expect(html).not.toContain('title: test');
      expect(html).not.toContain('---');
    });

    it('strips YAML frontmatter with CRLF line endings correctly', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '---\r\ntitle: test\r\n---\r\n# Hello World',
      });
      const html = editor.getContentHtml();
      expect(html).toContain('<h1>Hello World</h1>');
      expect(html).not.toContain('title: test');
    });

    it('does not strip horizontal rules at start of document', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '---\n# Hello World',
      });
      const html = editor.getContentHtml();
      expect(html).toContain('<hr>');
      expect(html).toContain('<h1>Hello World</h1>');
    });

    it('strips frontmatter even if a value contains three dashes', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '---\ndescription: "a --- b"\n---\n# Hello World',
      });
      const html = editor.getContentHtml();
      expect(html).toContain('<h1>Hello World</h1>');
      expect(html).not.toContain('description');
    });

    it('returns full content when no frontmatter is present', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '# Hello World',
      });
      const html = editor.getContentHtml();
      expect(html).toBe('<h1>Hello World</h1>');
    });

    it('does not apply frontmatter styling to a heading immediately following frontmatter without a blank line', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '---\ntitle: test\n---\n# Heading',
      });
      // Move cursor to the end of the document to trigger collapsed decorations
      editor.setSelection(editor.getValue().length, editor.getValue().length);
      
      const lines = container.querySelectorAll('.cm-line');
      // The 4th line (index 3) should be the heading line
      const headingLine = lines[3];
      expect(headingLine).toBeDefined();
      expect(headingLine.classList.contains('cm-wysiwym-h1')).toBe(true);
      expect(headingLine.classList.contains('cm-wysiwym-frontmatter')).toBe(false);
    });
  });

  describe('list formatting', () => {
    it('toggles off star-based unordered lists', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '* item',
      });
      editor.insertList('ul');
      expect(editor.getValue()).toBe('item');
    });

    it('toggles off plus-based unordered lists', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '+ item',
      });
      editor.insertList('ul');
      expect(editor.getValue()).toBe('item');
    });

    it('toggles off unordered list preserving indentation', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '  - item',
      });
      editor.insertList('ul');
      expect(editor.getValue()).toBe('  item');
    });

    it('toggles task checkbox via click/mousedown', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '  - [x] done\nsecond line',
      });
      editor.focus();
      editor.setSelection(15, 15);
      
      const checkbox = container.querySelector('input[type="checkbox"]');
      expect(checkbox).not.toBeNull();
      expect(checkbox.checked).toBe(true);
      
      const event = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
      checkbox.dispatchEvent(event);
      
      expect(editor.getValue()).toBe('  - [ ] done\nsecond line');
    });

    it('converts task list to unordered list by stripping checkbox', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '- [x] done',
      });
      editor.insertList('ul');
      expect(editor.getValue()).toBe('- done');
    });

    it('does not format or toggle list items inside fenced code blocks', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '```\n- code\n```',
      });
      const pos = editor.getValue().indexOf('- code') + 1;
      editor.setSelection(pos, pos);
      editor.insertList('ul');
      expect(editor.getValue()).toBe('```\n- code\n```');
    });

    it('toggles list items nested in blockquotes preserving the quote prefix', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '> - item',
      });
      editor.insertList('ul');
      expect(editor.getValue()).toBe('> item');
    });

    it('formats multi-line selection as an ordered list with running counters', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '- apple\nbanana\n- cherry',
      });
      editor.setSelection(0, editor.getValue().length);
      editor.insertList('ol');
      expect(editor.getValue()).toBe('1. apple\n2. banana\n3. cherry');
    });

    it('does not strip negative numbers when inserting list', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '-3.14 text',
      });
      editor.setSelection(0, editor.getValue().length);
      editor.insertList('ol');
      expect(editor.getValue()).toBe('1. -3.14 text');
    });

    it('removes list formatting completely, including nested and indented markers', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '  - [ ] task\n  - item\n  1. ordered',
      });
      editor.setSelection(0, editor.getValue().length);
      editor.removeFormatting();
      expect(editor.getValue()).toBe('task\nitem\nordered');
    });

    it('removes list formatting correctly in partial selections', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '  - [ ] task',
      });
      const start = editor.getValue().indexOf('task');
      editor.setSelection(start, editor.getValue().length);
      editor.removeFormatting();
      expect(editor.getValue()).toBe('  - [ ] task');
    });

    it('removes list formatting nested inside blockquotes completely', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: '> - item',
      });
      editor.setSelection(0, editor.getValue().length);
      editor.removeFormatting();
      expect(editor.getValue()).toBe('item');
    });
  });
});

describe('parseMarkdownTable', () => {
  it('parses a basic markdown table correctly', () => {
    const tableText = [
      '| Col 1 | Col 2 |',
      '|-------|-------|',
      '| Val 1 | Val 2 |',
      '| Val 3 | Val 4 |'
    ].join('\n');

    const result = parseMarkdownTable(tableText);
    expect(result).not.toBeNull();
    expect(result.headers).toEqual(['Col 1', 'Col 2']);
    expect(result.rows).toEqual([
      ['Val 1', 'Val 2'],
      ['Val 3', 'Val 4']
    ]);
  });

  it('parses alignments correctly', () => {
    const tableText = [
      '| Left | Center | Right | Default |',
      '| :--- | :---:  |  ---: | ------- |',
      '| a    | b      | c     | d       |'
    ].join('\n');

    const result = parseMarkdownTable(tableText);
    expect(result).not.toBeNull();
    expect(result.alignments).toEqual(['left', 'center', 'right', 'left']);
  });

  it('un-escapes pipe characters correctly and keeps cell boundaries intact', () => {
    const tableText = [
      '| Col 1 | Col 2 |',
      '|-------|-------|',
      '| a \\| b | c |'
    ].join('\n');

    const result = parseMarkdownTable(tableText);
    expect(result).not.toBeNull();
    expect(result.headers).toEqual(['Col 1', 'Col 2']);
    expect(result.rows).toEqual([
      ['a | b', 'c']
    ]);
  });

  it('returns null for invalid tables', () => {
    expect(parseMarkdownTable('')).toBeNull();
    expect(parseMarkdownTable('just a plain line')).toBeNull();
    expect(parseMarkdownTable('| header |\n| no dashes |')).toBeNull();
  });
});

describe('serializeTableToMarkdown', () => {
  it('serializes table structured data into a pipe-aligned string', () => {
    const headers = ['A', 'B'];
    const rows = [['1', '2'], ['3', '4']];
    const alignments = [null, null];

    const result = serializeTableToMarkdown(headers, rows, alignments);
    expect(result).toBe(
      '| A   | B   |\n' +
      '|-----|-----|\n' +
      '| 1   | 2   |\n' +
      '| 3   | 4   |'
    );
  });

  it('handles alignments in serialization correctly', () => {
    const headers = ['L', 'C', 'R'];
    const rows = [['a', 'b', 'c']];
    const alignments = ['left', 'center', 'right'];

    const result = serializeTableToMarkdown(headers, rows, alignments);
    expect(result).toBe(
      '| L   | C   | R   |\n' +
      '|:----|:---:|----:|\n' +
      '| a   | b   | c   |'
    );
  });

  it('escapes pipe characters in cells during serialization', () => {
    const headers = ['A', 'B'];
    const rows = [['a | b', 'c']];

    const result = serializeTableToMarkdown(headers, rows);
    expect(result).toBe(
      '| A      | B   |\n' +
      '|--------|-----|\n' +
      '| a \\| b | c   |'
    );
  });
});

describe('ImageShortcode', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('compiles shortcode to proper HTML in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[image src="https://example.com/pic.jpg" align="right" size="medium" caption="My caption"]',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<figure class="traven-image-figure align-right size-medium">');
    expect(html).toContain('<img src="https://example.com/pic.jpg" alt="My caption" class="traven-image-shortcode">');
    expect(html).toContain('<figcaption class="traven-image-caption">My caption</figcaption>');
  });

  it('compiles standard Markdown image to HTML styled like shortcode in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '![Alt Text](https://example.com/pic.jpg)',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<img src="https://example.com/pic.jpg"');
    expect(html).toContain('alt="Alt Text"');
    expect(html).toContain('class="traven-image-shortcode align-center size-medium"');
  });

  it('handles single quoted and unquoted attributes correctly', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: "[image src='https://example.com/pic.jpg' align=left size='small' caption='Single quotes']",
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<figure class="traven-image-figure align-left size-small">');
    expect(html).toContain('<img src="https://example.com/pic.jpg" alt="Single quotes" class="traven-image-shortcode">');
    expect(html).toContain('<figcaption class="traven-image-caption">Single quotes</figcaption>');
  });

  it('compiles shortcode without caption to HTML without figure wrapper in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[image src="https://example.com/pic.jpg" align="right" size="medium"]',
    });
    const html = editor.getContentHtml();
    expect(html).not.toContain('<figure');
    expect(html).toContain('<img src="https://example.com/pic.jpg" alt="" class="traven-image-shortcode align-right size-medium">');
  });

  it('renders ImageShortcodeWidget inside WYSIWYM editor when cursor is outside', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[image src="https://example.com/pic.jpg" align="center" size="large" caption="WYSIWYM check"]\nSome text here',
    });
    // Set selection cursor to the very end of the document, outside the shortcode
    editor.setSelection(editor.getValue().length, editor.getValue().length);
    
    // Check if the shortcode container widget is rendered
    const widgetEl = container.querySelector('.cm-wysiwym-image-shortcode-container');
    expect(widgetEl).not.toBeNull();
    expect(widgetEl.classList.contains('align-center')).toBe(true);
    expect(widgetEl.classList.contains('size-large')).toBe(true);
    
    // Center alignment hides all badges
    const badge = widgetEl.querySelector('.tag-name');
    expect(badge).toBeNull();
    
    // Native tooltip contains the raw shortcode
    expect(widgetEl.title).toBe('[image src="https://example.com/pic.jpg" align="center" size="large" caption="WYSIWYM check"]');
    
    const captionEl = widgetEl.querySelector('.meta-caption');
    expect(captionEl).not.toBeNull();
    expect(captionEl.textContent).toBe('WYSIWYM check');
  });

  it('compiles shortcode with explicit alt, class and custom attributes, and defaults align and size', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[image src="https://example.com/pic.jpg" alt="Custom Alt" class="my-custom-class shadow-md"]',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<img src="https://example.com/pic.jpg"');
    expect(html).toContain('alt="Custom Alt"');
    expect(html).toContain('class="traven-image-shortcode align-center size-medium my-custom-class shadow-md"');
  });

  it('renders ImageShortcodeWidget with custom class and uploading state inside WYSIWYM', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[image src="https://example.com/pic.jpg" align="left" size="small" class="custom-wysiwym-style"]\n[image alt="Uploading photo.jpg..."]\nSome text',
    });
    editor.setSelection(editor.getValue().length, editor.getValue().length);

    const activeWidget = container.querySelector('.cm-wysiwym-image-shortcode-container');
    expect(activeWidget).not.toBeNull();
    expect(activeWidget.classList.contains('custom-wysiwym-style')).toBe(true);

    // Verify edit icon is present
    const editIcon = activeWidget.querySelector('.image-edit-icon');
    expect(editIcon).not.toBeNull();

    // Verify that the alignment badge (e.g. left) is NOT present
    const alignBadge = activeWidget.querySelector('.align-badge');
    expect(alignBadge).toBeNull();

    const uploadingWidget = container.querySelector('.cm-wysiwym-image-uploading');
    expect(uploadingWidget).not.toBeNull();
    expect(uploadingWidget.textContent).toContain('Uploading photo.jpg...');
  });

  it('opens editing modal when clicking ImageShortcodeWidget, and saving updates document', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[image src="https://example.com/pic.jpg" align="right" size="medium" caption="My caption"]\nSome text',
    });
    // Set cursor outside the image so the widget renders
    editor.setSelection(editor.getValue().length, editor.getValue().length);

    const widgetEl = container.querySelector('.cm-wysiwym-image-shortcode-container');
    expect(widgetEl).not.toBeNull();

    // Dispatch mousedown on widget
    const event = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    widgetEl.dispatchEvent(event);

    // Verify modal has opened
    const modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();
    expect(modal.querySelector('.traven-modal-title').textContent).toBe('Edit Image');

    // Verify fields are pre-filled
    const altInput = modal.querySelector('#traven-image-alt');
    const urlInput = modal.querySelector('#traven-image-url');
    const alignSelect = modal.querySelector('#traven-image-align');
    const sizeSelect = modal.querySelector('#traven-image-size');
    const captionInput = modal.querySelector('#traven-image-caption');

    expect(urlInput.value).toBe('https://example.com/pic.jpg');
    expect(alignSelect.value).toBe('right');
    expect(sizeSelect.value).toBe('medium');
    expect(captionInput.value).toBe('My caption');

    // Change something in the modal
    altInput.value = 'New Alt';
    alignSelect.value = 'left';

    // Click "Save"
    const saveBtn = modal.querySelector('.traven-modal-btn.btn-primary');
    expect(saveBtn.textContent).toBe('Save');
    saveBtn.click();

    // Verify modal is closed
    expect(document.querySelector('.traven-modal-overlay')).toBeNull();

    // Verify value is updated in editor
    expect(editor.getValue()).toBe('[image src="https://example.com/pic.jpg" align="left" size="medium" alt="New Alt" caption="My caption"]\nSome text');

    // Verify focus is restored to editor
    expect(document.activeElement).toBe(editor.getView().contentDOM);
  });

  it('opens editing modal when clicking standard ImageWidget, and saving updates document', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '![Alt Text](https://example.com/pic.jpg)\nSome text',
    });
    // Set cursor outside the image so the widget renders
    editor.setSelection(editor.getValue().length, editor.getValue().length);

    const widgetEl = container.querySelector('.cm-wysiwym-image-widget-container');
    expect(widgetEl).not.toBeNull();

    // Dispatch mousedown on widget
    const event = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    widgetEl.dispatchEvent(event);

    // Verify modal has opened
    const modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();
    expect(modal.querySelector('.traven-modal-title').textContent).toBe('Edit Image');

    // Verify fields are pre-filled
    const altInput = modal.querySelector('#traven-image-alt');
    const urlInput = modal.querySelector('#traven-image-url');

    expect(urlInput.value).toBe('https://example.com/pic.jpg');
    expect(altInput.value).toBe('Alt Text');

    // Change Alt Text and toggle to advanced settings
    altInput.value = 'New Alt Text';
    
    // Toggle advanced mode by clicking toggle button
    const toggleBtn = modal.querySelector('.traven-modal-toggle-btn');
    expect(toggleBtn).not.toBeNull();
    toggleBtn.click(); // clicks to enable advanced mode

    const alignSelect = modal.querySelector('#traven-image-align');
    alignSelect.value = 'left';

    // Click "Save"
    const saveBtn = modal.querySelector('.traven-modal-btn.btn-primary');
    saveBtn.click();

    // Verify value is updated in editor to advanced shortcode format since we toggled it
    expect(editor.getValue()).toBe('[image src="https://example.com/pic.jpg" align="left" alt="New Alt Text"]\nSome text');
  });

  it('populated URL renders thumbnail preview, hides prompt, and clicking remove clears it', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '![Alt Text](https://example.com/pic.jpg)\nSome text',
      onUploadImage: async (file) => 'https://example.com/' + file.name,
    });
    editor.setSelection(editor.getValue().length, editor.getValue().length);

    const widgetEl = container.querySelector('.cm-wysiwym-image-widget-container');
    expect(widgetEl).not.toBeNull();

    widgetEl.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));

    const modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();

    const urlInput = modal.querySelector('#traven-image-url');
    const dropzone = modal.querySelector('.traven-modal-dropzone');
    const promptEl = modal.querySelector('.traven-modal-dropzone-prompt');
    const previewEl = modal.querySelector('.traven-modal-dropzone-preview');
    const thumbImg = modal.querySelector('.traven-modal-thumb');
    const removeBtn = modal.querySelector('.traven-modal-remove-btn');

    expect(urlInput.value).toBe('https://example.com/pic.jpg');
    expect(promptEl.style.display).toBe('none');
    expect(previewEl.style.display).toBe('flex');
    expect(dropzone.classList.contains('has-file')).toBe(true);
    expect(thumbImg.src).toBe('https://example.com/pic.jpg');

    const fileSizeEl = modal.querySelector('.traven-modal-file-size');
    expect(fileSizeEl.textContent).toBe('https://example.com/pic.jpg');

    const urlField = urlInput.closest('.traven-modal-field');
    expect(urlField.style.display).toBe('none');

    const fileLabel = Array.from(modal.querySelectorAll('.traven-modal-label')).find(el => el.textContent === 'Or Upload a File');
    expect(fileLabel).not.toBeNull();
    expect(fileLabel.style.display).toBe('none');

    removeBtn.click();

    expect(urlInput.value).toBe('');
    expect(promptEl.style.display).toBe('flex');
    expect(previewEl.style.display).toBe('none');
    expect(dropzone.classList.contains('has-file')).toBe(false);
    expect(thumbImg.getAttribute('src') || '').toBe('');

    expect(urlField.style.display).toBe('');
    expect(fileLabel.style.display).toBe('');

    urlInput.value = 'https://example.com/new.png';
    urlInput.dispatchEvent(new window.Event('input'));

    expect(promptEl.style.display).toBe('none');
    expect(previewEl.style.display).toBe('flex');
    expect(dropzone.classList.contains('has-file')).toBe(true);
    expect(thumbImg.src).toBe('https://example.com/new.png');
    expect(fileSizeEl.textContent).toBe('https://example.com/new.png');

    expect(urlField.style.display).toBe('none');
    expect(fileLabel.style.display).toBe('none');

    modal.querySelector('.traven-modal-close').click();
  });

  it('saving modal with empty Image URL field deletes the image Markdown line with newline collapsing', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Hello\n\n![Alt Text](https://example.com/pic.jpg)\n\nWorld',
      onUploadImage: async (file) => 'https://example.com/' + file.name,
    });
    editor.setSelection(editor.getValue().length, editor.getValue().length);

    const widgetEl = container.querySelector('.cm-wysiwym-image-widget-container');
    expect(widgetEl).not.toBeNull();

    widgetEl.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));

    const modal = document.querySelector('.traven-modal-overlay');
    const urlInput = modal.querySelector('#traven-image-url');
    const saveBtn = modal.querySelector('.traven-modal-btn.btn-primary');

    urlInput.value = '';
    urlInput.dispatchEvent(new window.Event('input'));

    saveBtn.click();

    expect(editor.getValue()).toBe('Hello\n\nWorld');
  });

  it('saving modal with empty Image URL at the start or end of document collapses surrounding newlines completely', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '![Alt Text](https://example.com/pic.jpg)\n\nWorld',
      onUploadImage: async (file) => 'https://example.com/' + file.name,
    });
    editor.setSelection(editor.getValue().length, editor.getValue().length);

    const widgetEl = container.querySelector('.cm-wysiwym-image-widget-container');
    widgetEl.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));

    const modal = document.querySelector('.traven-modal-overlay');
    const urlInput = modal.querySelector('#traven-image-url');
    urlInput.value = '';
    urlInput.dispatchEvent(new window.Event('input'));
    modal.querySelector('.traven-modal-btn.btn-primary').click();

    expect(editor.getValue()).toBe('World');
  });

  it('collapses delimiters on first line when unfocused, and reveals them when focused', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '# Heading',
    });
    
    const lineEl = container.querySelector('.cm-line');
    expect(lineEl).not.toBeNull();
    // Delimiters should be collapsed (hidden) when unfocused
    expect(lineEl.textContent).toBe('Heading');

    // Focus the editor
    editor.focus();
    
    // Wait a tick for CodeMirror to process transaction
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Delimiters should be visible when focused
    expect(lineEl.textContent).toBe('# Heading');
  });

  describe('URL sanitization and security', () => {
    it('allows safe URLs, relative paths, anchor hashtags, and blog slugs', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: [
          '[Google](https://google.com)',
          '[Relative](/about-us)',
          '[Anchor](#section-1)',
          '[Slug](my-cool-blog-post)',
          '[Mail](mailto:user@example.com)',
          '[Phone](tel:+1234567890)',
        ].join('\n\n'),
      });
      const html = editor.getContentHtml();
      expect(html).toContain('href="https://google.com"');
      expect(html).toContain('href="/about-us"');
      expect(html).toContain('href="#section-1"');
      expect(html).toContain('href="my-cool-blog-post"');
      expect(html).toContain('href="mailto:user@example.com"');
      expect(html).toContain('href="tel:+1234567890"');
    });

    it('neutralizes dangerous protocols like javascript:, data:, and vbscript:', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: [
          '[XSS 1](javascript:alert(1))',
          '[XSS 2](data:text/html,<script>alert(1)</script>)',
          '[XSS 3](vbscript:msgbox(1))',
          '![Image XSS](javascript:alert(1))',
          '[image src="javascript:alert(1)" caption="Shortcode XSS"]',
        ].join('\n\n'),
      });
      const html = editor.getContentHtml();
      // Verify that all unsafe hrefs and sources are neutralized to about:blank
      expect(html).toContain('href="about:blank"');
      expect(html).not.toContain('href="javascript:');
      expect(html).not.toContain('href="data:');
      expect(html).not.toContain('href="vbscript:');
      expect(html).toContain('src="about:blank"');
      expect(html).not.toContain('src="javascript:');
    });

    it('neutralizes obfuscated javascript URLs', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: [
          '[Obfuscated 1](j&#97;vascript:alert(1))',
          '[Obfuscated 2](java%0ascript:alert(1))',
        ].join('\n\n'),
      });
      const html = editor.getContentHtml();
      expect(html).toContain('href="about:blank"');
      expect(html).not.toContain('href="j&#97;vascript:');
      expect(html).not.toContain('href="java');
    });
  });

  describe('GFM naked autolinks', () => {
    it('compiles naked URLs, www links, and emails to HTML links in fallback renderer', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: [
          'Visit https://github.com/slpstream/traven/issues for issues.',
          'Go to www.google.com for search.',
          'Email hello@example.com for support.',
          'Do not convert `https://ignored.com` or [Google](https://google.com) twice.'
        ].join('\n'),
      });
      const html = editor.getContentHtml();
      expect(html).toContain('<a href="https://github.com/slpstream/traven/issues" target="_blank">https://github.com/slpstream/traven/issues</a>');
      expect(html).toContain('<a href="https://www.google.com" target="_blank">www.google.com</a>');
      expect(html).toContain('<a href="mailto:hello@example.com" target="_blank">hello@example.com</a>');
      expect(html).toContain('<code>https://ignored.com</code>');
      expect(html).toContain('<a href="https://google.com" target="_blank">Google</a>');
    });

    it('correctly styles naked autolinks in the editor without collapsing delimiters', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: 'Link: https://github.com',
      });
      // Move cursor away to trigger formatting
      editor.setSelection(0, 0);
      const textNode = container.querySelector('.cm-wysiwym-link-anchor');
      expect(textNode).not.toBeNull();
      expect(textNode.textContent).toBe('https://github.com');
      
      const lineEl = container.querySelector('.cm-line');
      expect(lineEl).not.toBeNull();
      expect(lineEl.textContent).toBe('Link: https://github.com');
    });

    it('collapses angle brackets for standard autolinks', () => {
      const editor = new TravenEditor({
        element: container,
        initialValue: 'Link: <https://github.com>',
      });
      editor.setSelection(0, 0);
      
      const lineEl = container.querySelector('.cm-line');
      expect(lineEl).not.toBeNull();
      expect(lineEl.textContent).toBe('Link: https://github.com');
    });
  });
});

describe('VideoShortcode', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('compiles youtube video shortcode to proper iframe in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" align="right" size="medium" caption="Never Gonna Give You Up"]',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<figure class="traven-video-figure align-right size-medium">');
    expect(html).toContain('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"');
    expect(html).toContain('<figcaption class="traven-video-caption">Never Gonna Give You Up</figcaption>');
  });

  it('compiles vimeo video shortcode to proper iframe in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[video src="https://vimeo.com/12345678" align="left" size="small" caption="Vimeo video"]',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<figure class="traven-video-figure align-left size-small">');
    expect(html).toContain('<iframe src="https://player.vimeo.com/video/12345678"');
  });

  it('compiles direct video shortcode to video tag in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[video src="https://example.com/movie.mp4" align="center" size="large" caption="Direct Video"]',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<figure class="traven-video-figure align-center size-large">');
    expect(html).toContain('<video src="https://example.com/movie.mp4" controls></video>');
  });

  it('compiles video shortcode without caption to HTML without figure wrapper in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[video src="https://example.com/movie.mp4" align="center" size="large"]',
    });
    const html = editor.getContentHtml();
    expect(html).not.toContain('<figure');
    expect(html).toContain('<div class="traven-video-container align-center size-large"><video src="https://example.com/movie.mp4" controls></video></div>');
  });

  it('handles single quoted and unquoted attributes correctly for video', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: "[video src='https://example.com/movie.mp4' align=left size='small' caption='Single quotes']",
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<figure class="traven-video-figure align-left size-small">');
    expect(html).toContain('<video src="https://example.com/movie.mp4" controls></video>');
    expect(html).toContain('<figcaption class="traven-video-caption">Single quotes</figcaption>');
  });

  it('renders VideoShortcodeWidget inside WYSIWYM editor when cursor is outside', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" align="center" size="large" caption="Video check"]\nSome text here',
    });
    editor.setSelection(editor.getValue().length, editor.getValue().length);
    
    const widgetEl = container.querySelector('.cm-wysiwym-video-shortcode-container');
    expect(widgetEl).not.toBeNull();
    expect(widgetEl.classList.contains('align-center')).toBe(true);
    expect(widgetEl.classList.contains('size-large')).toBe(true);
    
    expect(widgetEl.title).toBe('[video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" align="center" size="large" caption="Video check"]');
    
    const platformEl = widgetEl.querySelector('.video-placeholder-platform');
    expect(platformEl).not.toBeNull();
    expect(platformEl.textContent).toBe('YouTube');

    const urlEl = widgetEl.querySelector('.video-placeholder-url');
    expect(urlEl).not.toBeNull();
    expect(urlEl.textContent).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    const metaEl = widgetEl.querySelector('.shortcode-meta');
    expect(metaEl).not.toBeNull();
    expect(metaEl.textContent).toContain('Video check');
  });

  it('handles cursor delimiter skipping for video shortcode', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[video src="https://example.com/movie.mp4"]',
    });
    editor.focus();
    
    editor.setSelection(0, 0);
    
    const skipped1 = skipDelimiter(editor.getView(), 'right');
    expect(skipped1).toBe(true);
    expect(editor.getView().state.selection.main.head).toBe(7);

    const value = editor.getValue();
    const closePos = value.indexOf(']');
    editor.setSelection(closePos, closePos);

    const skipped2 = skipDelimiter(editor.getView(), 'right');
    expect(skipped2).toBe(true);
    expect(editor.getView().state.selection.main.head).toBe(closePos + 1);
  });

  it('opens editing modal when clicking VideoShortcodeWidget, and saving updates document', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[video src="https://example.com/movie.mp4" align="right" size="medium" caption="My movie"]\nSome text',
    });
    editor.setSelection(editor.getValue().length, editor.getValue().length);

    const widgetEl = container.querySelector('.cm-wysiwym-video-shortcode-container');
    expect(widgetEl).not.toBeNull();

    widgetEl.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));

    const modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();
    expect(modal.querySelector('.traven-modal-title').textContent).toBe('Edit Video');

    const urlInput = modal.querySelector('#traven-video-url');
    const alignSelect = modal.querySelector('#traven-video-align');
    const sizeSelect = modal.querySelector('#traven-video-size');
    const captionInput = modal.querySelector('#traven-video-caption');

    expect(urlInput.value).toBe('https://example.com/movie.mp4');
    expect(alignSelect.value).toBe('right');
    expect(sizeSelect.value).toBe('medium');
    expect(captionInput.value).toBe('My movie');

    alignSelect.value = 'left';
    captionInput.value = 'Updated movie';

    const saveBtn = modal.querySelector('.traven-modal-btn.btn-primary');
    saveBtn.click();

    expect(document.querySelector('.traven-modal-overlay')).toBeNull();

    expect(editor.getValue()).toBe('[video src="https://example.com/movie.mp4" align="left" caption="Updated movie"]\nSome text');
  });

  it('neutralizes dangerous protocols like javascript: in video shortcode', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[video src="javascript:alert(1)" caption="Video XSS"]',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('src="about:blank"');
    expect(html).not.toContain('src="javascript:');
  });
});


describe('fallback rendering inline formats', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('compiles underscore bold and italics correctly', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'This is __bold__ and this is _italic_.',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('This is <strong>bold</strong> and this is <em>italic</em>.');
  });

  it('compiles strikethrough formatting correctly', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'This is ~~strikethrough~~ text.',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('This is <del>strikethrough</del> text.');
  });

  it('compiles fenced code blocks correctly', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: "```js\nconsole.log(42);\n```",
    });
    const html = editor.getContentHtml();
    console.log("CODE BLOCK HTML:", html);
    expect(html).toContain('<pre><code class="language-js">console.log(42);</code></pre>');
  });

  it('compiles fenced code blocks with metadata attributes correctly', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: "```js [greet.js] {1,3}\nconsole.log(42);\n```",
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<pre><code class="language-js">console.log(42);</code></pre>');
  });
});

describe('fallback rendering list formats', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('compiles nested unordered lists with HTML5-compliant markup', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '- Parent 1\n  - Nested 1\n- Parent 2',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<ul>\n<li>Parent 1\n<ul>\n<li>Nested 1\n</li>\n</ul>\n</li>\n<li>Parent 2\n</li>\n</ul>');
  });

  it('compiles ordered lists correctly', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '1. First step\n2. Second step',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<ol>\n<li>First step\n</li>\n<li>Second step\n</li>\n</ol>');
  });

  it('compiles task checkboxes correctly', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '- [ ] Uncompleted task\n- [x] Completed task',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<li><input type="checkbox" disabled> Uncompleted task\n</li>');
    expect(html).toContain('<li><input type="checkbox" disabled checked> Completed task\n</li>');
  });
});

describe('fallback rendering table alignment', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('applies text-align inline styles correctly based on separator markers', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '| Left | Center | Right | Default |\n| :--- | :---: | ---: | --- |\n| a | b | c | d |',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<th style="text-align: left;">Left</th>');
    expect(html).toContain('<th style="text-align: center;">Center</th>');
    expect(html).toContain('<th style="text-align: right;">Right</th>');
    expect(html).toContain('<th>Default</th>');
    
    expect(html).toContain('<td style="text-align: left;">a</td>');
    expect(html).toContain('<td style="text-align: center;">b</td>');
    expect(html).toContain('<td style="text-align: right;">c</td>');
    expect(html).toContain('<td>d</td>');
  });
});

describe('fallback rendering LaTeX math', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders inline math correctly with KaTeX mock', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Equation $E = mc^2$ is famous.',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('Equation <span class="katex-inline-mocked">E = mc^2</span> is famous.');
  });

  it('renders display/block math correctly with KaTeX mock', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '$$\n\\sum_{i=1}^n x_i\n$$',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<div class="katex-display-mocked">\n\\sum_{i=1}^n x_i\n</div>');
  });

  it('falls back to raw markup when window.katex is missing', () => {
    const originalKatex = window.katex;
    delete window.katex;
    try {
      const editor = new TravenEditor({
        element: container,
        initialValue: 'Equation $E = mc^2$ and $$\n\\sum x_i\n$$',
      });
      const html = editor.getContentHtml();
      expect(html).toContain('Equation <span class="katex-inline-fallback">$E = mc^2$</span>');
      expect(html).toContain('<div class="katex-display-fallback">$$\n\\sum x_i\n$$</div>');
    } finally {
      window.katex = originalKatex;
    }
  });
});

describe('ComponentShortcode', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('compiles quote alias to blockquote HTML in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[quote]Hello **world**[/quote]',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<blockquote class="traven-component-blockquote">');
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('</blockquote>');
  });

  it('compiles blockquote with author and source to HTML in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[component="blockquote" author="John" source="Book"]Quote body[/component]',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<blockquote class="traven-component-blockquote"><p>Quote body</p><footer><cite>— John, Book</cite></footer></blockquote>');
  });

  it('compiles pullquote to blockquote with traven-component-pullquote class in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[pullquote]Special quote[/pullquote]',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<blockquote class="traven-component-pullquote"><p>Special quote</p></blockquote>');
  });

  it('compiles unknown component name to a generic div container in fallback renderer', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[component="card" foo="bar"]Card body[/component]',
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<div class="traven-component traven-component-card"><p>Card body</p></div>');
  });

  it('renders ComponentShortcodeWidget inside WYSIWYM editor when cursor is outside', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[quote author="Alice"]Widget quote[/quote]\nSome text here',
    });
    // Set selection cursor to the very end of the document, outside the shortcode
    editor.setSelection(editor.getValue().length, editor.getValue().length);
    
    // Check if the shortcode container widget is rendered
    const widgetEl = container.querySelector('.cm-wysiwym-component-shortcode');
    expect(widgetEl).not.toBeNull();
    expect(widgetEl.classList.contains('component-blockquote')).toBe(true);
    
    const cite = widgetEl.querySelector('cite');
    expect(cite).not.toBeNull();
    expect(cite.textContent).toBe('— Alice');
    
    const bodyEl = widgetEl.querySelector('.component-body');
    expect(bodyEl).not.toBeNull();
    expect(bodyEl.textContent).toBe('Widget quote');
  });

  it('opens editing modal when clicking ComponentShortcodeWidget, and saving updates document', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[quote author="John"]Click me[/quote]\nText',
    });
    editor.focus();
    // Put cursor outside
    editor.setSelection(editor.getValue().length, editor.getValue().length);

    const widgetEl = container.querySelector('.cm-wysiwym-component-shortcode');
    expect(widgetEl).not.toBeNull();

    // Dispatch mousedown on widget
    const event = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    widgetEl.dispatchEvent(event);

    // Verify modal has opened
    const modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();
    expect(modal.querySelector('.traven-modal-title').textContent).toBe('Edit Component');

    // Verify fields are pre-filled
    const nameInput = modal.querySelector('#traven-component-name');
    const attrsInput = modal.querySelector('#traven-component-attrs');
    const slotInput = modal.querySelector('#traven-component-slot');

    expect(nameInput.value).toBe('blockquote');
    expect(attrsInput.value).toBe('author="John"');
    expect(slotInput.value).toBe('Click me');

    // Edit fields
    nameInput.value = 'pullquote';
    attrsInput.value = 'author="Jane"';
    slotInput.value = 'New content';

    // Save
    const saveBtn = modal.querySelector('.traven-modal-btn.btn-primary');
    expect(saveBtn.textContent).toBe('Save');
    saveBtn.click();

    // Verify modal is closed
    expect(document.querySelector('.traven-modal-overlay')).toBeNull();

    // Verify value in editor is updated
    expect(editor.getValue()).toBe('[component name="pullquote" author="Jane"]\nNew content\n[/component]\nText');
  });

  it('opens component modal and populates dropdown options from default schema', () => {
    const editor = new TravenEditor({ element: container });
    openComponentModal(editor);

    const modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();

    const nameSelect = modal.querySelector('#traven-component-name');
    expect(nameSelect.tagName.toLowerCase()).toBe('select');
    
    // Check options
    const options = Array.from(nameSelect.options).map(opt => opt.value);
    expect(options).toEqual(['blockquote', 'pullquote', 'info', 'warning']);
    
    // Default selection should be pullquote
    expect(nameSelect.value).toBe('pullquote');

    // Clean up
    modal.querySelector('.traven-modal-close').click();
  });

  it('populates dropdown options from custom components array option', () => {
    const editor = new TravenEditor({
      element: container,
      components: ['info', 'warning', 'tip']
    });
    openComponentModal(editor);

    const modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();

    const nameSelect = modal.querySelector('#traven-component-name');
    const options = Array.from(nameSelect.options).map(opt => opt.value);
    expect(options).toEqual(['info', 'warning', 'tip']);

    // Default selection: since pullquote is missing, it should default to the first one ('info')
    expect(nameSelect.value).toBe('info');

    // Clean up
    modal.querySelector('.traven-modal-close').click();
  });

  it('defaults to pullquote if present in custom components list, even if not the first option', () => {
    const editor = new TravenEditor({
      element: container,
      components: ['info', 'pullquote', 'warning']
    });
    openComponentModal(editor);

    const modal = document.querySelector('.traven-modal-overlay');
    const nameSelect = modal.querySelector('#traven-component-name');
    expect(nameSelect.value).toBe('pullquote');

    // Clean up
    modal.querySelector('.traven-modal-close').click();
  });

  it('appends the current component tag name to the dropdown options if editing a tag not in the schema', () => {
    const editor = new TravenEditor({
      element: container,
      components: ['blockquote', 'pullquote']
    });
    // Simulate editing a component named "custom-card"
    openComponentModal({
      editor,
      attrs: { name: 'custom-card' },
      docFrom: 0,
      docTo: 10
    });

    const modal = document.querySelector('.traven-modal-overlay');
    const nameSelect = modal.querySelector('#traven-component-name');
    const options = Array.from(nameSelect.options).map(opt => opt.value);
    
    // "custom-card" should be dynamically appended to the options
    expect(options).toEqual(['blockquote', 'pullquote', 'custom-card']);
    expect(nameSelect.value).toBe('custom-card');

    // Clean up
    modal.querySelector('.traven-modal-close').click();
  });

  describe('Component schema fetch fallbacks', () => {
    let originalFetch;
    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    const defaultPresets = [
      {
        name: "blockquote",
        attributes: [
          { name: "author", type: "text", label: "Author Name", placeholder: "e.g. James Baldwin" },
          { name: "source", type: "text", label: "Source Citation", placeholder: "e.g. The Fire Next Time" }
        ]
      },
      "pullquote",
      {
        name: "info",
        attributes: [
          { name: "title", type: "text", label: "Notice Title", placeholder: "e.g. Note" },
          { name: "collapsible", type: "boolean", label: "Collapsible?" }
        ]
      },
      "warning"
    ];

    it('falls back to default presets on fetch network/status error', async () => {
      globalThis.fetch = () => Promise.resolve({
        ok: false,
        status: 404
      });

      const editor = new TravenEditor({ element: container });
      // Wait for fetch promise chain to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(editor.getComponents()).toEqual(defaultPresets);
      globalThis.fetch = originalFetch;
    });

    it('falls back to default presets on invalid JSON response', async () => {
      globalThis.fetch = () => Promise.resolve({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Invalid JSON'))
      });

      const editor = new TravenEditor({ element: container });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(editor.getComponents()).toEqual(defaultPresets);
      globalThis.fetch = originalFetch;
    });

    it('falls back to default presets on empty array response', async () => {
      globalThis.fetch = () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });

      const editor = new TravenEditor({ element: container });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(editor.getComponents()).toEqual(defaultPresets);
      globalThis.fetch = originalFetch;
    });

    it('successfully overrides defaults when fetch returns a valid schema', async () => {
      globalThis.fetch = () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['info', 'tip'])
      });

      const editor = new TravenEditor({ element: container });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(editor.getComponents()).toEqual(['info', 'tip']);
      globalThis.fetch = originalFetch;
    });
  });

  describe('Structured attributes Option A and Option B', () => {
    it('switches between Option A (builder) and Option B (schema-driven) based on schema structure', () => {
      const editor = new TravenEditor({
        element: container,
        components: [
          {
            name: 'custom-card',
            attributes: [
              { name: 'theme', type: 'text', label: 'Theme Style' },
              { name: 'dark', type: 'boolean', label: 'Dark Mode' }
            ]
          },
          'generic-quote'
        ]
      });

      openComponentModal(editor);
      const modal = document.querySelector('.traven-modal-overlay');
      expect(modal).not.toBeNull();

      const nameSelect = modal.querySelector('#traven-component-name');
      const dynamicWrapper = modal.querySelector('.traven-attrs-dynamic-wrapper');

      // Since custom-card has attributes defined, it should render Option B (schema)
      nameSelect.value = 'custom-card';
      nameSelect.dispatchEvent(new window.Event('change'));
      expect(dynamicWrapper.dataset.activeOption).toBe('schema');

      // Verify schema inputs
      const schemaInputs = dynamicWrapper.querySelectorAll('.attr-schema-input');
      expect(schemaInputs.length).toBe(2);
      expect(schemaInputs[0].dataset.name).toBe('theme');
      expect(schemaInputs[0].type).toBe('text');
      expect(schemaInputs[1].dataset.name).toBe('dark');
      expect(schemaInputs[1].type).toBe('checkbox');

      // Now change selection to generic-quote (simple string, Option A builder)
      nameSelect.value = 'generic-quote';
      nameSelect.dispatchEvent(new window.Event('change'));
      expect(dynamicWrapper.dataset.activeOption).toBe('builder');

      // Verify builder is rendered
      const addBtn = dynamicWrapper.querySelector('.traven-table-toolbar-btn');
      expect(addBtn.textContent).toBe('+ Add Attribute');

      // Clean up
      modal.querySelector('.traven-modal-close').click();
    });

    it('Option B: fills inputs, toggles checkbox, and saves attributes correctly', () => {
      const editor = new TravenEditor({
        element: container,
        components: [
          {
            name: 'card',
            attributes: [
              { name: 'theme', type: 'text' },
              { name: 'dark', type: 'boolean' }
            ]
          }
        ]
      });

      openComponentModal(editor);
      const modal = document.querySelector('.traven-modal-overlay');
      const dynamicWrapper = modal.querySelector('.traven-attrs-dynamic-wrapper');

      // Assert label is initially optional
      const titleLabel = dynamicWrapper.querySelector('.traven-modal-label');
      expect(titleLabel.innerHTML).toContain('(optional)');

      const themeInput = dynamicWrapper.querySelector('[data-name="theme"]');
      const darkCheckbox = dynamicWrapper.querySelector('[data-name="dark"]');

      // Fill in theme - should update label to non-optional
      themeInput.value = 'ocean';
      themeInput.dispatchEvent(new window.Event('input'));
      expect(titleLabel.textContent).toBe('Attributes');

      // Clear theme - should revert label to optional
      themeInput.value = '';
      themeInput.dispatchEvent(new window.Event('input'));
      expect(titleLabel.innerHTML).toContain('(optional)');

      // Re-fill to save
      themeInput.value = 'ocean';
      themeInput.dispatchEvent(new window.Event('input'));
      darkCheckbox.checked = true;
      darkCheckbox.dispatchEvent(new window.Event('change'));

      // Click save
      modal.querySelector('.traven-modal-btn.btn-primary').click();

      // Verify generated component markup in editor
      expect(editor.getValue()).toBe('[component name="card" theme="ocean" dark="true"]\n\n[/component]\n');
    });

    it('Option A: dynamically adds key-value rows and saves attributes correctly', () => {
      const editor = new TravenEditor({
        element: container,
        components: ['simple-comp']
      });

      openComponentModal(editor);
      const modal = document.querySelector('.traven-modal-overlay');
      const dynamicWrapper = modal.querySelector('.traven-attrs-dynamic-wrapper');

      // Initially no rows
      let rows = dynamicWrapper.querySelectorAll('.traven-attr-row');
      expect(rows.length).toBe(0);

      // Add a row
      const addBtn = dynamicWrapper.querySelector('.traven-table-toolbar-btn');
      addBtn.click();

      rows = dynamicWrapper.querySelectorAll('.traven-attr-row');
      expect(rows.length).toBe(1);

      // Fill in the row
      rows[0].querySelector('.attr-key-input').value = 'class';
      rows[0].querySelector('.attr-val-input').value = 'my-style';

      // Click save
      modal.querySelector('.traven-modal-btn.btn-primary').click();

      expect(editor.getValue()).toBe('[component name="simple-comp" class="my-style"]\n\n[/component]\n');
    });

    it('Test Compatibility: respects direct modification of hidden #traven-component-attrs input', () => {
      const editor = new TravenEditor({
        element: container,
        components: ['simple-comp']
      });

      openComponentModal(editor);
      const modal = document.querySelector('.traven-modal-overlay');
      const hiddenInput = modal.querySelector('#traven-component-attrs');

      // Direct simulation of a test script modifying value
      hiddenInput.value = 'custom="mutated-value"';

      // Click save
      modal.querySelector('.traven-modal-btn.btn-primary').click();

      expect(editor.getValue()).toBe('[component name="simple-comp" custom="mutated-value"]\n\n[/component]\n');
    });
  });
});

describe('BlockquoteDropdown', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    // Clean up any remaining modal overlays
    document.querySelectorAll('.traven-modal-overlay').forEach(el => el.remove());
  });

  it('renders blockquote dropdown and triggers child actions', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Hello',
      toolbar: ['blockquote']
    });

    const toolbarContainer = container.querySelector('.traven-toolbar-container');
    expect(toolbarContainer).not.toBeNull();

    const blockquoteDropdown = toolbarContainer.querySelector('#traven-blockquote-dropdown');
    expect(blockquoteDropdown).not.toBeNull();

    const trigger = blockquoteDropdown.querySelector('button.btn-blockquote');
    expect(trigger).not.toBeNull();

    // The dropdown should have 3 menu items: Simple, Blockquote, Pullquote
    const menuItems = blockquoteDropdown.querySelectorAll('.toolbar-dropdown-item');
    expect(menuItems.length).toBe(3);

    expect(menuItems[0].getAttribute('aria-label')).toBe('Simple');
    expect(menuItems[1].getAttribute('aria-label')).toBe('Blockquote');
    expect(menuItems[2].getAttribute('aria-label')).toBe('Pullquote');

    // 1. Click Simple -> inserts/toggles legacy blockquote
    menuItems[0].click();
    expect(editor.getValue()).toBe('> Hello');

    // Reset value
    editor.setValue('Hello');

    // 2. Click Blockquote -> opens modal with blockquote selected
    menuItems[1].click();
    let modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();
    expect(modal.querySelector('#traven-component-name').value).toBe('blockquote');
    // Close modal
    modal.querySelector('.traven-modal-close').click();
    expect(document.querySelector('.traven-modal-overlay')).toBeNull();

    // 3. Click Pullquote -> opens modal with pullquote selected
    menuItems[2].click();
    modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();
    expect(modal.querySelector('#traven-component-name').value).toBe('pullquote');
    // Close modal
    modal.querySelector('.traven-modal-close').click();
    expect(document.querySelector('.traven-modal-overlay')).toBeNull();
  });
});



