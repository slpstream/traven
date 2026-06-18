import { describe, it, expect } from 'vitest';
import { FrontmatterPlugin } from '../src/plugins/frontmatter-plugin.js';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { yamlFrontmatter } from '@codemirror/lang-yaml';

describe('FrontmatterPlugin', () => {
  it('instantiates correctly', () => {
    const plugin = new FrontmatterPlugin();
    expect(plugin.name).toBe('frontmatter');
    expect(plugin.requiredNodes).toContain('Frontmatter');
  });

  it('decorates lines and collapses delimiters when cursor is outside', () => {
    const state = EditorState.create({
      doc: "---\ntitle: Hello\n---\nBody text",
      extensions: [yamlFrontmatter({ content: markdown() })]
    });

    const plugin = new FrontmatterPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 50, // Cursor outside frontmatter
      suppressed: null
    };

    plugin.buildDecorations(ctx);

    // Should collapse first 3 and last 3 chars of the node
    const collapses = decorations.filter(d => d.deco.spec.widget === undefined && !d.deco.spec.class);
    expect(collapses.length).toBe(2);

    // The inner content line (line 2) should have frontmatterLineDeco, but not the delimiter lines
    const lineDecos = decorations.filter(d => d.deco.spec.class === 'cm-wysiwym-frontmatter');
    expect(lineDecos.length).toBe(1); // Only "title: Hello" gets line decorated
  });

  it('decorates all lines including delimiters with active class when cursor is inside', () => {
    const state = EditorState.create({
      doc: "---\ntitle: Hello\n---\nBody text",
      extensions: [yamlFrontmatter({ content: markdown() })]
    });

    const plugin = new FrontmatterPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 5, // Cursor inside frontmatter (after ---)
      suppressed: null
    };

    plugin.buildDecorations(ctx);

    // No collapses
    const collapses = decorations.filter(d => d.deco.spec.widget === undefined && !d.deco.spec.class);
    expect(collapses.length).toBe(0);

    // All three lines should get frontmatterActiveLineDeco
    const lineDecos = decorations.filter(d => d.deco.spec.class === 'cm-wysiwym-frontmatter-active');
    expect(lineDecos.length).toBe(3);
  });
});
