import { describe, it, expect } from 'vitest';
import { CodePlugin } from '../src/plugins/code-plugin.js';
import { MermaidWidget, collapsedFenceLineDeco } from '../src/wysiwym.js';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';

describe('CodePlugin', () => {
  it('instantiates correctly', () => {
    const plugin = new CodePlugin();
    expect(plugin.name).toBe('code');
    expect(plugin.requiredNodes).toContain('FencedCode');
    expect(plugin.requiredNodes).toContain('CodeBlock');
  });

  it('short-circuits and replaces Mermaid FencedCode with MermaidWidget when cursor is outside', () => {
    const state = EditorState.create({
      doc: "```mermaid\ngraph TD;\nA-->B;\n```",
      extensions: [markdown()]
    });

    const plugin = new CodePlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 50, // Cursor outside the block
      suppressed: null
    };

    plugin.buildDecorations(ctx);

    expect(decorations.length).toBe(1);
    expect(decorations[0].deco.spec.widget instanceof MermaidWidget).toBe(true);
    expect(decorations[0].deco.spec.widget.code).toBe("graph TD;\nA-->B;");
  });

  it('decorates FencedCode lines and collapses fences when cursor is outside', () => {
    const state = EditorState.create({
      doc: "```js\nconsole.log(1);\n```",
      extensions: [markdown()]
    });

    const plugin = new CodePlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 50, // Cursor outside the block
      suppressed: null
    };

    plugin.buildDecorations(ctx);

    // Line 1: collapsedFenceLineDeco, collapseDeco
    // Line 2: codeBlockLineSingleDeco
    // Line 3: collapsedFenceLineDeco, collapseDeco
    // Note: Fences collapse entirely.
    const collapses = decorations.filter(d => d.deco.spec.widget === undefined && !d.deco.spec.class);
    expect(collapses.length).toBe(2);

    const collapsedFences = decorations.filter(d => d.deco.spec.class === 'cm-wysiwym-collapsed-fence');
    expect(collapsedFences.length).toBe(2);

    const codeLines = decorations.filter(d => d.deco.spec.class && d.deco.spec.class.includes('cm-wysiwym-codeblock-line'));
    expect(codeLines.length).toBe(1);
    expect(codeLines[0].deco.spec.class).toContain('cm-wysiwym-codeblock-line-first');
    expect(codeLines[0].deco.spec.class).toContain('cm-wysiwym-codeblock-line-last');
  });

  it('decorates FencedCode lines without collapsing fences when cursor is inside', () => {
    const state = EditorState.create({
      doc: "```js\nconsole.log(1);\n```",
      extensions: [markdown()]
    });

    const plugin = new CodePlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 10, // Cursor inside the code block
      suppressed: null
    };

    plugin.buildDecorations(ctx);

    const collapses = decorations.filter(d => d.deco.spec.widget === undefined && !d.deco.spec.class);
    expect(collapses.length).toBe(0);

    const codeLines = decorations.filter(d => d.deco.spec.class && d.deco.spec.class.includes('cm-wysiwym-codeblock-line'));
    expect(codeLines.length).toBe(3); // First fence, content, last fence
    expect(codeLines[0].deco.spec.class).toContain('cm-wysiwym-codeblock-line-first');
    expect(codeLines[2].deco.spec.class).toContain('cm-wysiwym-codeblock-line-last');
  });

  it('decorates CodeBlock (indented) without fence logic', () => {
    const state = EditorState.create({
      doc: "    console.log(1);", // 4 spaces indent
      extensions: [markdown()]
    });

    const plugin = new CodePlugin();
    const decorations = [];
    const ctx = {
      state,
      decorations,
      cursorHead: 50,
      suppressed: null
    };

    plugin.buildDecorations(ctx);

    const codeLines = decorations.filter(d => d.deco.spec.class && d.deco.spec.class.includes('cm-wysiwym-codeblock-line'));
    expect(codeLines.length).toBe(1);
    expect(codeLines[0].deco.spec.class).toContain('cm-wysiwym-codeblock-line-first');
    expect(codeLines[0].deco.spec.class).toContain('cm-wysiwym-codeblock-line-last');
  });
});
