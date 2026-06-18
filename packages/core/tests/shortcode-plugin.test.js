import { describe, it, expect } from 'vitest';
import { ShortcodePlugin, ImageShortcodeWidget, ComponentShortcodeWidget } from '../src/plugins/shortcode-plugin.js';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';

describe('ShortcodePlugin', () => {
  it('instantiates correctly', () => {
    const plugin = new ShortcodePlugin();
    expect(plugin.name).toBe('shortcode');
    expect(plugin.requiredNodes).toContain('ImageShortcode');
    expect(plugin.requiredNodes).toContain('ComponentShortcode');
  });
});
