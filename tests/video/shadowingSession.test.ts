import { describe, expect, it } from 'vitest';
import { createShadowingChunks, createShadowingSession, currentChunk, markChunkFinished, moveChunk, sessionProgress } from '../../src/video/shadowingSession';

const cues = [
  { id: 'a', startSeconds: 0, text: 'Listen first.' },
  { id: 'b', startSeconds: 4, text: 'Then repeat.' },
];

describe('shadowing session', () => {
  it('creates bounded chunks from timed captions', () => {
    expect(createShadowingChunks(cues, 10).map(chunk => chunk.endSeconds)).toEqual([4, 10]);
  });

  it('requires the configured repetitions before advancing', () => {
    let session = createShadowingSession(createShadowingChunks(cues), 2);
    session = markChunkFinished(session);
    expect(currentChunk(session)?.id).toBe('a');
    session = markChunkFinished(session);
    expect(currentChunk(session)?.id).toBe('b');
    expect(sessionProgress(session)).toBe(50);
  });

  it('clamps manual navigation and handles an empty track', () => {
    const session = createShadowingSession(createShadowingChunks(cues));
    expect(moveChunk(session, -1).activeIndex).toBe(0);
    expect(moveChunk(session, 1).activeIndex).toBe(1);
    expect(sessionProgress(createShadowingSession([]))).toBe(0);
  });
});
