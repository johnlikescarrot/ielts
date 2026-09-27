import { describe, expect, it } from "vitest";
import {
  formatInterval,
  isDue,
  newReviewState,
  scheduleReview,
} from "./scheduler";

const NOW = 1_700_000_000_000;

describe("scheduler", () => {
  it("creates a due review state", () => {
    const state = newReviewState(NOW);
    expect(state).toEqual({
      repetitions: 0,
      intervalDays: 0,
      ease: 2.5,
      dueAt: NOW,
      lapses: 0,
    });
    expect(isDue(state, NOW)).toBe(true);
    expect(isDue({ ...state, dueAt: NOW + 1 }, NOW)).toBe(false);
  });

  it("resets a forgotten card and clamps ease", () => {
    expect(
      scheduleReview(
        { repetitions: 4, intervalDays: 9, ease: 1.35, dueAt: 0, lapses: 2 },
        1,
        NOW,
      ),
    ).toMatchObject({ repetitions: 0, intervalDays: 1, ease: 1.3, lapses: 3 });
  });

  it.each([
    [2, 1, 2.35],
    [3, 2, 2.5],
    [4, 4, 2.65],
  ] as const)(
    "sets the first passing interval for rating %i",
    (rating, interval, ease) => {
      const result = scheduleReview(newReviewState(NOW), rating, NOW);
      expect(result).toMatchObject({
        repetitions: 1,
        intervalDays: interval,
        ease,
      });
      expect(result.dueAt).toBe(NOW + interval * 86_400_000);
    },
  );

  it.each([
    [2, 12, 2.35],
    [3, 25, 2.5],
    [4, 31, 2.85],
  ] as const)("grows mature cards for rating %i", (rating, interval, ease) => {
    const result = scheduleReview(
      {
        repetitions: 2,
        intervalDays: 10,
        ease: rating === 4 ? 2.7 : 2.5,
        dueAt: 0,
        lapses: 1,
      },
      rating,
      NOW,
    );
    expect(result).toMatchObject({
      repetitions: 3,
      intervalDays: interval,
      ease,
      lapses: 1,
    });
  });

  it("clamps low intervals and high ease", () => {
    expect(
      scheduleReview(
        { repetitions: 2, intervalDays: 0, ease: 3, dueAt: 0, lapses: 0 },
        4,
        NOW,
      ),
    ).toMatchObject({ intervalDays: 1, ease: 3 });
  });

  it("formats intervals", () => {
    expect(formatInterval(1)).toBe("1 day");
    expect(formatInterval(3)).toBe("3 days");
  });
});
