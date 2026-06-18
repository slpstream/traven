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
});
