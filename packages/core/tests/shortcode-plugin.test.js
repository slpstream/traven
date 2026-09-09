import { describe, it, expect } from 'vitest';
import { ComponentPlugin, ImageShortcodeWidget, ComponentShortcodeWidget } from '../src/plugins/component-plugin.js';

describe('ComponentPlugin', () => {
  it('instantiates correctly', () => {
    const plugin = new ComponentPlugin();
    expect(plugin.name).toBe('component');
    expect(plugin.requiredNodes).toContain('MdxMediaTag');
    expect(plugin.requiredNodes).toContain('MdxContainerTag');
    expect(typeof ImageShortcodeWidget).toBe('function');
    expect(typeof ComponentShortcodeWidget).toBe('function');
  });
});
