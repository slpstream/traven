import { describe, it, expect } from 'vitest';
import { MermaidPlugin, MermaidWidget } from '../src/plugins/mermaid-plugin.js';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';

describe('MermaidPlugin', () => {
  it('instantiates correctly', () => {
    const plugin = new MermaidPlugin();
    expect(plugin.name).toBe('mermaid');
    expect(plugin.requiredNodes).toContain('FencedCode');
  });

  it('replaces Mermaid FencedCode with MermaidWidget when cursor is outside', () => {
    const state = EditorState.create({
      doc: "```mermaid\ngraph TD;\nA-->B;\n```",
      extensions: [markdown()]
    });

    const plugin = new MermaidPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 50, // Cursor outside the block
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);

    expect(decorations.length).toBe(1);
    expect(decorations[0].deco.spec.widget instanceof MermaidWidget).toBe(true);
    expect(decorations[0].deco.spec.widget.code).toBe("graph TD;\nA-->B;");
  });

  it('does not replace Mermaid FencedCode when cursor is inside', () => {
    const state = EditorState.create({
      doc: "```mermaid\ngraph TD;\nA-->B;\n```",
      extensions: [markdown()]
    });

    const plugin = new MermaidPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 15, // Cursor inside the block
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);

    expect(decorations.length).toBe(0);
  });
});
