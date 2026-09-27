import {
  createCard,
  createInitialState,
  addCard,
  removeCard,
  reviewCard,
  updateSettings,
} from './state';
import { isAppState } from './transfer';
import type { AppState, CaptureInput, ReviewRating, Settings } from './types';

export const STORAGE_KEY = 'ielts-forge-state-v1';

export interface StorageDriver {
  read(key: string): Promise<unknown>;
  write(key: string, value: unknown): Promise<void>;
}

export interface RepositoryClock {
  now(): Date;
  id(): string;
}

const systemClock: RepositoryClock = {
  now: () => new Date(),
  id: () => crypto.randomUUID(),
};

export class PracticeRepository {
  private queue: Promise<unknown> = Promise.resolve();

  public constructor(
    private readonly driver: StorageDriver,
    private readonly clock: RepositoryClock = systemClock,
  ) {}

  public async load(): Promise<AppState> {
    const stored = await this.driver.read(STORAGE_KEY);
    return isAppState(stored) ? stored : createInitialState();
  }

  public async replace(state: AppState): Promise<AppState> {
    await this.driver.write(STORAGE_KEY, state);
    return state;
  }

  private transaction<T>(operation: (state: AppState) => Promise<T>): Promise<T> {
    const next = this.queue.then(async () => operation(await this.load()));
    this.queue = next.catch(() => undefined);
    return next;
  }

  public capture(input: CaptureInput): Promise<ReturnType<typeof addCard>> {
    return this.transaction(async (state) => {
      const card = createCard(input, this.clock.now(), this.clock.id());
      const result = addCard(state, card);
      if (result.added) await this.replace(result.state);
      return result;
    });
  }

  public rate(cardId: string, rating: ReviewRating): Promise<AppState> {
    return this.transaction(async (state) => {
      const next = reviewCard(state, cardId, rating, this.clock.now(), this.clock.id());
      return this.replace(next);
    });
  }

  public remove(cardId: string): Promise<AppState> {
    return this.transaction(async (state) => this.replace(removeCard(state, cardId)));
  }

  public configure(update: Partial<Settings>): Promise<AppState> {
    return this.transaction(async (state) => this.replace(updateSettings(state, update)));
  }
}
