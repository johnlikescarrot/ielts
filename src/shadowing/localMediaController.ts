import { EndedHandler, MediaController, TickHandler } from './mediaController';
import { ShadowChunk } from './shadowingSession';

/** Drives a local `<audio>`/`<video>` element (a file the learner picked). */
export class LocalMediaController implements MediaController {
  readonly kind = 'local' as const;

  private tickHandler: TickHandler | null = null;
  private endHandler: EndedHandler | null = null;

  private readonly handleTimeUpdate = (): void => {
    this.tickHandler?.(this.element.currentTime);
  };

  private readonly handleEnded = (): void => {
    this.endHandler?.();
  };

  constructor(private readonly element: HTMLMediaElement) {}

  playChunk(chunk: ShadowChunk, rate: number): void {
    this.element.playbackRate = rate;
    this.element.currentTime = chunk.startSeconds;
    void this.element.play().catch(() => {
      // Autoplay or decode refusal: the learner can press play again.
    });
  }

  pause(): void {
    this.element.pause();
  }

  setRate(rate: number): void {
    this.element.playbackRate = rate;
  }

  onTick(handler: TickHandler): () => void {
    this.tickHandler = handler;
    this.element.addEventListener('timeupdate', this.handleTimeUpdate);
    return () => {
      this.element.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.tickHandler = null;
    };
  }

  onEnded(handler: EndedHandler): () => void {
    this.endHandler = handler;
    this.element.addEventListener('ended', this.handleEnded);
    return () => {
      this.element.removeEventListener('ended', this.handleEnded);
      this.endHandler = null;
    };
  }

  destroy(): void {
    this.element.pause();
    this.element.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.element.removeEventListener('ended', this.handleEnded);
    this.tickHandler = null;
    this.endHandler = null;
  }
}
