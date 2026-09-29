import { EndedHandler, MediaController, TickHandler } from './mediaController';
import { ShadowChunk } from './shadowingSession';

export const YOUTUBE_EMBED_ORIGIN = 'https://www.youtube-nocookie.com';

/** Only messages from these origins are trusted. */
const ALLOWED_ORIGINS = new Set(['https://www.youtube.com', YOUTUBE_EMBED_ORIGIN]);

/**
 * Embed URL for the privacy-friendly player. `enablejsapi=1` allows control
 * through `postMessage` without loading any remote script, which keeps the
 * extension's MV3 content-security-policy intact.
 */
export function buildYouTubeEmbedUrl(videoId: string): string {
  return `${YOUTUBE_EMBED_ORIGIN}/embed/${encodeURIComponent(videoId)}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;
}

interface YouTubeWidgetMessage {
  event?: string;
  info?: {
    currentTime?: unknown;
    playerState?: unknown;
  };
}

/**
 * Controls an embedded YouTube iframe through the widget postMessage API:
 * commands are posted into the iframe and playback updates come back as
 * `message` events on the window, which are origin-checked.
 */
export class YouTubeEmbedController implements MediaController {
  readonly kind = 'youtube' as const;

  private tickHandler: TickHandler | null = null;
  private endHandler: EndedHandler | null = null;

  private readonly handleMessage = (event: MessageEvent): void => {
    if (!ALLOWED_ORIGINS.has(event.origin)) {
      return;
    }
    if (typeof event.data !== 'string') {
      return;
    }
    let parsed: YouTubeWidgetMessage;
    try {
      parsed = JSON.parse(event.data) as YouTubeWidgetMessage;
    } catch {
      return;
    }
    if (parsed.event === 'infoDelivery' && typeof parsed.info?.currentTime === 'number') {
      this.tickHandler?.(parsed.info.currentTime);
    } else if (parsed.event === 'onStateChange' && parsed.info?.playerState === 0) {
      this.endHandler?.();
    }
  };

  constructor(
    private readonly iframe: HTMLIFrameElement,
    private readonly targetWindow: Window = window
  ) {
    this.targetWindow.addEventListener('message', this.handleMessage);
  }

  private post(payload: Record<string, unknown>): void {
    this.iframe.contentWindow?.postMessage(JSON.stringify(payload), '*');
  }

  playChunk(chunk: ShadowChunk, rate: number): void {
    this.post({ event: 'listening', id: '1', channel: 'widget' });
    this.post({ event: 'command', func: 'setPlaybackRate', args: [rate] });
    this.post({ event: 'command', func: 'seekTo', args: [chunk.startSeconds, true] });
    this.post({ event: 'command', func: 'playVideo', args: [] });
  }

  pause(): void {
    this.post({ event: 'command', func: 'pauseVideo', args: [] });
  }

  setRate(rate: number): void {
    this.post({ event: 'command', func: 'setPlaybackRate', args: [rate] });
  }

  onTick(handler: TickHandler): () => void {
    this.tickHandler = handler;
    return () => {
      this.tickHandler = null;
    };
  }

  onEnded(handler: EndedHandler): () => void {
    this.endHandler = handler;
    return () => {
      this.endHandler = null;
    };
  }

  destroy(): void {
    this.targetWindow.removeEventListener('message', this.handleMessage);
  }
}
