import { describe, it, expect } from 'vitest';
import { MathPlugin, MathWidget } from '../src/plugins/math-plugin.js';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';

describe('MathPlugin', () => {
  it('instantiates correctly', () => {
    const plugin = new MathPlugin();
    expect(plugin.name).toBe('math');
    expect(plugin.requiredNodes).toContain('InlineMath');
    expect(plugin.requiredNodes).toContain('BlockMath');
  });

  // Note: standard @codemirror/lang-markdown doesn't parse Math out of the box unless configured with the markdown-math extension.
  // We mock the state AST matching instead of actual parsing.
});
