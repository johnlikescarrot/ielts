import { createEmptyCard, fsrs, generatorParameters, type Card } from 'ts-fsrs';

import type { ReviewRating, StoredSchedule } from './types';

const scheduler = fsrs(
  generatorParameters({
    enable_fuzz: false,
    request_retention: 0.9,
  }),
);

export function serializeSchedule(card: Card): StoredSchedule {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    ...(card.last_review === undefined ? {} : { lastReview: card.last_review.toISOString() }),
  };
}

export function deserializeSchedule(schedule: StoredSchedule): Card {
  return {
    due: new Date(schedule.due),
    stability: schedule.stability,
    difficulty: schedule.difficulty,
    elapsed_days: schedule.elapsedDays,
    scheduled_days: schedule.scheduledDays,
    learning_steps: schedule.learningSteps,
    reps: schedule.reps,
    lapses: schedule.lapses,
    state: schedule.state,
    ...(schedule.lastReview === undefined ? {} : { last_review: new Date(schedule.lastReview) }),
  };
}

export function createSchedule(now: Date): StoredSchedule {
  return serializeSchedule(createEmptyCard(now));
}

export function applyRating(
  schedule: StoredSchedule,
  rating: ReviewRating,
  now: Date,
): StoredSchedule {
  const result = scheduler.next(deserializeSchedule(schedule), now, rating);
  return serializeSchedule(result.card);
}
