import type {StudyState} from '../types';
import {
  addCapture,
  addCard,
  createInitialState,
  recordSession,
} from '../lib/model';

export const now = new Date('2020-09-27T12:00:00.000Z');

export function populatedState(): StudyState {
  let state = createInitialState();
  state = addCard(
    state,
    {
      term: 'ubiquitous',
      meaning: 'present everywhere',
      context: 'Smartphones are ubiquitous.',
    },
    now,
  );
  state = addCapture(
    state,
    {
      text: 'A long reading passage worth saving for close reading.',
      sourceTitle: 'Research',
      sourceUrl: 'https://example.test',
    },
    new Date(now.getTime() + 1),
  );
  state = recordSession(state, 'writing', 20, 'task', now);
  return state;
}
