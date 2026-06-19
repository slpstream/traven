import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TravenEditor, renderMarkdown } from '../src/index.js';
import { safeHtmlForEditor } from '../src/plugins/html-plugin.js';

// Polyfill for JSDOM / CodeMirror 6 compatibility
if (typeof window !== 'undefined') {
  window.Range.prototype.getClientRects = function() {
    return { length: 0, item: () => null, [Symbol.iterator]: function* () {} };
  };
  window.Range.prototype.getBoundingClientRect = function() {
    return { bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0 };
  };

  window.katex = {
    renderToString: (math, opts) => {
      const tag = opts && opts.displayMode ? 'div' : 'span';
      const mode = opts && opts.displayMode ? 'display' : 'inline';
      return `<${tag} class="katex-${mode}-mocked">${math}</${tag}>`;
    }
  };
}

describe('Traven Renderer Golden Tests', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function render(markdown) {
    const editor = new TravenEditor({
      element: container,
      initialValue: markdown,
    });
    return editor.getContentHtml();
  }

  describe('Block Elements', () => {
    it('renders headings H1-H6', () => {
      expect(render('# Heading 1')).toContain('<h1> Heading 1</h1>');
      expect(render('## Heading 2')).toContain('<h2> Heading 2</h2>');
      expect(render('### Heading 3')).toContain('<h3> Heading 3</h3>');
      expect(render('#### Heading 4')).toContain('<h4> Heading 4</h4>');
      expect(render('##### Heading 5')).toContain('<h5> Heading 5</h5>');
      expect(render('###### Heading 6')).toContain('<h6> Heading 6</h6>');
    });

    it('renders paragraphs', () => {
      const html = render('Line 1\n\nLine 2');
      expect(html).toContain('<p>Line 1</p>');
      expect(html).toContain('<p>Line 2</p>');
    });

    it('renders horizontal rules', () => {
      expect(render('---')).toContain('<hr>');
      expect(render('***')).toContain('<hr>');
      expect(render('___')).toContain('<hr>');
    });

    it('renders blockquotes', () => {
      expect(render('> Blockquote')).toContain('<blockquote>\n <p>Blockquote</p>');
      expect(render('> Line 1\n> Line 2')).toContain('<blockquote>');
      expect(render('> Nested\n>> Blockquote')).toContain('<blockquote>\n <p>Nested</p>');
    });

    it('renders fenced code blocks', () => {
      expect(render('```\ncode block\n```')).toContain('<pre><code>code block');
      expect(render('```js\nconst x = 1;\n```')).toContain('<pre><code class="language-js">const x = 1;');
    });
  });

  describe('Inline Formatting', () => {
    it('renders bold, italic, strikethrough, highlight, and inline code', () => {
      expect(render('**bold**')).toContain('<strong>bold</strong>');
      expect(render('*italic*')).toContain('<em>italic</em>');
      expect(render('~~strikethrough~~')).toContain('<del>strikethrough</del>');
      expect(render('==highlight==')).toContain('<mark>highlight</mark>');
      expect(render('`inline code`')).toContain('<code>inline code</code>');
    });

    it('renders nested inline formatting', () => {
      expect(render('**bold and *italic* inside**')).toContain('<strong>bold and <em>italic</em> inside</strong>');
    });
  });

  describe('Lists', () => {
    it('renders unordered lists', () => {
      const html = render('- Item 1\n- Item 2');
      expect(html).toContain('<ul>');
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
    });

    it('renders ordered lists', () => {
      const html = render('1. Item 1\n2. Item 2');
      expect(html).toContain('<ol>');
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
    });

    it('renders task lists', () => {
      const html = render('- [ ] Todo\n- [x] Done');
      expect(html).toContain('<input type="checkbox" disabled>');
      expect(html).toContain('<input type="checkbox" disabled checked>');
    });

    it('renders nested lists', () => {
      const html = render('- Parent\n  - Child');
      expect(html).toContain('<ul>');
      expect(html).toContain('Child');
    });
  });

  describe('Links and Images', () => {
    it('renders links', () => {
      expect(render('[Text](https://example.com)')).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">Text</a>');
      expect(render('[Text](https://example.com "Title")')).toContain('<a href="https://example.com" title="Title" target="_blank" rel="noopener noreferrer">Text</a>');
    });

    it('renders standard markdown images as traven image shortcodes by default', () => {
      const html = render('![Alt Text](https://example.com/pic.jpg)');
      expect(html).toContain('<img src="https://example.com/pic.jpg"');
      expect(html).toContain('alt="Alt Text"');
      expect(html).toContain('class="traven-image-shortcode align-center size-medium"');
    });
  });

  describe('Shortcodes', () => {
    it('renders image shortcodes', () => {
      const html = render('[image src="pic.jpg" caption="Caption" align="left" size="small"]');
      expect(html).toContain('<figure class="traven-image-figure align-left size-small">');
      expect(html).toContain('<img src="pic.jpg" alt="Caption" class="traven-image-shortcode">');
      expect(html).toContain('<figcaption class="traven-image-caption">Caption</figcaption>');
    });

    it('renders video shortcodes', () => {
      const html = render('[video src="vid.mp4" caption="Video"]');
      expect(html).toContain('<figure class="traven-video-figure align-center size-medium">');
      expect(html).toContain('<figcaption class="traven-video-caption">Video</figcaption>');
    });

    it('renders component shortcodes', () => {
      const html = render('[component id="123" type="cta"][/component]');
      expect(html).toContain('traven-component');
    });
    
    it('renders figure shortcodes', () => {
      const html = render('[figure]\nContent\n[/figure]');
      expect(html).toContain('<figure class="traven-figure-shortcode align-center">');
      expect(html).toContain('Content');
      expect(html).toContain('</figure>');
    });
  });

  describe('Math and Mermaid', () => {
    it('renders inline math', () => {
      expect(render('Here is math $E=mc^2$ inline.')).toContain('<span class="katex-inline-mocked">E=mc^2</span>');
    });

    it('renders block math', () => {
      expect(render('$$\na^2 + b^2 = c^2\n$$')).toContain('<div class="katex-display-mocked">\na^2 + b^2 = c^2\n</div>');
    });

    it('renders mermaid blocks', () => {
      const html = render('```mermaid\ngraph TD;\n    A-->B;\n```');
      expect(html).toContain('<div class="mermaid-fallback"><pre class="language-mermaid"><code>graph TD;');
    });
  });

  describe('Tables', () => {
    it('renders tables', () => {
      const html = render('| H1 | H2 |\n| --- | --- |\n| D1 | D2 |');
      expect(html).toContain('<table>');
      expect(html).toContain('<th>H1</th>');
      expect(html).toContain('<td>D1</td>');
      expect(html).toContain('</table>');
    });
  });

  describe('Edge Cases', () => {
    it('autolinks naked URLs', () => {
      expect(render('https://example.com')).toContain('<p></p>');
    });

    it('escapes unmatched HTML characters in regular text', () => {
      expect(render('a < b')).toContain('a &lt; b');
    });

    it('renders HTML blocks and tags unescaped', () => {
      expect(render('<div style="text-align: center">\nSome centered text\n</div>')).toContain('<div style="text-align: center">\nSome centered text\n</div>');
    });

    it('escapes HTML in code spans', () => {
      expect(render('`<script>`')).toContain('<code>&lt;script&gt;</code>');
    });
  });

  describe('Standalone renderMarkdown helper', () => {
    it('compiles markdown using default plugins and configuration', () => {
      const html = renderMarkdown('# Hello World\n\n- item 1\n- item 2');
      expect(html).toContain('<h1> Hello World</h1>');
      expect(html).toContain('<ul>');
      expect(html).toContain('item 1');
    });

    it('handles HTML blocks and tags correctly', () => {
      const html = renderMarkdown('<div style="text-align: center">Centered</div>');
      expect(html).toContain('<div style="text-align: center">Centered</div>');
    });
  });

  describe('safeHtmlForEditor sanitization', () => {
    it('strips script tags', () => {
      const input = '<div>Test <script>alert(1)</script>content</div>';
      const output = safeHtmlForEditor(input);
      expect(output).not.toContain('<script>');
      expect(output).toContain('<div>Test content</div>');
    });

    it('strips inline event handler attributes', () => {
      const input = '<img src="x" onerror="alert(1)" onclick="run()" only-once="keep-me">';
      const output = safeHtmlForEditor(input);
      expect(output).not.toContain('onerror');
      expect(output).not.toContain('onclick');
      expect(output).toContain('only-once="keep-me"');
    });

    it('scopes element IDs and replaces internal references', () => {
      const input = `
        <svg>
          <clipPath id="testClip"><rect width="10" height="10"/></clipPath>
          <image href="x" clip-path="url(#testClip)"/>
          <a href="#testClip">Link</a>
          <style>#testClip { fill: red; }</style>
        </svg>
      `;
      const output = safeHtmlForEditor(input);
      expect(output).not.toContain('id="testClip"');
      expect(output).not.toContain('clip-path="url(#testClip)"');
      expect(output).not.toContain('href="#testClip"');
      expect(output).not.toContain('#testClip {');
      expect(output).toContain('id="testClip-');
      expect(output).toContain('clip-path="url(#testClip-');
      expect(output).toContain('href="#testClip-');
      expect(output).toContain('#testClip-');
    });
  });
});
