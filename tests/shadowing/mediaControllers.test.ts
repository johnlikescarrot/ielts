import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShadowChunk } from '../../src/shadowing/shadowingSession';
import { LocalMediaController } from '../../src/shadowing/localMediaController';
import { SpeechController } from '../../src/shadowing/speechController';
import { buildYouTubeEmbedUrl, YouTubeEmbedController } from '../../src/shadowing/youtubeEmbedController';

const chunk = (index: number, startSeconds: number, endSeconds: number): ShadowChunk => ({
  id: `chunk_${index + 1}`,
  index,
  startSeconds,
  endSeconds,
  text: 'model chunk text',
  cueCount: 1,
  wordCount: 3,
});

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LocalMediaController', () => {
  it('seeks, applies the rate and plays the chunk', () => {
    const element = document.createElement('video');
    const play = vi.spyOn(element, 'play').mockResolvedValue(undefined);
    const controller = new LocalMediaController(element);

    controller.playChunk(chunk(0, 12, 20), 1.5);
    expect(element.currentTime).toBe(12);
    expect(element.playbackRate).toBe(1.5);
    expect(play).toHaveBeenCalledTimes(1);

    controller.setRate(0.75);
    expect(element.playbackRate).toBe(0.75);
  });

  it('survives play rejection', async () => {
    const element = document.createElement('audio');
    vi.spyOn(element, 'play').mockRejectedValue(new Error('blocked'));
    const controller = new LocalMediaController(element);

    controller.playChunk(chunk(0, 0, 8), 1);
    await wait(0);
    expect(element.currentTime).toBe(0);
  });

  it('reports ticks and ended events until unsubscribed', () => {
    const element = document.createElement('video');
    const controller = new LocalMediaController(element);

    const ticks: number[] = [];
    const ends: number[] = [];
    const offTick = controller.onTick(seconds => ticks.push(seconds));
    const offEnd = controller.onEnded(() => ends.push(1));

    element.currentTime = 4.5;
    element.dispatchEvent(new Event('timeupdate'));
    element.dispatchEvent(new Event('ended'));
    expect(ticks).toEqual([4.5]);
    expect(ends).toEqual([1]);

    offTick();
    offEnd();
    element.currentTime = 9;
    element.dispatchEvent(new Event('timeupdate'));
    element.dispatchEvent(new Event('ended'));
    expect(ticks).toEqual([4.5]);
    expect(ends).toEqual([1]);
  });

  it('pauses and detaches on destroy', () => {
    const element = document.createElement('video');
    const pause = vi.spyOn(element, 'pause').mockImplementation(() => undefined);
    const controller = new LocalMediaController(element);
    const ticks: number[] = [];
    const ends: number[] = [];
    controller.onTick(seconds => ticks.push(seconds));
    controller.onEnded(() => ends.push(1));

    controller.destroy();
    expect(pause).toHaveBeenCalledTimes(1);
    element.currentTime = 3;
    element.dispatchEvent(new Event('timeupdate'));
    element.dispatchEvent(new Event('ended'));
    expect(ticks).toEqual([]);
    expect(ends).toEqual([]);
  });
});

describe('SpeechController', () => {
  const originalSpeech = window.speechSynthesis;

  afterEach(() => {
    window.speechSynthesis = originalSpeech;
    vi.restoreAllMocks();
  });

  it('speaks the chunk and finishes through onend', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    window.speechSynthesis = { speak, cancel } as unknown as SpeechSynthesis;

    const controller = new SpeechController();
    const ticks: number[] = [];
    const ends: number[] = [];
    controller.onTick(seconds => ticks.push(seconds));
    controller.onEnded(() => ends.push(1));

    controller.playChunk(chunk(0, 0, 30), 1);
    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe('model chunk text');
    expect(utterance.rate).toBe(1);

    utterance.onend?.(new Event('end') as unknown as SpeechSynthesisEvent);
    expect(ends).toEqual([1]);
    expect(cancel).toHaveBeenCalledTimes(1);
    controller.destroy();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('runs a virtual clock while speaking and stops it on pause', async () => {
    const speak = vi.fn();
    window.speechSynthesis = { speak, cancel: () => undefined } as unknown as SpeechSynthesis;

    const controller = new SpeechController();
    const ticks: number[] = [];
    const ends: number[] = [];
    controller.onTick(seconds => ticks.push(seconds));
    controller.onEnded(() => ends.push(1));

    controller.setRate(2);
    controller.playChunk(chunk(0, 100, 160), 2);
    await wait(620);
    controller.pause();

    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0]).toBeGreaterThanOrEqual(100.5);
    expect(ticks.every(value => value <= 160)).toBe(true);

    const countAfterPause = ticks.length;
    await wait(320);
    expect(ticks.length).toBe(countAfterPause);

    // A stale onend from the cancelled utterance is ignored.
    const utterance = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    utterance.onend?.(new Event('end') as unknown as SpeechSynthesisEvent);
    expect(ends).toEqual([]);
  });

  it('stops reporting after unsubscribing handlers', () => {
    const controller = new SpeechController();
    const ticks: number[] = [];
    const ends: number[] = [];
    const offTick = controller.onTick(seconds => ticks.push(seconds));
    const offEnd = controller.onEnded(() => ends.push(1));

    offTick();
    offEnd();
    controller.destroy();
    expect(ticks).toEqual([]);
    expect(ends).toEqual([]);
  });
});

describe('YouTubeEmbedController', () => {
  const makeIframe = (): { iframe: HTMLIFrameElement; post: ReturnType<typeof vi.fn> } => {
    const post = vi.fn();
    const iframe = { contentWindow: { postMessage: post } } as unknown as HTMLIFrameElement;
    return { iframe, post };
  };

  it('builds a privacy-friendly embed URL', () => {
    expect(buildYouTubeEmbedUrl('dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?enablejsapi=1&rel=0&modestbranding=1&playsinline=1'
    );
  });

  it('posts widget commands for a chunk', () => {
    const { iframe, post } = makeIframe();
    const controller = new YouTubeEmbedController(iframe);

    controller.playChunk(chunk(0, 42, 50), 1.25);
    const payloads = post.mock.calls.map((call: unknown[]) => JSON.parse(String(call[0])));
    expect(payloads).toEqual([
      { event: 'listening', id: '1', channel: 'widget' },
      { event: 'command', func: 'setPlaybackRate', args: [1.25] },
      { event: 'command', func: 'seekTo', args: [42, true] },
      { event: 'command', func: 'playVideo', args: [] },
    ]);

    controller.setRate(0.5);
    expect(JSON.parse(String(post.mock.calls[4][0]))).toEqual({
      event: 'command',
      func: 'setPlaybackRate',
      args: [0.5],
    });

    controller.pause();
    expect(JSON.parse(String(post.mock.calls[5][0]))).toEqual({
      event: 'command',
      func: 'pauseVideo',
      args: [],
    });
  });

  it('accepts position updates from trusted YouTube origins only', () => {
    const { iframe } = makeIframe();
    const controller = new YouTubeEmbedController(iframe);
    const ticks: number[] = [];
    controller.onTick(seconds => ticks.push(seconds));

    const message = (data: unknown, origin: string) =>
      window.dispatchEvent(new MessageEvent('message', { data, origin }));

    message('{"event":"infoDelivery","info":{"currentTime":12.5}}', 'https://www.youtube.com');
    expect(ticks).toEqual([12.5]);

    message('{"event":"infoDelivery","info":{"currentTime":99}}', 'https://evil.example');
    message({ event: 'infoDelivery' }, 'https://www.youtube-nocookie.com');
    message('not json', 'https://www.youtube.com');
    message('{"event":"infoDelivery","info":{"currentTime":"fast"}}', 'https://www.youtube.com');
    expect(ticks).toEqual([12.5]);
  });

  it('maps the ended state to the ended handler', () => {
    const { iframe } = makeIframe();
    const controller = new YouTubeEmbedController(iframe);
    const ends: number[] = [];
    controller.onEnded(() => ends.push(1));

    const message = (data: string) =>
      window.dispatchEvent(new MessageEvent('message', { data, origin: 'https://www.youtube.com' }));

    message('{"event":"onStateChange","info":{"playerState":1}}');
    expect(ends).toEqual([]);
    message('{"event":"onStateChange","info":{"playerState":0}}');
    expect(ends).toEqual([1]);
  });

  it('stops listening after destroy', () => {
    const { iframe } = makeIframe();
    const controller = new YouTubeEmbedController(iframe);
    const ticks: number[] = [];
    controller.onTick(seconds => ticks.push(seconds));

    controller.destroy();
    window.dispatchEvent(
      new MessageEvent('message', {
        data: '{"event":"infoDelivery","info":{"currentTime":7}}',
        origin: 'https://www.youtube.com',
      })
    );
    expect(ticks).toEqual([]);
  });
});
