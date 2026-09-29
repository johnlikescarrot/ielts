import { ShadowChunk } from './shadowingSession';

export type MediaControllerKind = 'local' | 'speech' | 'youtube';

export type TickHandler = (positionSeconds: number) => void;
export type EndedHandler = () => void;

/**
 * A media source that can play one shadowing chunk at a time. The three
 * implementations cover the studio's sources: a local audio/video file, the
 * browser speech engine, and an embedded YouTube player.
 */
export interface MediaController {
  readonly kind: MediaControllerKind;
  /** Start (or restart) the given chunk, honouring the requested rate. */
  playChunk(chunk: ShadowChunk, rate: number): void;
  pause(): void;
  /** Apply a new rate; speech sources apply it on the next chunk. */
  setRate(rate: number): void;
  /** Subscribe to position updates; returns an unsubscribe function. */
  onTick(handler: TickHandler): () => void;
  /** Subscribe to an "all media ended" signal; returns an unsubscribe function. */
  onEnded(handler: EndedHandler): () => void;
  destroy(): void;
}

/** How often controllers report a position, in milliseconds. */
export const TICK_INTERVAL_MS = 250;
