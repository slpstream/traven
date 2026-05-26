import { describe, it, expect, beforeEach } from 'vitest';
import { TravenEditor } from '../src/index.js';

// Polyfill Range.prototype.getClientRects and getBoundingClientRect for JSDOM / CodeMirror 6 compatibility
if (typeof window !== 'undefined') {
  window.Range.prototype.getClientRects = function() {
    return {
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {}
    };
  };
  window.Range.prototype.getBoundingClientRect = function() {
    return {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0
    };
  };
}

describe('TravenEditor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('can be instantiated', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Hello World',
    });
    expect(editor).toBeDefined();
    expect(editor.getValue()).toBe('Hello World');
  });

  it('can focus the editor programmatically', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Focus Test',
    });
    editor.focus();
    expect(document.activeElement).toBe(editor.getView().contentDOM);
  });

  it('can set and get values', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Start',
    });
    editor.setValue('Updated Content');
    expect(editor.getValue()).toBe('Updated Content');
  });

  it('can toggle read-only mode dynamically', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Read Only Test',
      readOnly: false,
    });
    
    expect(editor.isReadOnly()).toBe(false);

    editor.setReadOnly(true);
    expect(editor.isReadOnly()).toBe(true);

    editor.setReadOnly(false);
    expect(editor.isReadOnly()).toBe(false);
  });

  it('correctly tracks document stats', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'One two three four words.',
    });
    expect(editor.getCharacterCount()).toBe(25);
    expect(editor.getWordCount()).toBe(5);
    expect(editor.getReadTime()).toBe(1);
  });

  it('can get and set selection range', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'Select this text',
    });
    editor.setSelection(7, 11);
    expect(editor.getSelection()).toBe('this');
  });

  it('can manipulate text casing', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: 'hello world',
    });
    
    editor.setSelection(0, 5);
    editor.toUpperCase();
    expect(editor.getValue()).toBe('HELLO world');

    editor.setSelection(0, 11);
    editor.toLowerCase();
    expect(editor.getValue()).toBe('hello world');

    editor.setSelection(0, 11);
    editor.capitalizeWords();
    expect(editor.getValue()).toBe('Hello World');
  });

  it('can strip markdown formatting with removeFormatting()', () => {
    const editor = new TravenEditor({
      element: container,
      initialValue: '### Hello **World** with `code`, ~~strike~~ and ==highlight==',
    });

    // Select the whole document to strip formatting
    editor.setSelection(0, editor.getValue().length);
    editor.removeFormatting();
    expect(editor.getValue()).toBe('Hello World with code, strike and highlight');
  });
});
