import { describe, it, expect, vi } from 'vitest';
import { InlinePlugin } from '../src/plugins/inline-plugin.js';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { Strikethrough } from '@lezer/markdown';
import { Highlight } from '../src/highlight-parser.js';

describe('InlinePlugin', () => {
  it('instantiates correctly', () => {
    const plugin = new InlinePlugin();
    expect(plugin.name).toBe('inline');
    expect(plugin.requiredNodes).toContain('StrongEmphasis');
    expect(plugin.requiredNodes).toContain('Emphasis');
    expect(plugin.requiredNodes).toContain('Strikethrough');
    expect(plugin.requiredNodes).toContain('Highlight');
    expect(plugin.requiredNodes).toContain('InlineCode');
  });

  it('collapses delimiters and styles content when cursor is outside', () => {
    const state = EditorState.create({
      doc: "Text with **bold**, *italic*, ~~strike~~, ==high==, and `code`.",
      extensions: [markdown({ extensions: [Strikethrough, Highlight] })]
    });

    const plugin = new InlinePlugin();
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
    
    // Bold: from 10 to 18 "**bold**"
    // Bold collapse starts at 10 and ends at 12 (length 2)
    const collapses = decorations.filter(d => d.deco.spec.widget === undefined && !d.deco.spec.class);
    // 5 nodes, 2 collapses per node = 10 collapse decos
    expect(collapses.length).toBe(10);
  });

  it('does not collapse delimiters when cursor is inside', () => {
    const state = EditorState.create({
      doc: "Text with **bold**",
      extensions: [markdown()]
    });

    const plugin = new InlinePlugin();
    const decorations = [];
    // Cursor is inside the bold text (at index 14)
    const ctx = {
      state,
      decorations,
      cursorHead: 14,
      suppressed: null,
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);

    // No decorations should be generated for bold
    expect(decorations.length).toBe(0);
  });

  it('does collapse delimiters when node is suppressed (even if cursor inside)', () => {
    const state = EditorState.create({
      doc: "Text with **bold**",
      extensions: [markdown()]
    });

    const plugin = new InlinePlugin();
    const decorations = [];
    // Cursor is inside (14)
    const ctx = {
      state,
      decorations,
      cursorHead: 14,
      // But node is suppressed
      suppressed: [{ from: 10, to: 18 }],
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);

    // Decorations SHOULD be generated for bold because it is suppressed (treated as if cursor is outside)
    expect(decorations.length).toBe(3);
  });

  it('collapses InlineCode even if suppressed', () => {
    const state = EditorState.create({
      doc: "Text with `code`",
      extensions: [markdown()]
    });

    const plugin = new InlinePlugin();
    const decorations = [];
    // Cursor is outside (0)
    const ctx = {
      state,
      decorations,
      cursorHead: 0,
      // Node is suppressed
      suppressed: [{ from: 10, to: 16 }],
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);

    // Decorations SHOULD be generated for InlineCode because it ignores suppression
    expect(decorations.length).toBe(3); // 2 collapses, 1 mark
  });

  it('renderToHTML falls through to default renderer', () => {
    const plugin = new InlinePlugin();
    expect(plugin.renderToHTML(null, '', {})).toBeNull();
  });
});
