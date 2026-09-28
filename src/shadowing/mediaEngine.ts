import { ShadowChunk } from './chunker';

/**
 * Playback engines that drive one chunk at a time.
 *
 * - `LocalMediaEngine` auto-stops an <audio>/<video> element at the chunk
 *   boundary, which is the core "pause after each chunk" behaviour of the
 *   reference Shadow Player without any polling timer.
 * - `SpeechEngine` replays any transcript chunk with browser speech
 *   synthesis, so shadowing works even without a media file or network.
 *
 * YouTube playback is handled separately (see `youTubeEmbed.ts`) because the
 * extension never loads remote player scripts.
 */

export interface EngineCallbacks {
  onChunkComplete: (chunk: ShadowChunk) => void;
}

export class LocalMediaEngine {
  private readonly element: HTMLMediaElement;
  private readonly callbacks: EngineCallbacks;
  private activeChunk: ShadowChunk | null = null;
  private endSeconds = Number.POSITIVE_INFINITY;

  private readonly handleTimeUpdate = (): void => {
    const chunk = this.activeChunk;
    if (!chunk) return;
    if (this.element.currentTime >= this.endSeconds) {
      this.element.pause();
      this.activeChunk = null;
      this.callbacks.onChunkComplete(chunk);
    }
  };

  private readonly handleEnded = (): void => {
    const chunk = this.activeChunk;
    if (!chunk) return;
    this.activeChunk = null;
    this.callbacks.onChunkComplete(chunk);
  };

  constructor(element: HTMLMediaElement, callbacks: EngineCallbacks) {
    this.element = element;
    this.callbacks = callbacks;
    element.addEventListener('timeupdate', this.handleTimeUpdate);
    element.addEventListener('ended', this.handleEnded);
  }

  playChunk(chunk: ShadowChunk, rate: number, mediaDurationSeconds: number | null): void {
    this.activeChunk = chunk;
    this.endSeconds = chunk.endSeconds;
    if (mediaDurationSeconds !== null && Number.isFinite(mediaDurationSeconds) && mediaDurationSeconds > 0) {
      this.endSeconds = Math.min(this.endSeconds, mediaDurationSeconds);
    }
    this.element.playbackRate = rate;
    this.element.currentTime = chunk.startSeconds;
    void this.element.play().catch(() => {
      /* autoplay refusal is non-fatal; the learner can press play manually */
    });
  }

  pause(): void {
    this.element.pause();
    this.activeChunk = null;
  }

  setRate(rate: number): void {
    this.element.playbackRate = rate;
  }

  dispose(): void {
    this.element.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.element.removeEventListener('ended', this.handleEnded);
    this.activeChunk = null;
  }
}

export class SpeechEngine {
  private readonly callbacks: EngineCallbacks;
  private activeChunk: ShadowChunk | null = null;
  private rate = 1;

  constructor(callbacks: EngineCallbacks) {
    this.callbacks = callbacks;
  }

  playChunk(chunk: ShadowChunk): void {
    this.stop();
    this.activeChunk = chunk;
    const synthesis = window.speechSynthesis;
    if (!synthesis) {
      this.finish();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.lang = 'en-GB';
    utterance.rate = Math.min(2, Math.max(0.5, this.rate));
    utterance.onend = () => this.finish();
    utterance.onerror = () => this.finish();
    synthesis.speak(utterance);
  }

  setRate(rate: number): void {
    this.rate = rate;
  }

  stop(): void {
    window.speechSynthesis?.cancel();
    this.activeChunk = null;
  }

  dispose(): void {
    this.stop();
  }

  private finish(): void {
    const chunk = this.activeChunk;
    this.activeChunk = null;
    if (chunk) this.callbacks.onChunkComplete(chunk);
  }
}
