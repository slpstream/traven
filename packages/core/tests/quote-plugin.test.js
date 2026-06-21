import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { QuotePlugin } from '../src/plugins/quote-plugin.js';
import { collapseDeco } from '../src/wysiwym.js';

describe('QuotePlugin', () => {
  function getDecorations(doc, cursorLine = -1) {
    const state = EditorState.create({
      doc,
      extensions: [markdown()]
    });
    
    const plugin = new QuotePlugin();
    const decorations = [];
    
    const ctx = {
      state,
      decorations,
      cursorLine
    };
    
    plugin.buildDecorations(ctx);
    decorations.sort((a, b) => a.from - b.from);
    return decorations;
  }

  it('adds blockquote line decorations for all lines in the blockquote', () => {
    const decos = getDecorations('> line 1\n> line 2\n\ntext');
    
    // 2 line decos + 2 QuoteMark collapse decos
    expect(decos.length).toBe(4);
    
    const lineDecos = decos.filter(d => d.deco.spec.class === 'cm-wysiwym-blockquote');
    expect(lineDecos.length).toBe(2);
    expect(lineDecos[0].from).toBe(0); // line 1 start
    expect(lineDecos[1].from).toBe(9); // line 2 start
  });

  it('deduplicates line decorations within the blockquote', () => {
    const decos = getDecorations('> line 1');
    const lineDecos = decos.filter(d => d.deco.spec.class === 'cm-wysiwym-blockquote');
    expect(lineDecos.length).toBe(1);
  });

  it('collapses QuoteMark when cursor is not on the line', () => {
    const decos = getDecorations('> text', 2);
    
    const collapseDecos = decos.filter(d => d.deco === collapseDeco);
    expect(collapseDecos.length).toBe(1);
    expect(collapseDecos[0].from).toBe(0);
    expect(collapseDecos[0].to).toBe(1); // ">"
  });

  it('does not collapse QuoteMark when cursor is on the line', () => {
    const decos = getDecorations('> text', 1);
    
    const collapseDecos = decos.filter(d => d.deco === collapseDeco);
    expect(collapseDecos.length).toBe(0); // no collapse on line 1
  });

  it('returns null for HTML rendering to fallback to default renderer', () => {
    const plugin = new QuotePlugin();
    expect(plugin.renderToHTML({ name: 'Blockquote' }, '', {})).toBeNull();
  });

  it('collapses the entire first line when the cursor is completely outside the admonition', () => {
    const decos = getDecorations('> [!NOTE]\n> content line 1\n> content line 2', 5);
    
    const entireLineCollapse = decos.find(d => d.from === 0 && d.to === 10);
    expect(entireLineCollapse).toBeDefined();

    const noteDecos = decos.filter(d => d.deco.spec.class && d.deco.spec.class.includes('cm-wysiwym-alert-note'));
    expect(noteDecos.length).toBe(3);
    expect(noteDecos.find(d => d.from === 0)).toBeDefined();
  });

  it('does not collapse the first line or marker at all when the cursor is inside the admonition', () => {
    const decos = getDecorations('> [!NOTE]\n> content line 1\n> content line 2', 2);
    
    const entireLineCollapse = decos.find(d => d.from === 0 && d.to === 10);
    expect(entireLineCollapse).toBeUndefined();

    const markerCollapse = decos.find(d => d.from === 2 && d.to === 9);
    expect(markerCollapse).toBeUndefined();

    const quoteMarkCollapse1 = decos.find(d => d.from === 0 && d.to === 1);
    expect(quoteMarkCollapse1).toBeUndefined();

    const quoteMarkCollapse3 = decos.find(d => d.from === 27 && d.to === 28);
    expect(quoteMarkCollapse3).toBeDefined();
  });

  it('collapses only the tag marker if there is text content on the first line and cursor is outside', () => {
    const decos = getDecorations('> [!NOTE] content\n> line 2', 4);
    
    const entireLineCollapse = decos.find(d => d.from === 0 && d.to > 1 && d.deco === collapseDeco);
    expect(entireLineCollapse).toBeUndefined();

    const markerCollapse = decos.find(d => d.from === 2 && d.to === 9);
    expect(markerCollapse).toBeDefined();
  });

  it('maps INFO to NOTE alias', () => {
    const decos = getDecorations('> [!INFO]\n> content', 1);
    const alertDecos = decos.filter(d => d.deco.spec.class && d.deco.spec.class.includes('cm-wysiwym-alert-note'));
    expect(alertDecos.length).toBe(2);
  });
});
