import { describe, it, expect } from 'vitest';
import { TablePlugin, TableWidget } from '../src/plugins/table-plugin.js';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { Table } from '@lezer/markdown';

describe('TablePlugin', () => {
  it('instantiates correctly', () => {
    const plugin = new TablePlugin();
    expect(plugin.name).toBe('table');
    expect(plugin.requiredNodes).toContain('Table');
  });

  it('replaces Table with TableWidget when cursor is outside', () => {
    const state = EditorState.create({
      doc: "| A | B |\n|---|---|\n| 1 | 2 |",
      extensions: [markdown({ extensions: [Table] })]
    });

    const plugin = new TablePlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 50, // Cursor outside the block
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);

    expect(decorations.length).toBe(1);
    expect(decorations[0].deco.spec.widget instanceof TableWidget).toBe(true);
    expect(decorations[0].deco.spec.widget.tableText).toContain("| A | B |");
  });

  it('decorates Table rows with line classes when cursor is inside', () => {
    const state = EditorState.create({
      doc: "| A | B |\n|---|---|\n| 1 | 2 |",
      extensions: [markdown({ extensions: [Table] })]
    });

    const plugin = new TablePlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 5, // Cursor inside the block
      suppressedFigureRanges: []
    };

    plugin.buildDecorations(ctx);

    const lineDecos = decorations.filter(d => d.deco.spec.class === 'cm-wysiwym-table-row');
    expect(lineDecos.length).toBe(3);
  });
});
