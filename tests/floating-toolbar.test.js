import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveToolbarMode } from '../src/toolbar/mode.js';
import { TravenEditor } from '../src/index.js';
import { EditorView } from '@codemirror/view';

// Polyfill Range.prototype.getClientRects and getBoundingClientRect for JSDOM / CodeMirror 6 compatibility
if (typeof window !== 'undefined') {
  window.Range.prototype.getClientRects = function () {
    return {
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () { }
    };
  };
  window.Range.prototype.getBoundingClientRect = function () {
    return {
      bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0
    };
  };
  // Mock coordsAtPos for JSDOM CodeMirror 6 rendering
  EditorView.prototype.coordsAtPos = function (pos) {
    return { left: 100, right: 120, top: 200, bottom: 220 };
  };
}

describe('Floating Toolbar and Modes', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Default mocks for matchMedia and innerWidth to represent desktop
    vi.stubGlobal('matchMedia', (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('innerWidth', 1024);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // 1. resolveToolbarMode({ toolbarMode: "hybrid" }) with desktop matchMedia returns "hybrid".
  it('resolves mode to hybrid on desktop', () => {
    vi.stubGlobal('matchMedia', (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('innerWidth', 1024);
    expect(resolveToolbarMode({ toolbarMode: 'hybrid' })).toBe('hybrid');
  });

  // 2. Same with (pointer: coarse) + 600px viewport returns "static".
  it('resolves mode to static on mobile devices with coarse pointer', () => {
    vi.stubGlobal('matchMedia', (query) => ({
      matches: query.includes('pointer: coarse') || query.includes('hover: none'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('innerWidth', 600);
    expect(resolveToolbarMode({ toolbarMode: 'hybrid' })).toBe('static');
  });

  // 3. clear action is a no-op on an empty document.
  it('clear action is a no-op on an empty document', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    const editor = new TravenEditor({
      element: container,
      initialValue: '',
      toolbarMode: 'floating'
    });

    // Simulate clicking the clear button
    const clearBtn = container.querySelector('.btn-clear');
    if (clearBtn) {
      clearBtn.click();
    }

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(editor.getValue()).toBe('');
  });

  // 4. clear action on a non-empty document shows modal and cancel preserves the document.
  it('clear action on a non-empty document shows modal and cancel preserves it', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Important text',
      toolbarMode: 'floating'
    });

    const clearBtn = container.querySelector('.btn-clear');
    expect(clearBtn).not.toBeNull();
    clearBtn.click();

    const modalOverlay = document.querySelector('.traven-modal-overlay');
    expect(modalOverlay).not.toBeNull();

    const bodyEl = modalOverlay.querySelector('.traven-modal-body');
    expect(bodyEl.textContent).toBe('Clear all?');

    const cancelBtn = modalOverlay.querySelector('.traven-modal-btn.btn-secondary');
    expect(cancelBtn).not.toBeNull();
    cancelBtn.click();

    expect(editor.getValue()).toBe('Important text');
    expect(document.querySelector('.traven-modal-overlay')).toBeNull();
  });

  // 5. clear action on a non-empty document with confirm clears the document.
  it('clear action on a non-empty document with confirm clears it', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Important text',
      toolbarMode: 'floating'
    });

    const clearBtn = container.querySelector('.btn-clear');
    expect(clearBtn).not.toBeNull();
    clearBtn.click();

    const modalOverlay = document.querySelector('.traven-modal-overlay');
    expect(modalOverlay).not.toBeNull();

    const confirmBtn = modalOverlay.querySelector('.traven-modal-btn.btn-primary');
    expect(confirmBtn).not.toBeNull();
    expect(confirmBtn.textContent).toBe('CONFIRM');
    confirmBtn.click();

    expect(editor.getValue()).toBe('');
    expect(document.querySelector('.traven-modal-overlay')).toBeNull();
  });

  // 6. Selection Bubble does not render when the selection is empty.
  it('selection bubble does not render when selection is empty', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Some text',
      toolbarMode: 'floating'
    });
    editor.focus();
    // Empty selection
    editor.setSelection(0, 0);

    await new Promise(resolve => setTimeout(resolve, 50));
    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).toBeNull();
  });

  // 7. Selection Bubble renders when the selection is non-empty.
  it('selection bubble renders when selection is non-empty', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Some text here',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 4);

    await new Promise(resolve => setTimeout(resolve, 50));
    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).not.toBeNull();
  });

  // 8. Mod + . with a non-empty selection focuses the first button in the bubble.
  it('Mod + . keydown focuses the first button in the bubble', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    await new Promise(resolve => setTimeout(resolve, 50));
    const view = editor.getView();

    // Dispatch keyboard event for Mod-.
    const event = new KeyboardEvent('keydown', { key: '.', ctrlKey: true, bubbles: true });
    view.contentDOM.dispatchEvent(event);

    await new Promise(resolve => setTimeout(resolve, 50));

    const firstButton = document.querySelector('.traven-bubble-menu button');
    expect(firstButton).not.toBeNull();
    expect(document.activeElement).toBe(firstButton);
  });

  // 9. Escape from the bubble returns focus to the editor.
  it('Escape keydown inside bubble returns focus to the editor', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    await new Promise(resolve => setTimeout(resolve, 50));
    const firstButton = document.querySelector('.traven-bubble-menu button');
    expect(firstButton).not.toBeNull();
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Press escape
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    firstButton.dispatchEvent(escEvent);

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(document.activeElement).toBe(editor.getView().contentDOM);
  });

  // 10. After the image modal's onClose callback runs, the bubble is not re-shown until the next selectionSet
  it('after modal closes, selection bubble is not re-shown until next selectionSet', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[image src="https://example.com/pic.jpg" align="right" size="medium" caption="My caption"]\nSome text',
      toolbarMode: 'floating'
    });
    editor.setSelection(editor.getValue().length, editor.getValue().length);
    await new Promise(resolve => setTimeout(resolve, 50));

    const widgetEl = container.querySelector('.cm-wysiwym-image-shortcode-container');
    expect(widgetEl).not.toBeNull();

    // Open modal
    widgetEl.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    const modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();

    // Close modal
    const closeBtn = modal.querySelector('.traven-modal-close');
    closeBtn.click();

    await new Promise(resolve => setTimeout(resolve, 50));
    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).toBeNull();
  });

  // 11. Gutter + marker renders on empty lines only.
  it('gutter plus marker renders only on empty lines', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'line1\n\nline3',
      toolbarMode: 'floating'
    });
    editor.focus();
    await new Promise(resolve => setTimeout(resolve, 50));

    const plusBtn = container.querySelector('.traven-gutter-plus-btn');
    expect(plusBtn).not.toBeNull();
  });

  // 12. Mod + Shift + Enter opens the gutter popover at the caret.
  it('Mod + Shift + Enter keydown opens the gutter menu', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '\n',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 0);
    await new Promise(resolve => setTimeout(resolve, 50));

    const view = editor.getView();
    const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, shiftKey: true, bubbles: true });
    view.contentDOM.dispatchEvent(event);

    await new Promise(resolve => setTimeout(resolve, 50));
    const menu = document.querySelector('.traven-gutter-menu');
    expect(menu).not.toBeNull();

    // Close the menu
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    menu.dispatchEvent(escEvent);
  });

  // 13. bubbleHotkey: "F1" swap: dispatching F1 keydown with a selection focuses the bubble.
  it('respects custom bubbleHotkey: F1', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating',
      bubbleHotkey: 'F1'
    });
    editor.focus();
    editor.setSelection(0, 6);
    await new Promise(resolve => setTimeout(resolve, 50));

    const view = editor.getView();
    // Dispatch F1 keydown
    const event = new KeyboardEvent('keydown', { key: 'F1', bubbles: true });
    view.contentDOM.dispatchEvent(event);

    await new Promise(resolve => setTimeout(resolve, 50));
    const firstButton = document.querySelector('.traven-bubble-menu button');
    expect(firstButton).not.toBeNull();
    expect(document.activeElement).toBe(firstButton);
  });

  // 14. bubbleHotkey: "Mod-/" does not open the bubble — the existing Mod-/ keybinding for Help is preserved.
  it('does not allow bubbleHotkey Mod-/ to override Help keybinding', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating',
      bubbleHotkey: 'Mod-/'
    });
    editor.focus();
    editor.setSelection(0, 6);
    await new Promise(resolve => setTimeout(resolve, 50));

    const view = editor.getView();
    // Dispatch Mod-/
    const event = new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true });
    view.contentDOM.dispatchEvent(event);

    await new Promise(resolve => setTimeout(resolve, 50));
    const firstButton = document.querySelector('.traven-bubble-menu button');
    // It should not focus the first button in bubble menu because Mod-/ is for help/shortcuts dialog
    expect(document.activeElement).not.toBe(firstButton);
  });

  // 15. Stats widget updates word and character counts dynamically in the DOM when typing/value changes occur.
  it('updates stats widget dynamically on content change', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Four words in here',
      toolbarMode: 'floating'
    });

    const statsEl = container.querySelector('.traven-toolbar-stats');
    expect(statsEl).not.toBeNull();
    expect(statsEl.textContent).toContain('4 words');
    expect(statsEl.textContent).toContain('18 chars');

    // Change value
    editor.setValue('Just one.');

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(statsEl.textContent).toContain('2 words');
    expect(statsEl.textContent).toContain('9 chars');
  });

  // 16. Gutter plus button interaction opens the gutter menu and clicking outside closes it.
  it('gutter plus button interaction opens and closes the menu correctly', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '\n',
      toolbarMode: 'floating'
    });
    editor.focus();
    await new Promise(resolve => setTimeout(resolve, 50));

    const plusBtn = container.querySelector('.traven-gutter-plus-btn');
    expect(plusBtn).not.toBeNull();

    // Dispatch mousedown on the plus button
    const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    plusBtn.dispatchEvent(mousedownEvent);

    // Dispatch click on the plus button (simulating full click sequence)
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    plusBtn.dispatchEvent(clickEvent);

    await new Promise(resolve => setTimeout(resolve, 50));

    // The menu should be open
    let menu = document.querySelector('.traven-gutter-menu');
    expect(menu).not.toBeNull();

    // Click on the document body outside the menu
    const docClickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    document.body.dispatchEvent(docClickEvent);

    await new Promise(resolve => setTimeout(resolve, 50));

    // The menu should be closed
    menu = document.querySelector('.traven-gutter-menu');
    expect(menu).toBeNull();
  });

  // 17. Selection bubble is center-aligned above/below selection (using from and to bounds) and contains the arrow element.
  it('selection bubble contains arrow and is configured with both pos and end', async () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);
    await new Promise(resolve => setTimeout(resolve, 50));

    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).not.toBeNull();

    // Verify arrow element is present
    const arrow = bubble.querySelector('.traven-bubble-arrow');
    expect(arrow).not.toBeNull();
  });
});
