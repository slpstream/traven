import { describe, it, expect, beforeEach } from 'vitest';
import { TravenEditor } from '../src/index.js';
import { parseMarkdownTable, serializeTableToMarkdown } from '../src/toolbar/modal.js';

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
    expect(html).toContain('<img src="https://example.com/pic.jpg"');
    expect(html).toContain('alt="My caption"');
    expect(html).toContain('class="traven-image-shortcode align-right size-medium"');
  });

  it('handles single quoted and unquoted attributes correctly', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: "[image src='https://example.com/pic.jpg' align=left size='small' caption='Single quotes']",
    });
    const html = editor.getContentHtml();
    expect(html).toContain('<img src="https://example.com/pic.jpg"');
    expect(html).toContain('alt="Single quotes"');
    expect(html).toContain('class="traven-image-shortcode align-left size-small"');
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
    
    const badge = widgetEl.querySelector('.tag-name');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('image');
    
    const captionEl = widgetEl.querySelector('.meta-caption');
    expect(captionEl).not.toBeNull();
    expect(captionEl.textContent).toBe('WYSIWYM check');
  });
});

