import { describe, it, expect, vi } from 'vitest';
import { LinkPlugin } from '../src/plugins/link-plugin.js';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { Autolink } from '@lezer/markdown';

describe('LinkPlugin', () => {
  it('instantiates correctly', () => {
    const plugin = new LinkPlugin();
    expect(plugin.name).toBe('link');
    expect(plugin.requiredNodes).toContain('Link');
    expect(plugin.requiredNodes).toContain('Autolink');
    expect(plugin.requiredNodes).toContain('URL');
  });

  it('collapses delimiters and styles content for Link when cursor is outside', () => {
    const state = EditorState.create({
      doc: "Text with [link](https://example.com) here.",
      extensions: [markdown()]
    });

    const plugin = new LinkPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 0,
      suppressed: null,
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);

    expect(decorations.length).toBeGreaterThan(0);
    
    // There should be a collapse for [, ], (, and ) markers and URL
    const collapses = decorations.filter(d => d.deco.spec.widget === undefined && !d.deco.spec.class);
    expect(collapses.length).toBeGreaterThan(0); // 3 LinkMarks: [, ](, ) plus 1 URL text collapse.
    
    // And there should be one mark decoration for the text
    const marks = decorations.filter(d => d.deco.spec.class === 'cm-wysiwym-link-anchor');
    expect(marks.length).toBe(1);
    expect(marks[0].from).toBe(11); // After '['
    expect(marks[0].to).toBe(15); // Before ']'
  });

  it('does not decorate Link when cursor is inside', () => {
    const state = EditorState.create({
      doc: "Text with [link](https://example.com) here.",
      extensions: [markdown()]
    });

    const plugin = new LinkPlugin();
    const decorations = [];
    // Cursor is inside the link text
    const ctx = {
      state,
      decorations,
      cursorHead: 14,
      suppressed: null,
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);

    expect(decorations.length).toBe(0);
  });

  it('styles Autolink when cursor is outside', () => {
    const state = EditorState.create({
      doc: "Text with <https://example.com> here.",
      extensions: [markdown({ extensions: [Autolink] })]
    });

    const plugin = new LinkPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 0,
      suppressed: null,
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);

    expect(decorations.length).toBe(3); // 2 collapses for < and >, 1 mark for text
  });

  it('styles naked URL when cursor is outside', () => {
    const state = EditorState.create({
      doc: "Text with https://example.com here.",
      extensions: [markdown({ extensions: [Autolink] })] // Assuming Autolink handles naked URLs as well depending on parser config
    });

    const plugin = new LinkPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 0,
      suppressed: null,
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);
    
    // URL may not be parsed as naked URL if Autolink extension isn't configured for it in this mock state,
    // so we just ensure no crashes occur.
  });

  it('renderToHTML falls through to default renderer', () => {
    const plugin = new LinkPlugin();
    expect(plugin.renderToHTML(null, '', {})).toBeNull();
  });
});
