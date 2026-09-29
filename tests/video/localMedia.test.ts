import { describe, expect, it, vi } from 'vitest';
import {
  createLocalMediaSource,
  detectLocalMediaKind,
  getCuePlaybackWindow,
  MAX_SUBTITLE_FILE_BYTES,
  playLocalMediaCue,
  readLocalTranscript,
  releaseLocalMediaSource,
  stopAtCueBoundary,
} from '../../src/video/localMedia';

const subtitleFile = (size: number, text: () => Promise<string>) => ({ size, text }) as File;

const cues = [
  { id: 'cue-1', startSeconds: 2, text: 'First cue.' },
  { id: 'cue-2', startSeconds: 7, text: 'Second cue.' },
];

describe('local media source engine', () => {
  it('reads a local transcript, removes a byte-order mark, and rejects unsafe input', async () => {
    await expect(readLocalTranscript(subtitleFile(20, async () => '\uFEFF  00:01 Hello world.  ')))
      .resolves.toBe('00:01 Hello world.');
    await expect(readLocalTranscript(subtitleFile(MAX_SUBTITLE_FILE_BYTES + 1, async () => 'captions')))
      .rejects.toThrow('subtitle-too-large');
    await expect(readLocalTranscript(subtitleFile(0, async () => '  \n ')))
      .rejects.toThrow('subtitle-empty');
  });

  it('detects media from MIME types and extension fallbacks', () => {
    expect(detectLocalMediaKind({ name: 'lesson.bin', type: 'audio/webm' })).toBe('audio');
    expect(detectLocalMediaKind({ name: 'lesson.bin', type: 'VIDEO/MP4' })).toBe('video');
    expect(detectLocalMediaKind({ name: 'lesson.M4A', type: '' })).toBe('audio');
    expect(detectLocalMediaKind({ name: 'lesson.mov', type: '' })).toBe('video');
    expect(detectLocalMediaKind({ name: 'lesson.pdf', type: 'application/pdf' })).toBeNull();
  });

  it('creates and releases object URL descriptors while rejecting unsupported media', () => {
    const createObjectURL = vi.fn(() => 'blob:lesson');
    const revokeObjectURL = vi.fn();
    const audio = { name: 'lesson.mp3', type: 'audio/mpeg' } as File;

    const source = createLocalMediaSource(audio, createObjectURL);
    expect(source).toEqual({ kind: 'audio', name: 'lesson.mp3', url: 'blob:lesson' });
    expect(createObjectURL).toHaveBeenCalledWith(audio);
    releaseLocalMediaSource(source, revokeObjectURL);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:lesson');
    expect(() => createLocalMediaSource({ name: 'notes.txt', type: 'text/plain' } as File, createObjectURL))
      .toThrow('unsupported-media');
  });

  it('builds safe cue windows from the next cue, media duration, or a short fallback', () => {
    expect(getCuePlaybackWindow(cues, 'cue-1', 30)).toEqual({ startSeconds: 2, endSeconds: 7 });
    expect(getCuePlaybackWindow(cues, 'cue-2', 30)).toEqual({ startSeconds: 7, endSeconds: 30 });
    expect(getCuePlaybackWindow(cues, 'cue-2', Number.NaN)).toEqual({ startSeconds: 7, endSeconds: 15 });
    expect(getCuePlaybackWindow([
      { id: 'late', startSeconds: -3, text: 'Sanitized start.' },
      { id: 'bad-next', startSeconds: Number.NaN, text: 'Invalid next cue.' },
    ], 'late', 0)).toEqual({ startSeconds: 0, endSeconds: 8 });
    expect(getCuePlaybackWindow([{ id: 'bad', startSeconds: Number.NaN, text: 'Invalid.' }], 'bad', 10)).toBeNull();
    expect(getCuePlaybackWindow(cues, 'missing', 30)).toBeNull();
  });

  it('seeks and plays at a bounded rate, reporting blocked playback without throwing', async () => {
    const media = {
      currentTime: 0,
      playbackRate: 1,
      pause: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
    } as unknown as HTMLMediaElement;

    await expect(playLocalMediaCue(media, { startSeconds: 2, endSeconds: 7 }, 5)).resolves.toBe(true);
    expect(media.pause).toHaveBeenCalledOnce();
    expect(media.currentTime).toBe(2);
    expect(media.playbackRate).toBe(2);
    expect(media.play).toHaveBeenCalledOnce();

    media.play = vi.fn().mockRejectedValue(new Error('blocked'));
    await expect(playLocalMediaCue(media, { startSeconds: 2, endSeconds: 7 }, 0.1)).resolves.toBe(false);
    expect(media.playbackRate).toBe(0.5);
  });

  it('stops only when an active cue reaches its end boundary', () => {
    const media = { currentTime: 6.9, pause: vi.fn() } as unknown as HTMLMediaElement;
    expect(stopAtCueBoundary(media, null)).toBe(false);
    expect(stopAtCueBoundary(media, 7)).toBe(false);
    media.currentTime = 7;
    expect(stopAtCueBoundary(media, 7)).toBe(true);
    expect(media.pause).toHaveBeenCalledOnce();
  });
});
