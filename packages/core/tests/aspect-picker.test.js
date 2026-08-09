// @ts-check
import { describe, it, expect } from 'vitest';
import {
  detectAspectValue,
  mergeAspectIntoClass,
  normalizeImageAspectOptions,
  stripManagedAspectClasses,
} from '../src/toolbar/aspect-picker.js';

const OPTIONS = [
  { value: '', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'square', label: 'Square' },
  { value: 'natural', label: 'Natural' },
];

describe('aspect-picker helpers', () => {
  it('normalizeImageAspectOptions rejects empty/invalid input', () => {
    expect(normalizeImageAspectOptions(null)).toBeNull();
    expect(normalizeImageAspectOptions([])).toBeNull();
    expect(normalizeImageAspectOptions([{ value: 'x' }])).toBeNull();
  });

  it('normalizeImageAspectOptions keeps valid entries', () => {
    expect(normalizeImageAspectOptions(OPTIONS)).toEqual(OPTIONS);
  });

  it('detectAspectValue finds managed tokens', () => {
    expect(detectAspectValue('shadow square', OPTIONS)).toBe('square');
    expect(detectAspectValue('shadow', OPTIONS)).toBe('');
  });

  it('stripManagedAspectClasses removes only managed tokens', () => {
    expect(stripManagedAspectClasses('shadow square mx-auto', OPTIONS)).toBe('shadow mx-auto');
  });

  it('mergeAspectIntoClass replaces managed tokens', () => {
    expect(mergeAspectIntoClass('shadow landscape', 'square', OPTIONS)).toBe('shadow square');
    expect(mergeAspectIntoClass('shadow landscape', '', OPTIONS)).toBe('shadow');
  });
});
