import { describe, expect, it } from 'vitest';

import {
  PracticeRepository,
  STORAGE_KEY,
  createInitialState,
  type RepositoryClock,
  type StorageDriver,
} from '../../src/core';
import { messages, translate, translator } from '../../src/i18n';

class MemoryDriver implements StorageDriver {
  public value: unknown;
  public writes = 0;

  public constructor(value?: unknown) {
    this.value = value;
  }

  public read(key: string): Promise<unknown> {
    expect(key).toBe(STORAGE_KEY);
    return Promise.resolve(this.value);
  }

  public write(key: string, value: unknown): Promise<void> {
    expect(key).toBe(STORAGE_KEY);
    this.value = value;
    this.writes += 1;
    return Promise.resolve();
  }
}

function clock(): RepositoryClock {
  let sequence = 0;
  return {
    now: () => new Date('2026-09-27T12:00:00.000Z'),
    id: () => `id-${++sequence}`,
  };
}

describe('practice repository', () => {
  it('loads initial state for missing or invalid storage and accepts replacement', async () => {
    const driver = new MemoryDriver('invalid');
    const repository = new PracticeRepository(driver, clock());
    expect(await repository.load()).toEqual(createInitialState());
    const replacement = {
      ...createInitialState(),
      settings: { locale: 'vi' as const, dailyGoal: 10 },
    };
    expect(await repository.replace(replacement)).toEqual(replacement);
    expect(await repository.load()).toEqual(replacement);
  });

  it('captures unique cards, deduplicates, and recovers its queue after an error', async () => {
    const driver = new MemoryDriver();
    const repository = new PracticeRepository(driver, clock());
    await expect(repository.capture({ prompt: '' })).rejects.toThrow(
      'A word, phrase, or prompt is required.',
    );

    const first = await repository.capture({ prompt: 'focus', context: 'Use focus.' });
    const duplicate = await repository.capture({ prompt: 'FOCUS', context: 'use focus.' });
    expect(first.added).toBe(true);
    expect(duplicate).toMatchObject({ added: false, card: first.card });
    expect(driver.writes).toBe(1);
  });

  it('rates, configures, and removes cards transactionally', async () => {
    const repository = new PracticeRepository(new MemoryDriver(), clock());
    const captured = await repository.capture({ prompt: 'focus' });
    const rated = await repository.rate(captured.card.id, 3);
    expect(rated.reviews).toHaveLength(1);
    const configured = await repository.configure({ locale: 'vi', dailyGoal: 30 });
    expect(configured.settings).toEqual({ locale: 'vi', dailyGoal: 30 });
    const removed = await repository.remove(captured.card.id);
    expect(removed.cards).toEqual([]);
    expect(removed.reviews).toEqual([]);
  });

  it('uses the system clock when no clock is injected', async () => {
    const repository = new PracticeRepository(new MemoryDriver());
    const result = await repository.capture({ prompt: 'system clock' });
    expect(result.card.id).toMatch(/[\da-f-]{20,}/u);
    expect(Number.isNaN(Date.parse(result.card.createdAt))).toBe(false);
  });
});

describe('translations', () => {
  it('ships the same keys in English and Vietnamese', () => {
    expect(Object.keys(messages.vi)).toEqual(Object.keys(messages.en));
  });

  it('translates both locales and interpolates known values', () => {
    expect(translate('en', 'appName')).toBe('IELTS Forge');
    expect(translate('vi', 'navReview')).toBe('Ôn tập');
    expect(translate('en', 'dueCount', { count: 4 })).toBe('4 due');
  });

  it('keeps unknown placeholders and creates a locale-bound translator', () => {
    expect(translate('en', 'dueCount')).toBe('{count} due');
    expect(translator('vi')('goalReviews', { count: 20 })).toBe('20 lượt ôn');
  });
});
