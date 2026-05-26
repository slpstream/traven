import { describe, it, expect, beforeEach } from 'vitest';
import { TravenEditor } from '../src/index.js';
import { parseMarkdownTable, serializeTableToMarkdown } from '../src/toolbar/modal.js';

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

describe('parseMarkdownTable', () => {
  it('parses a basic markdown table correctly', () => {
    const tableText = [
      '| Col 1 | Col 2 |',
      '|-------|-------|',
      '| Val 1 | Val 2 |',
      '| Val 3 | Val 4 |'
    ].join('\n');

    const result = parseMarkdownTable(tableText);
    expect(result).not.toBeNull();
    expect(result.headers).toEqual(['Col 1', 'Col 2']);
    expect(result.rows).toEqual([
      ['Val 1', 'Val 2'],
      ['Val 3', 'Val 4']
    ]);
  });

  it('parses alignments correctly', () => {
    const tableText = [
      '| Left | Center | Right | Default |',
      '| :--- | :---:  |  ---: | ------- |',
      '| a    | b      | c     | d       |'
    ].join('\n');

    const result = parseMarkdownTable(tableText);
    expect(result).not.toBeNull();
    expect(result.alignments).toEqual(['left', 'center', 'right', 'left']);
  });

  it('un-escapes pipe characters correctly and keeps cell boundaries intact', () => {
    const tableText = [
      '| Col 1 | Col 2 |',
      '|-------|-------|',
      '| a \\| b | c |'
    ].join('\n');

    const result = parseMarkdownTable(tableText);
    expect(result).not.toBeNull();
    expect(result.headers).toEqual(['Col 1', 'Col 2']);
    expect(result.rows).toEqual([
      ['a | b', 'c']
    ]);
  });

  it('returns null for invalid tables', () => {
    expect(parseMarkdownTable('')).toBeNull();
    expect(parseMarkdownTable('just a plain line')).toBeNull();
    expect(parseMarkdownTable('| header |\n| no dashes |')).toBeNull();
  });
});

describe('serializeTableToMarkdown', () => {
  it('serializes table structured data into a pipe-aligned string', () => {
    const headers = ['A', 'B'];
    const rows = [['1', '2'], ['3', '4']];
    const alignments = [null, null];

    const result = serializeTableToMarkdown(headers, rows, alignments);
    expect(result).toBe(
      '| A   | B   |\n' +
      '|-----|-----|\n' +
      '| 1   | 2   |\n' +
      '| 3   | 4   |'
    );
  });

  it('handles alignments in serialization correctly', () => {
    const headers = ['L', 'C', 'R'];
    const rows = [['a', 'b', 'c']];
    const alignments = ['left', 'center', 'right'];

    const result = serializeTableToMarkdown(headers, rows, alignments);
    expect(result).toBe(
      '| L   | C   | R   |\n' +
      '|:----|:---:|----:|\n' +
      '| a   | b   | c   |'
    );
  });

  it('escapes pipe characters in cells during serialization', () => {
    const headers = ['A', 'B'];
    const rows = [['a | b', 'c']];

    const result = serializeTableToMarkdown(headers, rows);
    expect(result).toBe(
      '| A      | B   |\n' +
      '|--------|-----|\n' +
      '| a \\| b | c   |'
    );
  });
});

