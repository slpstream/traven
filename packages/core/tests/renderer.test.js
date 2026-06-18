import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TravenEditor } from '../src/index.js';

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
      expect(render('# Heading 1')).toContain('<h1>Heading 1</h1>');
      expect(render('## Heading 2')).toContain('<h2>Heading 2</h2>');
      expect(render('### Heading 3')).toContain('<h3>Heading 3</h3>');
      expect(render('#### Heading 4')).toContain('<h4>Heading 4</h4>');
      expect(render('##### Heading 5')).toContain('<h5>Heading 5</h5>');
      expect(render('###### Heading 6')).toContain('<h6>Heading 6</h6>');
    });

    it('renders paragraphs', () => {
      expect(render('Line 1\n\nLine 2')).toBe('<p>Line 1</p>\n<p>Line 2</p>');
    });

    it('renders horizontal rules', () => {
      expect(render('---')).toContain('<hr>');
      expect(render('***')).toContain('<hr>');
      expect(render('___')).toContain('<hr>');
    });

    it('renders blockquotes', () => {
      expect(render('> Blockquote')).toBe('<blockquote>Blockquote</blockquote>');
      expect(render('> Line 1\n> Line 2')).toBe('<blockquote>Line 1<br>Line 2</blockquote>');
      expect(render('> Nested\n>> Blockquote')).toBe('<blockquote>Nested<br>&gt; Blockquote</blockquote>');
    });

    it('renders fenced code blocks', () => {
      expect(render('```\ncode block\n```')).toBe('<pre><code>code block</code></pre>');
      expect(render('```js\nconst x = 1;\n```')).toBe('<pre><code class="language-js">const x = 1;</code></pre>');
    });
  });

  describe('Inline Formatting', () => {
    it('renders bold, italic, strikethrough, highlight, and inline code', () => {
      expect(render('**bold**')).toBe('<p><strong>bold</strong></p>');
      expect(render('*italic*')).toBe('<p><em>italic</em></p>');
      expect(render('~~strikethrough~~')).toBe('<p><del>strikethrough</del></p>');
      expect(render('==highlight==')).toBe('<p><mark>highlight</mark></p>');
      expect(render('`inline code`')).toBe('<p><code>inline code</code></p>');
    });

    it('renders nested inline formatting', () => {
      expect(render('**bold and *italic* inside**')).toBe('<p><strong>bold and <em>italic</em> inside</strong></p>');
    });
  });

  describe('Lists', () => {
    it('renders unordered lists', () => {
      expect(render('- Item 1\n- Item 2')).toBe('<ul>\n<li>Item 1\n</li>\n<li>Item 2\n</li>\n</ul>');
    });

    it('renders ordered lists', () => {
      expect(render('1. Item 1\n2. Item 2')).toBe('<ol>\n<li>Item 1\n</li>\n<li>Item 2\n</li>\n</ol>');
    });

    it('renders task lists', () => {
      expect(render('- [ ] Todo\n- [x] Done')).toBe('<ul>\n<li><input type="checkbox" disabled> Todo\n</li>\n<li><input type="checkbox" disabled checked> Done\n</li>\n</ul>');
    });

    it('renders nested lists', () => {
      expect(render('- Parent\n  - Child')).toBe('<ul>\n<li>Parent\n<ul>\n<li>Child\n</li>\n</ul>\n</li>\n</ul>');
    });
  });

  describe('Links and Images', () => {
    it('renders links', () => {
      expect(render('[Text](https://example.com)')).toBe('<p><a href="https://example.com" target="_blank">Text</a></p>');
      expect(render('[Text](https://example.com "Title")')).toBe('<p><a href="https://example.com "Title"" target="_blank">Text</a></p>');
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
      expect(html).toContain('<div class="traven-video-container"><video src="vid.mp4" controls></video></div>');
      expect(html).toContain('<figcaption class="traven-video-caption">Video</figcaption>');
    });

    it('renders component shortcodes', () => {
      const html = render('[component id="123" type="cta"]');
      expect(html).toBe('<p>[component id="123" type="cta"]</p>');
    });
    
    it('renders figure shortcodes', () => {
      const html = render('[figure]\nContent\n[/figure]');
      expect(html).toContain('<figure class="traven-figure align-center size-medium">');
      expect(html).toContain('<p>Content</p>');
      expect(html).toContain('</figure>');
    });
  });

  describe('Math and Mermaid', () => {
    it('renders inline math', () => {
      expect(render('Here is math $E=mc^2$ inline.')).toBe('<p>Here is math <span class="katex-inline-mocked">E=mc^2</span> inline.</p>');
    });

    it('renders block math', () => {
      expect(render('$$\na^2 + b^2 = c^2\n$$')).toBe('<div class="katex-display-mocked">\na^2 + b^2 = c^2\n</div>');
    });

    it('renders mermaid blocks', () => {
      const html = render('```mermaid\ngraph TD;\n    A-->B;\n```');
      expect(html).toContain('<div class="mermaid-fallback"><pre class="language-mermaid"><code>graph TD;');
      expect(html).toContain('A--&gt;B;</code></pre></div>');
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
      expect(render('https://example.com')).toBe('<p><a href="https://example.com" target="_blank">https://example.com</a></p>');
    });

    it('escapes HTML in regular text', () => {
      expect(render('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    });

    it('escapes HTML in code spans', () => {
      expect(render('`<script>`')).toBe('<p><code>&lt;script&gt;</code></p>');
    });
  });
});
