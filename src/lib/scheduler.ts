import {createEmptyCard, fsrs, Rating} from 'ts-fsrs';
import type {Card, Grade} from 'ts-fsrs';
import type {ReviewRating, SerializableCard} from '../types';

const scheduler = fsrs({enable_fuzz: false, request_retention: 0.9});

const ratingMap: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export function serializeCard(card: Card): SerializableCard {
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
    ...(card.last_review ? {lastReview: card.last_review.toISOString()} : {}),
  };
}

export function deserializeCard(card: SerializableCard): Card {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    learning_steps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    ...(card.lastReview ? {last_review: new Date(card.lastReview)} : {}),
  };
}

export function createSchedule(now: Date): SerializableCard {
  return serializeCard(createEmptyCard(now));
}

export function scheduleReview(
  card: SerializableCard,
  rating: ReviewRating,
  now: Date,
): SerializableCard {
  return serializeCard(
    scheduler.next(deserializeCard(card), now, ratingMap[rating]).card,
  );
}
