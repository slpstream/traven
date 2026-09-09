import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxTree } from '@codemirror/language';
import { MdxComponents } from '../src/mdx-parser.js';

function parseNames(doc) {
  const state = EditorState.create({
    doc,
    extensions: [markdown({ extensions: [MdxComponents] })],
  });
  const names = [];
  syntaxTree(state).iterate({
    enter(node) {
      names.push(node.name);
    },
  });
  return names;
}

describe('MdxComponents tokenizer', () => {
  it('parses a self-closing Image tag as MdxMediaTag', () => {
    const names = parseNames('<Image src="x" />');
    expect(names).toContain('MdxMediaTag');
    expect(names).toContain('MdxTagName');
    expect(names).toContain('MdxAttribute');
  });

  it('does not treat lowercase HTML/SVG tags as MDX', () => {
    expect(parseNames('<video src="x">')).not.toContain('MdxMediaTag');
    expect(parseNames('<image href="x">')).not.toContain('MdxMediaTag');
  });

  it('parses an inline Quote container', () => {
    const names = parseNames('<Quote author="A">hi</Quote>');
    expect(names).toContain('MdxContainerTag');
    expect(names).toContain('MdxContainerOpen');
    expect(names).toContain('MdxContainerBody');
    expect(names).toContain('MdxContainerClose');
  });

  it('parses multi-line Figure as open/close leaves around inner markdown', () => {
    const names = parseNames('<Figure caption="Code">\n```js\nconst a = 1;\n```\n</Figure>');
    expect(names).toContain('MdxContainerOpen');
    expect(names).toContain('MdxContainerClose');
    expect(names).toContain('FencedCode');
  });

  it('parses multi-line Quote close as a block after a paragraph', () => {
    const names = parseNames('<Quote author="Ada">\nHello\n</Quote>');
    expect(names).toContain('MdxContainerOpen');
    expect(names).toContain('MdxContainerClose');
    expect(names).toContain('Paragraph');
  });

  it('does not emit a media node for an incomplete tag', () => {
    expect(parseNames('<Image src="')).not.toContain('MdxMediaTag');
  });
});
