import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { HrPlugin } from '../src/plugins/hr-plugin.js';

describe('HrPlugin', () => {
  function getDecorations(doc, cursorLine = -1) {
    const state = EditorState.create({
      doc,
      extensions: [markdown()]
    });
    
    const plugin = new HrPlugin();
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

  it('adds widget decoration for HorizontalRule when cursor is off the line', () => {
    const decos = getDecorations('---\n\ntext', 2);
    
    expect(decos.length).toBe(1);
    expect(decos[0].from).toBe(0);
    expect(decos[0].to).toBe(3); // "---"
    expect(decos[0].deco.spec.widget).toBeDefined();
    expect(decos[0].deco.spec.block).toBe(true);
  });

  it('does not add widget decoration when cursor is on the line', () => {
    // line 1 is the first line
    const decos = getDecorations('---\n', 1);
    expect(decos.length).toBe(0);
  });

  it('returns null for HTML rendering to fallback to default renderer', () => {
    const plugin = new HrPlugin();
    expect(plugin.renderToHTML({ name: 'HorizontalRule' }, '', {})).toBeNull();
  });
});
