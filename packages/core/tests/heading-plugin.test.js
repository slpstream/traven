import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { markdownLanguage, markdown } from '@codemirror/lang-markdown';
import { HeadingPlugin } from '../src/plugins/heading-plugin.js';
import { collapseDeco } from '../src/wysiwym.js';

describe('HeadingPlugin', () => {
  function getDecorations(doc, cursorLine = -1) {
    const state = EditorState.create({
      doc,
      extensions: [markdown()]
    });
    
    const plugin = new HeadingPlugin();
    const decorations = [];
    
    const ctx = {
      state,
      decorations,
      cursorLine
    };
    
    plugin.buildDecorations(ctx);
    
    // Sort decorations by start position as the real builder does
    decorations.sort((a, b) => a.from - b.from);
    return decorations;
  }

  it('adds heading line decorations and collapses markers', () => {
    const decos = getDecorations('# Heading 1\n## Heading 2');
    
    expect(decos.length).toBe(4);
    
    // First line (line deco)
    expect(decos[0].from).toBe(0);
    expect(decos[0].to).toBe(0);
    expect(decos[0].deco.spec.class).toBe('cm-wysiwym-h1');
    
    // First line HeaderMark collapse
    expect(decos[1].from).toBe(0);
    expect(decos[1].to).toBe(2); // "# "
    expect(decos[1].deco).toBe(collapseDeco);

    // Second line (line deco)
    expect(decos[2].from).toBe(12);
    expect(decos[2].to).toBe(12);
    expect(decos[2].deco.spec.class).toBe('cm-wysiwym-h2');

    // Second line HeaderMark collapse
    expect(decos[3].from).toBe(12);
    expect(decos[3].to).toBe(15); // "## "
    expect(decos[3].deco).toBe(collapseDeco);
  });

  it('does not collapse HeaderMark when cursor is on the same line', () => {
    // line 1 is the first line
    const decos = getDecorations('# Heading 1', 1); 
    
    expect(decos.length).toBe(1);
    expect(decos[0].from).toBe(0);
    expect(decos[0].to).toBe(0);
    expect(decos[0].deco.spec.class).toBe('cm-wysiwym-h1');
  });

  it('collapses multiple trailing spaces after HeaderMark', () => {
    const decos = getDecorations('###    Space');
    
    expect(decos.length).toBe(2);
    expect(decos[1].from).toBe(0);
    expect(decos[1].to).toBe(7); // "###    "
    expect(decos[1].deco).toBe(collapseDeco);
  });

  it('deduplicates line decorations if multiple headings occur on the same line', () => {
    // This is technically invalid markdown but we test the dedup logic
    const decos = getDecorations('# H1 # H1');
    const lineDecos = decos.filter(d => d.deco.spec.class === 'cm-wysiwym-h1');
    expect(lineDecos.length).toBe(1);
  });

  it('returns appropriate HTML rendering or delegates to default', () => {
    const plugin = new HeadingPlugin();
    
    expect(plugin.renderToHTML({ name: 'HeaderMark' }, '', {})).toBe('');
    expect(plugin.renderToHTML({ name: 'ATXHeading1' }, 'Content', {})).toBeNull();
    expect(plugin.renderToHTML({ name: 'Paragraph' }, '', {})).toBeNull();
  });
});
