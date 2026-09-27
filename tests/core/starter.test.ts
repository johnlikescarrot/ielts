import { expect, it } from 'vitest';

import { STARTER_CARDS } from '../../src/core';

it('covers all four IELTS skills in the starter pack', () => {
  expect(STARTER_CARDS.map((card) => card.skill)).toEqual([
    'reading',
    'writing',
    'listening',
    'speaking',
  ]);
  expect(STARTER_CARDS.every((card) => Boolean(card.context && card.answer))).toBe(true);
});
