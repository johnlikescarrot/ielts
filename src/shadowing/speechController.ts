import { EndedHandler, MediaController, TICK_INTERVAL_MS, TickHandler } from './mediaController';
import { ShadowChunk } from './shadowingSession';

/**
 * Voices chunks with the browser speech engine so a transcript alone is
 * enough for shadowing practice. A virtual clock ticks through the chunk's
 * time span so the progress UI behaves like real media, while the utterance's
 * `onend` event is the authoritative "chunk finished" signal.
 *
 * A generation counter ignores `onend` callbacks from utterances that were
 * cancelled by a newer chunk or an explicit pause.
 */
export class SpeechController implements MediaController {
  readonly kind = 'speech' as const;

  private tickHandler: TickHandler | null = null;
  private endHandler: EndedHandler | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private virtualSeconds = 0;
  private rate = 1;
  private generation = 0;

  playChunk(chunk: ShadowChunk, rate: number): void {
    this.stopTimer();
    this.rate = rate;
    this.virtualSeconds = chunk.startSeconds;
    const generation = ++this.generation;

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.lang = 'en-GB';
    utterance.rate = rate;
    utterance.onend = () => {
      if (generation !== this.generation) {
        return;
      }
      this.stopTimer();
      this.endHandler?.();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    this.tickTimer = setInterval(() => {
      this.virtualSeconds = Math.min(
        chunk.endSeconds,
        this.virtualSeconds + (TICK_INTERVAL_MS / 1000) * this.rate
      );
      this.tickHandler?.(this.virtualSeconds);
    }, TICK_INTERVAL_MS);
  }

  pause(): void {
    this.generation += 1;
    this.stopTimer();
    window.speechSynthesis.cancel();
  }

  setRate(rate: number): void {
    this.rate = rate;
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
    this.pause();
    this.tickHandler = null;
    this.endHandler = null;
  }

  private stopTimer(): void {
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }
}
