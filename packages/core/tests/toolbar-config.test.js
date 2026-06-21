import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getEffectiveToolbar, TOOL_CATEGORIES, LOCKED_TOOLS } from '../src/toolbar/toolbar-config.js';
import { openSettingsModal } from '../src/toolbar/modal-settings.js';

describe('Toolbar Configuration & Scoping', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns original toolbar when no configuration is saved in localStorage', () => {
    const original = ['bold', 'italic', '|', 'heading', 'settings'];
    const effective = getEffectiveToolbar(original, 'default');
    expect(effective).toEqual(original);
  });

  it('filters tools based on localStorage saved preferences', () => {
    const original = ['bold', 'italic', '|', 'heading', 'settings'];
    // User disabled 'italic' and 'heading'
    localStorage.setItem('traven-toolbar-config:default', JSON.stringify(['bold', 'settings']));

    const effective = getEffectiveToolbar(original, 'default');
    // 'bold' and 'settings' remain, 'italic' and 'heading' are removed.
    // The separator remains because it is between 'bold' and 'settings'.
    expect(effective).toEqual(['bold', '|', 'settings']);
  });

  it('sanitizes consecutive and orphaned separators correctly', () => {
    const original = ['|', '|', 'bold', '|', '|', 'italic', '|', '|'];
    // With no saved config, it returns the original, but let's see what happens if we filter:
    localStorage.setItem('traven-toolbar-config:default', JSON.stringify(['bold', 'italic']));

    const effective = getEffectiveToolbar(original, 'default');
    // Leading, trailing, and duplicate separators should be cleaned up.
    expect(effective).toEqual(['bold', '|', 'italic']);
  });

  it('always keeps locked tools regardless of saved settings', () => {
    const original = ['bold', 'settings'];
    // Save settings that only contain bold
    localStorage.setItem('traven-toolbar-config:default', JSON.stringify(['bold']));

    const effective = getEffectiveToolbar(original, 'default');
    // settings must still be present because it is a LOCKED_TOOL
    expect(effective).toEqual(['bold', 'settings']);
  });

  it('respects different scope keys to isolate editors', () => {
    const original = ['bold', 'italic', 'settings'];
    
    // Save scope "editorA" as bold only
    localStorage.setItem('traven-toolbar-config:editorA', JSON.stringify(['bold']));
    // Save scope "editorB" as italic only
    localStorage.setItem('traven-toolbar-config:editorB', JSON.stringify(['italic']));

    const effA = getEffectiveToolbar(original, 'editorA');
    const effB = getEffectiveToolbar(original, 'editorB');

    expect(effA).toEqual(['bold', 'settings']);
    expect(effB).toEqual(['italic', 'settings']);
  });
});

describe('Settings Modal UI', () => {
  let container;
  let mockEditor;
  let triggerBtn;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);

    triggerBtn = document.createElement('button');
    container.appendChild(triggerBtn);

    mockEditor = {
      getToolbarConfig: () => ['bold', 'italic', 'heading', 'settings'],
      getToolbarScope: () => 'test-scope',
      rebuildToolbar: vi.fn(),
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders modal with correct categories and checkboxes for available tools only', () => {
    const toolRegistry = {
      bold: { key: 'bold', title: 'Bold', icon: '<b>B</b>' },
      italic: { key: 'italic', title: 'Italic', icon: '<i>I</i>' },
      heading: { key: 'heading', title: 'Heading 1', icon: '<h1>H</h1>' },
      settings: { key: 'settings', title: 'Settings', icon: '<svg>cog</svg>' },
      link: { key: 'link', title: 'Link', icon: '<a>L</a>' } // Not in integrator's toolbar
    };

    openSettingsModal(mockEditor, triggerBtn, {
      toolRegistry,
      integratorToolbar: mockEditor.getToolbarConfig(),
      scope: mockEditor.getToolbarScope(),
    });

    const modal = document.querySelector('.traven-modal-settings');
    expect(modal).not.toBeNull();

    // Check if the tabs exist
    const tabs = modal.querySelectorAll('.help-tab-btn');
    // Categories containing available tools: Bold (Formatting), Heading (Structure), Settings (LOCKED, but where is settings? settings is a locked tool but not in category? Wait, settings is in LOCKED_TOOLS, is it in categories? No, settings is not in TOOL_CATEGORIES, but let's check: LOCKED_TOOLS has settings. It doesn't appear in categories tabs, or does it? If a tool is not in TOOL_CATEGORIES, it won't render under any category, but settings is locked anyway.)
    // Let's verify: TOOL_CATEGORIES has bold, italic, heading. link is in Media & Links. But link is not in integratorToolbar.
    // So only "Formatting" (bold, italic) and "Structure" (heading) tabs should be present.
    const tabTexts = Array.from(tabs).map(t => t.textContent);
    expect(tabTexts).toContain('Formatting');
    expect(tabTexts).toContain('Structure');
    expect(tabTexts).not.toContain('Media & Links'); // link is not in integratorToolbar, so no Media & Links tab

    // Checkboxes should exist for bold, italic, heading
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3); // bold, italic, heading

    modal.querySelector('.traven-modal-close').click();
  });

  it('saves selections to scoped localStorage and calls rebuildToolbar when Save & Apply is clicked', () => {
    const toolRegistry = {
      bold: { key: 'bold', title: 'Bold', icon: '<b>B</b>' },
      italic: { key: 'italic', title: 'Italic', icon: '<i>I</i>' },
      heading: { key: 'heading', title: 'Heading 1', icon: '<h1>H</h1>' },
      settings: { key: 'settings', title: 'Settings', icon: '<svg>cog</svg>' },
    };

    openSettingsModal(mockEditor, triggerBtn, {
      toolRegistry,
      integratorToolbar: mockEditor.getToolbarConfig(),
      scope: 'custom-scope',
    });

    const modal = document.querySelector('.traven-modal-settings');
    const checkboxBold = modal.querySelector('input[type="checkbox"]'); // first checkbox is bold
    expect(checkboxBold.checked).toBe(true);

    // Uncheck bold
    checkboxBold.click();
    expect(checkboxBold.checked).toBe(false);

    // Click Save & Apply
    const saveBtn = Array.from(modal.querySelectorAll('.traven-modal-btn')).find(b => b.textContent === 'Save & Apply');
    saveBtn.click();

    // Verify localStorage has saved the correct remaining items (italic, heading)
    const saved = JSON.parse(localStorage.getItem('traven-toolbar-config:custom-scope'));
    expect(saved).toContain('italic');
    expect(saved).toContain('heading');
    expect(saved).not.toContain('bold');

    // Verify editor.rebuildToolbar was called
    expect(mockEditor.rebuildToolbar).toHaveBeenCalled();

    // Modal is closed
    expect(document.querySelector('.traven-modal-settings')).toBeNull();
  });

  it('resets to default and restores checkboxes matching integrator toolbar on Reset button click', () => {
    const toolRegistry = {
      bold: { key: 'bold', title: 'Bold', icon: '<b>B</b>' },
      italic: { key: 'italic', title: 'Italic', icon: '<i>I</i>' },
      heading: { key: 'heading', title: 'Heading 1', icon: '<h1>H</h1>' },
      settings: { key: 'settings', title: 'Settings', icon: '<svg>cog</svg>' },
    };

    // Pre-save setting where bold is off
    localStorage.setItem('traven-toolbar-config:test-scope', JSON.stringify(['italic', 'heading']));

    openSettingsModal(mockEditor, triggerBtn, {
      toolRegistry,
      integratorToolbar: mockEditor.getToolbarConfig(),
      scope: 'test-scope',
    });

    const modal = document.querySelector('.traven-modal-settings');
    // First checkbox (bold) should be unchecked initially
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes[0].checked).toBe(false); // bold is unchecked

    // Click Reset to Default
    const resetBtn = Array.from(modal.querySelectorAll('.traven-modal-btn')).find(b => b.textContent === 'Reset to Default');
    resetBtn.click();

    // Bold should now be checked again
    expect(checkboxes[0].checked).toBe(true);

    modal.querySelector('.traven-modal-close').click();
  });
});
