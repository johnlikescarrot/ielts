import { type AppState, STATE_VERSION } from './types';

const seedDate = '2026-09-27T08:00:00.000Z';

export function createInitialState(): AppState {
  return {
    version: STATE_VERSION,
    cards: [
      {
        id: 'seed-resilient',
        front: 'resilient',
        back: 'able to recover quickly after difficulty',
        context: 'Coastal communities must become more resilient to extreme weather.',
        tags: ['Writing', 'Band 7'],
        createdAt: seedDate,
        dueAt: seedDate,
        intervalDays: 0,
        repetitions: 0,
        lapses: 0,
        state: 'new'
      },
      {
        id: 'seed-allocate',
        front: 'allocate',
        back: 'to distribute something for a particular purpose',
        context: 'Governments should allocate more funds to public transport.',
        tags: ['Writing', 'Task 2'],
        createdAt: seedDate,
        dueAt: seedDate,
        intervalDays: 0,
        repetitions: 0,
        lapses: 0,
        state: 'new'
      },
      {
        id: 'seed-inevitable',
        front: 'inevitable',
        back: 'certain to happen and impossible to avoid',
        context: 'Some degree of change is inevitable in rapidly growing cities.',
        tags: ['Speaking', 'Part 3'],
        createdAt: seedDate,
        dueAt: seedDate,
        intervalDays: 0,
        repetitions: 0,
        lapses: 0,
        state: 'new'
      }
    ],
    reviews: [],
    shadowSessions: [],
    settings: { locale: 'en', theme: 'light', dailyGoal: 12 }
  };
}
