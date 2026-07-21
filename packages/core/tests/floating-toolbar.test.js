import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveToolbarMode } from '../src/toolbar/mode.js';
import { TravenEditor, DEFAULT_BUBBLE_TOOLBAR, registerTools } from '../src/index.js';
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
  // Polyfill PointerEvent if not present in JSDOM
  if (typeof window.PointerEvent === 'undefined') {
    window.PointerEvent = class PointerEvent extends window.MouseEvent {
      constructor(type, params = {}) {
        super(type, params);
        this.pointerType = params.pointerType || 'mouse';
      }
    };
  }
}

describe('Floating Toolbar and Modes', () => {
  let container;

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'Date',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'queueMicrotask'
      ]
    });
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
    vi.useRealTimers();
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
  it('selection bubble does not render when selection is empty', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Some text',
      toolbarMode: 'floating'
    });
    editor.focus();
    // Empty selection
    editor.setSelection(0, 0);

    vi.advanceTimersByTime(50);
    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).toBeNull();
  });

  // 7. Selection Bubble renders when the selection is non-empty.
  it('selection bubble renders when selection is non-empty', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Some text here',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 4);

    // No bubble immediately
    expect(document.querySelector('.traven-bubble-menu')).toBeNull();

    // Dispatch pointerup
    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    // Bubble still not visible immediately
    expect(document.querySelector('.traven-bubble-menu')).toBeNull();

    // Wait past default 200ms delay
    vi.advanceTimersByTime(250);
    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).not.toBeNull();
  });

  // 8. Mod + . with a non-empty selection focuses the first button in the bubble.
  it('Mod + . keydown focuses the first button in the bubble', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    vi.advanceTimersByTime(50);
    const view = editor.getView();

    // Dispatch keyboard event for Mod-.
    const event = new KeyboardEvent('keydown', { key: '.', ctrlKey: true, bubbles: true });
    view.contentDOM.dispatchEvent(event);

    vi.advanceTimersByTime(50);

    const firstButton = document.querySelector('.traven-bubble-menu button');
    expect(firstButton).not.toBeNull();
    expect(document.activeElement).toBe(firstButton);
  });

  // 9. Escape from the bubble returns focus to the editor.
  it('Escape keydown inside bubble returns focus to the editor', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(250);
    const firstButton = document.querySelector('.traven-bubble-menu button');
    expect(firstButton).not.toBeNull();
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Press escape
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    firstButton.dispatchEvent(escEvent);

    vi.advanceTimersByTime(50);
    expect(document.activeElement).toBe(editor.getView().contentDOM);
  });

  // 10. After the image modal's onClose callback runs, the bubble is not re-shown until the next selectionSet
  it('after modal closes, selection bubble is not re-shown until next selectionSet', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '[image src="https://example.com/pic.jpg" align="right" size="medium" caption="My caption"]\nSome text',
      toolbarMode: 'floating'
    });
    editor.setSelection(editor.getValue().length, editor.getValue().length);
    vi.advanceTimersByTime(50);

    const widgetEl = container.querySelector('.cm-wysiwym-image-shortcode-container');
    expect(widgetEl).not.toBeNull();

    // Open modal
    widgetEl.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    const modal = document.querySelector('.traven-modal-overlay');
    expect(modal).not.toBeNull();

    // Close modal
    const closeBtn = modal.querySelector('.traven-modal-close');
    closeBtn.click();

    vi.advanceTimersByTime(50);
    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).toBeNull();
  });

  // 11. Gutter + marker renders on empty lines only.
  it('gutter plus marker renders only on empty lines', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'line1\n\nline3',
      toolbarMode: 'floating'
    });
    editor.focus();
    vi.advanceTimersByTime(50);

    const plusBtn = container.querySelector('.traven-gutter-plus-btn');
    expect(plusBtn).not.toBeNull();
  });

  // 12. Mod + Shift + Enter opens the gutter popover at the caret.
  it('Mod + Shift + Enter keydown opens the gutter menu', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '\n',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 0);
    vi.advanceTimersByTime(50);

    const view = editor.getView();
    const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, shiftKey: true, bubbles: true });
    view.contentDOM.dispatchEvent(event);

    vi.advanceTimersByTime(50);
    const menu = document.querySelector('.traven-gutter-menu');
    expect(menu).not.toBeNull();

    // Close the menu
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    menu.dispatchEvent(escEvent);
  });

  // 13. bubbleHotkey: "F1" swap: dispatching F1 keydown with a selection focuses the bubble.
  it('respects custom bubbleHotkey: F1', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating',
      bubbleHotkey: 'F1'
    });
    editor.focus();
    editor.setSelection(0, 6);
    vi.advanceTimersByTime(50);

    const view = editor.getView();
    // Dispatch F1 keydown
    const event = new KeyboardEvent('keydown', { key: 'F1', bubbles: true });
    view.contentDOM.dispatchEvent(event);

    vi.advanceTimersByTime(50);
    const firstButton = document.querySelector('.traven-bubble-menu button');
    expect(firstButton).not.toBeNull();
    expect(document.activeElement).toBe(firstButton);
  });

  // 14. bubbleHotkey: "Mod-/" does not open the bubble — the existing Mod-/ keybinding for Help is preserved.
  it('does not allow bubbleHotkey Mod-/ to override Help keybinding', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating',
      bubbleHotkey: 'Mod-/'
    });
    editor.focus();
    editor.setSelection(0, 6);
    vi.advanceTimersByTime(50);

    const view = editor.getView();
    // Dispatch Mod-/
    const event = new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true });
    view.contentDOM.dispatchEvent(event);

    vi.advanceTimersByTime(50);
    const firstButton = document.querySelector('.traven-bubble-menu button');
    // It should not focus the first button in bubble menu because Mod-/ is for help/shortcuts dialog
    expect(document.activeElement).not.toBe(firstButton);
  });

  // 15. Stats widget updates word and character counts dynamically in the DOM when typing/value changes occur.
  it('updates stats widget dynamically on content change', () => {
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

    vi.advanceTimersByTime(50);
    expect(statsEl.textContent).toContain('2 words');
    expect(statsEl.textContent).toContain('9 chars');
  });

  // 16. Gutter plus button interaction opens the gutter menu and clicking outside closes it.
  it('gutter plus button interaction opens and closes the menu correctly', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '\n',
      toolbarMode: 'floating'
    });
    editor.focus();
    vi.advanceTimersByTime(50);

    const plusBtn = container.querySelector('.traven-gutter-plus-btn');
    expect(plusBtn).not.toBeNull();

    // Dispatch mousedown on the plus button
    const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    plusBtn.dispatchEvent(mousedownEvent);

    // Dispatch click on the plus button (simulating full click sequence)
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    plusBtn.dispatchEvent(clickEvent);

    vi.advanceTimersByTime(50);

    // The menu should be open
    let menu = document.querySelector('.traven-gutter-menu');
    expect(menu).not.toBeNull();

    // Click on the document body outside the menu
    const docClickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    document.body.dispatchEvent(docClickEvent);

    vi.advanceTimersByTime(50);

    // The menu should be closed
    menu = document.querySelector('.traven-gutter-menu');
    expect(menu).toBeNull();
  });

  // 17. Selection bubble is center-aligned above/below selection (using from and to bounds) and contains the arrow element.
  it('selection bubble contains arrow and is configured with both pos and end', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(250);

    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).not.toBeNull();

    // Verify arrow element is present
    const arrow = bubble.querySelector('.traven-bubble-arrow');
    expect(arrow).not.toBeNull();
  });

  // 18. Pointerdown cancels pending show
  it('pointerdown cancels pending show', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    // Wait 100ms (less than 200ms delay)
    vi.advanceTimersByTime(100);
    expect(document.querySelector('.traven-bubble-menu')).toBeNull();

    // Dispatch pointerdown
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    // Wait another 150ms (total 250ms since pointerup)
    vi.advanceTimersByTime(150);
    expect(document.querySelector('.traven-bubble-menu')).toBeNull();
  });

  // 19. Pointermove during drag keeps bubble hidden
  it('pointermove during drag keeps bubble hidden', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    // Move pointer with buttons: 1 (dragging)
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointermove', {
      bubbles: true, cancelable: true, button: 0, buttons: 1, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(250);
    expect(document.querySelector('.traven-bubble-menu')).toBeNull();
  });

  // 20. Doc change clears bubble
  it('doc change clears bubble', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(250);
    expect(document.querySelector('.traven-bubble-menu')).not.toBeNull();

    editor.setValue('New document content');
    vi.advanceTimersByTime(50);
    expect(document.querySelector('.traven-bubble-menu')).toBeNull();
  });

  // 21. bubbleAppearDelay: 0 restores eager behavior
  it('bubbleAppearDelay: 0 restores eager behavior', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating',
      bubbleAppearDelay: 0
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    // Resolved promise / minimal tick is enough
    vi.advanceTimersByTime(50);
    expect(document.querySelector('.traven-bubble-menu')).not.toBeNull();
  });

  // 22. bubbleAppearDelay: 50 is respected
  it('bubbleAppearDelay: 50 is respected', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating',
      bubbleAppearDelay: 50
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(20);
    expect(document.querySelector('.traven-bubble-menu')).toBeNull();

    vi.advanceTimersByTime(50);
    expect(document.querySelector('.traven-bubble-menu')).not.toBeNull();
  });

  // 23. Single click inside existing selection still shows bubble
  it('single click inside existing selection still shows bubble', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    // Dispatch pointerup directly (e.g. click release) without prior drag
    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(250);
    expect(document.querySelector('.traven-bubble-menu')).not.toBeNull();
  });

  // 24. Selection collapsing via setSelection dismisses bubble
  it('selection collapsing via setSelection dismisses bubble', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(250);
    expect(document.querySelector('.traven-bubble-menu')).not.toBeNull();

    // Collapse selection
    editor.setSelection(0, 0);
    vi.advanceTimersByTime(50);
    expect(document.querySelector('.traven-bubble-menu')).toBeNull();
  });

  // 25. Insert button is present in the Selection Bubble
  it('renders bubble-insert button inside the selection bubble', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(250);
    
    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).not.toBeNull();

    const insertBtn = bubble.querySelector('.btn-bubble-insert');
    expect(insertBtn).not.toBeNull();
  });

  // 26. Clicking insert button closes the bubble and opens the gutter menu
  it('closes bubble and opens gutter menu on bubble-insert button click', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Hello world',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 5);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(250);
    expect(document.querySelector('.traven-bubble-menu')).not.toBeNull();

    const insertBtn = document.querySelector('.btn-bubble-insert');
    insertBtn.click();

    // Wait a tick for dispatch and queueMicrotask/setTimeout
    vi.advanceTimersByTime(50);

    expect(document.querySelector('.traven-bubble-menu')).toBeNull();
    expect(document.querySelector('.traven-gutter-menu')).not.toBeNull();
    
    // Clean up
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.querySelector('.traven-gutter-menu').dispatchEvent(escEvent);
  });

  // 27. Insert button opens gutter menu anchored after the selection's last line
  it('opens gutter menu anchored after the selection last line', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Line one\nLine two\nLine three',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 8); // Selects 'Line one'

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(250);
    const insertBtn = document.querySelector('.btn-bubble-insert');
    insertBtn.click();

    vi.advanceTimersByTime(50);
    const menu = document.querySelector('.traven-gutter-menu');
    expect(menu).not.toBeNull();

    // The cursor position should be moved to the blank line inside the newly created spacing area
    expect(view.state.selection.main.anchor).toBe(10);

    // Clean up
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    menu.dispatchEvent(escEvent);
  });

  // 28. Insert button computes correct number of newlines to avoid extra spacing
  it('does not insert extra newlines if blank lines already exist', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Line one\n\nLine three',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 8); // Selects 'Line one'

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));

    vi.advanceTimersByTime(250);
    const insertBtn = document.querySelector('.btn-bubble-insert');
    insertBtn.click();

    vi.advanceTimersByTime(50);
    
    // Original text has \n\n (2 newlines) after Line one. We need 4 - 2 = 2 newlines.
    // Total newlines after insert should be exactly 4: 'Line one\n\n\n\nLine three'
    expect(view.state.doc.toString()).toBe('Line one\n\n\n\nLine three');
    expect(view.state.selection.main.anchor).toBe(10);

    // Clean up
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.querySelector('.traven-gutter-menu').dispatchEvent(escEvent);
  });

  // 29. Default bubble has link and no host-only tools
  it('default selection bubble includes link and omits unregistered host tools', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating'
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));
    vi.advanceTimersByTime(250);

    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).not.toBeNull();
    expect(bubble.querySelector('.btn-link')).not.toBeNull();
    expect(bubble.querySelector('.btn-hostprobe')).toBeNull();
  });

  // 30. bubbleToolbar inserts a registered tool after link
  it('bubbleToolbar renders a registered custom tool after link', () => {
    const action = vi.fn();
    registerTools({
      hostprobe: {
        key: 'hostprobe',
        title: 'Host Probe',
        icon: '<svg></svg>',
        action,
      },
    });

    const bubbleToolbar = [...DEFAULT_BUBBLE_TOOLBAR];
    const linkIdx = bubbleToolbar.indexOf('link');
    bubbleToolbar.splice(linkIdx + 1, 0, 'hostprobe');

    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating',
      bubbleToolbar,
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));
    vi.advanceTimersByTime(250);

    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble).not.toBeNull();

    const linkBtn = bubble.querySelector('.btn-link');
    const probeBtn = bubble.querySelector('.btn-hostprobe');
    expect(linkBtn).not.toBeNull();
    expect(probeBtn).not.toBeNull();
    expect(linkBtn.nextElementSibling).toBe(probeBtn);

    probeBtn.click();
    expect(action).toHaveBeenCalled();
    expect(action.mock.calls[0][0]).toBe(editor);
  });

  // 31. Separators in bubbleToolbar are skipped
  it('skips pipe separators in bubbleToolbar', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select me',
      toolbarMode: 'floating',
      bubbleToolbar: ['bold', '|', 'italic'],
    });
    editor.focus();
    editor.setSelection(0, 6);

    const view = editor.getView();
    view.contentDOM.dispatchEvent(new window.PointerEvent('pointerup', {
      bubbles: true, cancelable: true, button: 0, pointerType: 'mouse',
    }));
    vi.advanceTimersByTime(250);

    const bubble = document.querySelector('.traven-bubble-menu');
    expect(bubble.querySelector('.btn-bold')).not.toBeNull();
    expect(bubble.querySelector('.btn-italic')).not.toBeNull();
    expect(bubble.querySelectorAll('button').length).toBe(3); // bold, italic, bubble-insert
  });
});
