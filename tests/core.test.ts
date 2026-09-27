import { describe, expect, it } from 'vitest';
import { DAY, copy, dueCards, isDue, makeCard, normalizeWord, schedule, selectionToWord } from '../src/core.js';
const now = 1_700_000_000_000;
describe('IELTS Sprint scheduler', () => {
  it('normalizes words and preserves useful apostrophes', () => { expect(normalizeWord("  Don't! ")).toBe("don't"); expect(selectionToWord('Practice, every day')).toBe('practice'); expect(selectionToWord('')).toBe(''); });
  it('creates bounded cards due immediately', () => { const card = makeCard(' Focus ', ' a sentence ', now); expect(card).toMatchObject({ word: 'focus', context: 'a sentence', dueAt: now, interval: 0, ease: 2.5, reviews: 0 }); expect(isDue(card, now)).toBe(true); expect(isDue({ ...card, dueAt: now + 1 }, now)).toBe(false); });
  it('sorts due cards and supports empty lists', () => { const a = makeCard('a', '', now); const b = { ...makeCard('b', '', now), dueAt: now - DAY }; expect(dueCards([a, b], now).map((x) => x.word)).toEqual(['b', 'a']); expect(dueCards([], now)).toEqual([]); });
  it('schedules all ratings with safe ease limits', () => { const base = makeCard('word', '', now); const again = schedule(base, 1, now); expect(again.interval).toBe(0); expect(again.ease).toBe(2.3); const hard = schedule({ ...base, interval: 2 }, 2, now); expect(hard.interval).toBe(2); expect(hard.ease).toBe(2.4); const good = schedule({ ...base, interval: 2 }, 3, now); expect(good.interval).toBe(5); expect(good.dueAt).toBe(now + 5 * DAY); const easy = schedule({ ...base, interval: 2, ease: 3.2 }, 4, now); expect(easy.interval).toBe(8); expect(easy.ease).toBe(3.2); const low = schedule({ ...base, ease: 1.3 }, 2, now); expect(low.ease).toBe(1.3); });
  it('exports both complete language packs', () => { expect(copy.en.title).toBe('IELTS Sprint'); expect(copy.vi.due).toContain('hôm nay'); });
});
