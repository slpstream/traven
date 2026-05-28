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

    const uploadingWidget = container.querySelector('.cm-wysiwym-image-uploading');
    expect(uploadingWidget).not.toBeNull();
    expect(uploadingWidget.textContent).toContain('Uploading photo.jpg...');
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


