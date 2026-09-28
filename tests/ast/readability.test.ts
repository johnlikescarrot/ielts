import { describe, it, expect } from 'vitest';
import { countSyllables, calculateReadability } from '../../src/ast/readability';

describe('readability', () => {
  it('counts syllables accurately with edge cases', () => {
    expect(countSyllables('')).toBe(0);
    expect(countSyllables('a')).toBe(1);
    expect(countSyllables('the')).toBe(1);
    expect(countSyllables('table')).toBe(2);
    expect(countSyllables('apple')).toBe(2);
    expect(countSyllables('pale')).toBe(1);
    expect(countSyllables('whale')).toBe(1);
    expect(countSyllables('scale')).toBe(1);
    expect(countSyllables('article')).toBe(3);
    expect(countSyllables('mitigate')).toBe(3);
    expect(countSyllables('proliferation')).toBe(5);
    expect(countSyllables('developed')).toBe(3);
    expect(countSyllables('allocated')).toBe(4);
  });

  it('calculates readability metrics for sample academic text', () => {
    const text = 'Technology transforms modern education. Students learn with computers and improve their daily skills.';
    const sentences = ['Technology transforms modern education.', 'Students learn with computers and improve their daily skills.'];
    const words = text.split(/\s+/);

    const metrics = calculateReadability(text, words, sentences);
    expect(metrics.fleschKincaidGrade).toBeGreaterThan(0);
    expect(metrics.readingEase).toBeGreaterThan(0);
    expect(metrics.ari).toBeGreaterThan(0);
    expect(metrics.gunningFog).toBeGreaterThan(0);
    expect(metrics.lexicalDensity).toBeGreaterThan(0);
  });

  it('returns default zero values for empty text in calculateReadability', () => {
    const metrics = calculateReadability('', [], []);
    expect(metrics.readingEase).toBe(100);
    expect(metrics.fleschKincaidGrade).toBe(0);
    expect(metrics.ari).toBe(0);
    expect(metrics.gunningFog).toBe(0);
    expect(metrics.lexicalDensity).toBe(0);
  });
});
