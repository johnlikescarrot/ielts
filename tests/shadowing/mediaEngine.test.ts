import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalMediaEngine, SpeechEngine } from '../../src/shadowing/mediaEngine';
import { ShadowChunk } from '../../src/shadowing/chunker';

const chunk = (index: number, startSeconds: number, endSeconds: number): ShadowChunk => ({
  index,
  startSeconds,
  endSeconds,
  cueIds: [`cue-${index}`],
  text: `Chunk number ${index + 1} practice text.`,
  wordCount: 5,
});

function makeMediaElement(): HTMLMediaElement {
  return document.createElement('video');
}

describe('LocalMediaEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('plays a chunk from its start at the requested rate', () => {
    const element = makeMediaElement();
    const play = vi.spyOn(element, 'play').mockResolvedValue(undefined);
    const pause = vi.spyOn(element, 'pause').mockImplementation(() => {});
    const onChunkComplete = vi.fn();
    const engine = new LocalMediaEngine(element, { onChunkComplete });

    engine.playChunk(chunk(0, 12, 24), 0.75, null);
    expect(element.currentTime).toBe(12);
    expect(element.playbackRate).toBe(0.75);
    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).not.toHaveBeenCalled();

    engine.dispose();
  });

  it('clamps the stop point to the real media duration', () => {
    const element = makeMediaElement();
    vi.spyOn(element, 'play').mockResolvedValue(undefined);
    vi.spyOn(element, 'pause').mockImplementation(() => {});
    const onChunkComplete = vi.fn();
    const engine = new LocalMediaEngine(element, { onChunkComplete });

    engine.playChunk(chunk(0, 30, 48), 1, 40);
    element.currentTime = 39.5;
    element.dispatchEvent(new Event('timeupdate'));
    expect(onChunkComplete).not.toHaveBeenCalled();

    element.currentTime = 40;
    element.dispatchEvent(new Event('timeupdate'));
    expect(onChunkComplete).toHaveBeenCalledTimes(1);
    expect(onChunkComplete).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));

    engine.dispose();
  });

  it('completes the chunk at its boundary and stops watching afterwards', () => {
    const element = makeMediaElement();
    vi.spyOn(element, 'play').mockResolvedValue(undefined);
    const pause = vi.spyOn(element, 'pause').mockImplementation(() => {});
    const onChunkComplete = vi.fn();
    const engine = new LocalMediaEngine(element, { onChunkComplete });

    engine.playChunk(chunk(1, 20, 30), 1, null);
    element.currentTime = 25;
    element.dispatchEvent(new Event('timeupdate'));
    expect(pause).not.toHaveBeenCalled();

    element.currentTime = 30;
    element.dispatchEvent(new Event('timeupdate'));
    expect(pause).toHaveBeenCalledTimes(1);
    expect(onChunkComplete).toHaveBeenCalledTimes(1);

    element.currentTime = 99;
    element.dispatchEvent(new Event('timeupdate'));
    element.dispatchEvent(new Event('ended'));
    expect(onChunkComplete).toHaveBeenCalledTimes(1);

    engine.dispose();
  });

  it('completes the active chunk when the media ends naturally', () => {
    const element = makeMediaElement();
    vi.spyOn(element, 'play').mockResolvedValue(undefined);
    const onChunkComplete = vi.fn();
    const engine = new LocalMediaEngine(element, { onChunkComplete });

    engine.playChunk(chunk(0, 5, 15), 1, null);
    element.dispatchEvent(new Event('ended'));
    expect(onChunkComplete).toHaveBeenCalledTimes(1);

    element.dispatchEvent(new Event('ended'));
    expect(onChunkComplete).toHaveBeenCalledTimes(1);

    engine.dispose();
  });

  it('ignores time updates while paused and after disposal', () => {
    const element = makeMediaElement();
    vi.spyOn(element, 'play').mockResolvedValue(undefined);
    vi.spyOn(element, 'pause').mockImplementation(() => {});
    const onChunkComplete = vi.fn();
    const engine = new LocalMediaEngine(element, { onChunkComplete });

    engine.playChunk(chunk(0, 0, 10), 1, null);
    engine.pause();
    element.currentTime = 50;
    element.dispatchEvent(new Event('timeupdate'));
    expect(onChunkComplete).not.toHaveBeenCalled();

    engine.playChunk(chunk(0, 0, 10), 1, null);
    engine.dispose();
    element.currentTime = 50;
    element.dispatchEvent(new Event('timeupdate'));
    element.dispatchEvent(new Event('ended'));
    expect(onChunkComplete).not.toHaveBeenCalled();
  });

  it('updates the playback rate live', () => {
    const element = makeMediaElement();
    const engine = new LocalMediaEngine(element, { onChunkComplete: () => {} });
    engine.setRate(1.5);
    expect(element.playbackRate).toBe(1.5);
    engine.dispose();
  });

  it('tolerates a rejected play promise', async () => {
    const element = makeMediaElement();
    vi.spyOn(element, 'play').mockRejectedValue(new DOMException('blocked', 'NotAllowedError'));
    const onChunkComplete = vi.fn();
    const engine = new LocalMediaEngine(element, { onChunkComplete });
    engine.playChunk(chunk(0, 0, 10), 1, null);
    await Promise.resolve();
    await Promise.resolve();
    expect(onChunkComplete).not.toHaveBeenCalled();
    engine.dispose();
  });
});

describe('SpeechEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('speaks the chunk and completes when the utterance ends', async () => {
    const speak = vi
      .spyOn(window.speechSynthesis, 'speak')
      .mockImplementation((utterance: any) => {
        setTimeout(() => utterance.onend?.(), 0);
      });
    const onChunkComplete = vi.fn();
    const engine = new SpeechEngine({ onChunkComplete });

    engine.playChunk(chunk(0, 0, 6));
    expect(speak).toHaveBeenCalledTimes(1);
    const spoken = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(spoken.text).toContain('Chunk number 1');
    expect(spoken.lang).toBe('en-GB');
    expect(spoken.rate).toBe(1);

    await new Promise(resolve => setTimeout(resolve, 5));
    expect(onChunkComplete).toHaveBeenCalledTimes(1);
    engine.dispose();
  });

  it('applies the selected rate within synthesis limits', () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
    const engine = new SpeechEngine({ onChunkComplete: () => {} });
    engine.setRate(2);
    engine.playChunk(chunk(1, 6, 12));
    expect((speak.mock.calls[0][0] as SpeechSynthesisUtterance).rate).toBe(2);
    engine.setRate(9);
    engine.playChunk(chunk(1, 6, 12));
    expect((speak.mock.calls[1][0] as SpeechSynthesisUtterance).rate).toBe(2);
    engine.dispose();
  });

  it('cancels a previous utterance before starting a new one', () => {
    const cancel = vi.spyOn(window.speechSynthesis, 'cancel').mockImplementation(() => {});
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
    const engine = new SpeechEngine({ onChunkComplete: () => {} });
    engine.playChunk(chunk(0, 0, 6));
    engine.playChunk(chunk(1, 6, 12));
    expect(cancel).toHaveBeenCalled();
    engine.dispose();
    expect(cancel).toHaveBeenCalledTimes(3); // once per replay, once on dispose
  });

  it('completes immediately when speech synthesis is unavailable', () => {
    const original = window.speechSynthesis;
    Object.defineProperty(window, 'speechSynthesis', { writable: true, value: undefined });
    const onChunkComplete = vi.fn();
    const engine = new SpeechEngine({ onChunkComplete });
    engine.playChunk(chunk(0, 0, 6));
    expect(onChunkComplete).toHaveBeenCalledTimes(1);
    engine.dispose();
    Object.defineProperty(window, 'speechSynthesis', { writable: true, value: original });
  });

  it('treats a synthesis error as a completed replay', () => {
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utterance: any) => {
      utterance.onerror?.();
    });
    const onChunkComplete = vi.fn();
    const engine = new SpeechEngine({ onChunkComplete });
    engine.playChunk(chunk(0, 0, 6));
    expect(onChunkComplete).toHaveBeenCalledTimes(1);
    engine.dispose();
  });

  it('ignores an utterance that ends after the engine was stopped', () => {
    let pending: SpeechSynthesisUtterance | null = null;
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utterance: any) => {
      pending = utterance;
    });
    const onChunkComplete = vi.fn();
    const engine = new SpeechEngine({ onChunkComplete });
    engine.playChunk(chunk(0, 0, 6));
    engine.stop();
    (pending as any)?.onend?.();
    expect(onChunkComplete).not.toHaveBeenCalled();
    engine.dispose();
  });
});
