import { describe, it, expect } from 'vitest';
import { parseAttrPairs, parseAttrMap } from '../src/attr-parser.js';

describe('attr-parser (linear time attribute parser)', () => {
  it('parses standard double-quoted attributes', () => {
    const res = parseAttrMap('src="https://example.com/pic.jpg" alt="A nice picture"');
    expect(res).toEqual({
      src: 'https://example.com/pic.jpg',
      alt: 'A nice picture'
    });
  });

  it('parses unquoted attributes', () => {
    const res = parseAttrMap('align=center size=medium');
    expect(res).toEqual({
      align: 'center',
      size: 'medium'
    });
  });

  it('handles embedded unescaped quotes', () => {
    const res = parseAttrMap('alt="The "beautiful" Ada" caption="The "beautiful" Ada"');
    expect(res).toEqual({
      alt: 'The "beautiful" Ada',
      caption: 'The "beautiful" Ada'
    });
  });

  it('handles backslash-escaped quotes', () => {
    const res = parseAttrMap('alt="The \\"beautiful\\" Ada"');
    expect(res).toEqual({
      alt: 'The "beautiful" Ada'
    });
  });

  it('returns accurate character offsets for AST node generation', () => {
    const str = 'src="pic.jpg" align=center';
    const pairs = parseAttrPairs(str);
    expect(pairs.length).toBe(2);

    expect(pairs[0]).toEqual({
      index: 0,
      lastIndex: 13,
      name: 'src',
      nameStart: 0,
      nameEnd: 3,
      value: 'pic.jpg',
      valStart: 5,
      valEnd: 12
    });

    expect(pairs[1]).toEqual({
      index: 14,
      lastIndex: 26,
      name: 'align',
      nameStart: 14,
      nameEnd: 19,
      value: 'center',
      valStart: 20,
      valEnd: 26
    });
  });

  it('runs in linear time on long unclosed quote payloads (ReDoS test)', () => {
    const payload = 'caption="' + '-'.repeat(100000);
    const start = performance.now();
    const map = parseAttrMap(payload);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50); // Must complete in under 50ms
    expect(map.caption).toBe('-'.repeat(100000));
  });
});
