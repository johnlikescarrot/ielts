import { describe, expect, it } from 'vitest';
import { createShadowingChunks, findShadowingChunk, nextShadowingSpeed, SHADOWING_SPEEDS } from '../../src/video/shadowingPlayer';

describe('shadowing player engine', () => {
  const cues = [
    { id: 'a', startSeconds: 0, text: 'First' },
    { id: 'b', startSeconds: 8, text: 'Second' },
  ];
  it('creates safe chunks from caption boundaries and media duration', () => {
    expect(createShadowingChunks(cues, 20)).toEqual([
      { ...cues[0], endSeconds: 8 },
      { ...cues[1], endSeconds: 20 },
    ]);
    expect(createShadowingChunks([{ id: 'a', startSeconds: 10, text: 'Late' }], 0)[0].endSeconds).toBe(13);
    expect(createShadowingChunks([], 20)).toEqual([]);
  });

  it('finds the current or nearest chunk', () => {
    const chunks = createShadowingChunks(cues, 20);
    expect(findShadowingChunk([], 2)).toBe(-1);
    expect(findShadowingChunk(chunks, -1)).toBe(0);
    expect(findShadowingChunk(chunks, 2)).toBe(0);
    expect(findShadowingChunk(chunks, 8)).toBe(1);
    expect(findShadowingChunk(chunks, 99)).toBe(1);
  });

  it('cycles through supported speeds', () => {
    expect(nextShadowingSpeed(1)).toBe(1.25);
    expect(nextShadowingSpeed(2)).toBe(0.5);
    expect(SHADOWING_SPEEDS).toHaveLength(6);
  });
});
