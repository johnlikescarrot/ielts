import { describe, expect, it } from 'vitest';
import { dailyGoal, progress, randomPrompt, todayKey, totalMinutes } from '../src/core';
const day = '2026-09-27';
describe('study core', () => {
 it('uses ISO dates', () => expect(todayKey(new Date('2026-09-27T12:00:00Z'))).toBe(day));
 it('sums only today', () => expect(totalMinutes([{skill:'reading',minutes:10,date:day},{skill:'speaking',minutes:8,date:'2026-01-01'}],day)).toBe(10));
 it('calculates and caps progress', () => { expect(progress([{skill:'reading',minutes:5,date:day}],day)).toBe(20); expect(progress([{skill:'reading',minutes:30,date:day}],day)).toBe(100); });
 it('returns deterministic prompts', () => { expect(randomPrompt('reading', () => 0)).toContain('claim'); expect(randomPrompt('speaking', () => .99)).toContain('opinion'); });
 it('has a small daily goal', () => expect(dailyGoal).toBe(25));
});
