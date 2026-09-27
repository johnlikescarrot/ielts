import type { Rating, ReviewState } from "./model";

const DAY = 86_400_000;

/**
 * A transparent SM-2-derived scheduler. Ratings map to Again, Hard, Good, Easy.
 * It is intentionally deterministic, inspectable, and fully local.
 */
export function scheduleReview(
  current: ReviewState,
  rating: Rating,
  reviewedAt: number,
): ReviewState {
  if (rating === 1) {
    return {
      repetitions: 0,
      intervalDays: 1,
      ease: Math.max(1.3, current.ease - 0.2),
      dueAt: reviewedAt + DAY,
      lapses: current.lapses + 1,
    };
  }

  const repetitions = current.repetitions + 1;
  const firstInterval = rating === 2 ? 1 : rating === 3 ? 2 : 4;
  const multiplier =
    rating === 2 ? 1.2 : rating === 3 ? current.ease : current.ease + 0.35;
  const intervalDays =
    current.repetitions === 0
      ? firstInterval
      : Math.max(1, Math.round(current.intervalDays * multiplier));
  const easeDelta = rating === 2 ? -0.15 : rating === 4 ? 0.15 : 0;
  const ease = Math.max(1.3, Math.min(3, current.ease + easeDelta));

  return {
    repetitions,
    intervalDays,
    ease,
    dueAt: reviewedAt + intervalDays * DAY,
    lapses: current.lapses,
  };
}

export function newReviewState(createdAt: number): ReviewState {
  return {
    repetitions: 0,
    intervalDays: 0,
    ease: 2.5,
    dueAt: createdAt,
    lapses: 0,
  };
}

export function isDue(review: ReviewState, now: number): boolean {
  return review.dueAt <= now;
}

export function formatInterval(days: number): string {
  return days === 1 ? "1 day" : `${days} days`;
}
