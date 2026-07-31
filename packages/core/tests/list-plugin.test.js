import { describe, it, expect, vi } from 'vitest';
import { ListPlugin, CheckboxWidget, BulletWidget, HiddenBulletWidget } from '../src/plugins/list-plugin.js';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { TaskList } from '@lezer/markdown';
import { ensureSyntaxTree } from '@codemirror/language';

describe('ListPlugin', () => {
  it('instantiates correctly', () => {
    const plugin = new ListPlugin();
    expect(plugin.name).toBe('list');
    expect(plugin.requiredNodes).toContain('TaskMarker');
    expect(plugin.requiredNodes).toContain('ListMark');
  });

  it('replaces TaskMarker with CheckboxWidget when cursor is off the line', () => {
    const state = EditorState.create({
      doc: "- [x] Done\n- [ ] Todo",
      extensions: [markdown({ extensions: [TaskList] })]
    });
    // TaskList ListMark + TaskMarker pairing needs a fully parsed tree
    ensureSyntaxTree(state, state.doc.length, 5000);

    const plugin = new ListPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorLine: 3, // Cursor is on line 3, off the task items
      suppressed: null
    };

    plugin.buildDecorations(ctx);

    const checkboxes = decorations.filter(d => d.deco.spec.widget instanceof CheckboxWidget);
    const hiddenBullets = decorations.filter(d => d.deco.spec.widget instanceof HiddenBulletWidget);
    expect(checkboxes.length).toBe(2);
    expect(hiddenBullets.length).toBe(2);
    expect(decorations.length).toBe(4); // 2 TaskMarker (CheckboxWidget) + 2 ListMark (HiddenBulletWidget)
    expect(checkboxes[0].deco.spec.widget.checked).toBe(true);
    expect(checkboxes[1].deco.spec.widget.checked).toBe(false);
  });

  it('does not replace TaskMarker when cursor is on the line', () => {
    const state = EditorState.create({
      doc: "- [x] Done\n- [ ] Todo",
      extensions: [markdown({ extensions: [TaskList] })]
    });
    ensureSyntaxTree(state, state.doc.length, 5000);

    const plugin = new ListPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorLine: 1, // Cursor is on line 1, where the first TaskMarker is
      suppressed: null
    };

    plugin.buildDecorations(ctx);

    // Line 1 should not have decorations (no bullet, no checkbox). Line 2 has bullet and checkbox
    const checkboxes = decorations.filter(d => d.deco.spec.widget instanceof CheckboxWidget);
    expect(checkboxes.length).toBe(1);
    expect(checkboxes[0].deco.spec.widget.checked).toBe(false); // Only the second one is decorated
  });

  it('replaces bullet ListMark with BulletWidget when cursor is off the line', () => {
    const state = EditorState.create({
      doc: "* Bullet\n1. Number",
      extensions: [markdown()]
    });
    ensureSyntaxTree(state, state.doc.length, 5000);

    const plugin = new ListPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorLine: 3, // Cursor off
      suppressed: null
    };

    plugin.buildDecorations(ctx);

    // Only bullet list marks should be replaced, not ordered lists
    const bullets = decorations.filter(d => d.deco.spec.widget instanceof BulletWidget);
    expect(bullets.length).toBe(1);
  });

  it('does not replace bullet ListMark when cursor is on the line', () => {
    const state = EditorState.create({
      doc: "* Bullet\n1. Number",
      extensions: [markdown()]
    });
    ensureSyntaxTree(state, state.doc.length, 5000);

    const plugin = new ListPlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorLine: 1, // Cursor on the bullet line
      suppressed: null
    };

    plugin.buildDecorations(ctx);

    const bullets = decorations.filter(d => d.deco.spec.widget instanceof BulletWidget);
    expect(bullets.length).toBe(0);
  });
});
