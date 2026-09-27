import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../src/storage/storageService";
import { SRSCard, TestAttempt } from "../../src/types";
import {
  buildStudyPlan,
  calculateStudyStreak,
  getDateKey,
  selectFocusSkill,
} from "../../src/study/studyPlanner";

const TODAY = new Date(2026, 8, 27, 12, 0, 0);

function attempt(
  skill: TestAttempt["skill"],
  band: number,
  date: Date,
): TestAttempt {
  return {
    id: `${skill}-${date.toISOString()}`,
    date: date.toISOString(),
    skill,
    testId: `${skill}-1`,
    testTitle: `${skill} practice`,
    estimatedBand: band,
    timeSpentSeconds: 600,
  };
}

function card(wordId: string, nextReviewDate: string): SRSCard {
  return {
    wordId,
    interval: 1,
    repetition: 1,
    easeFactor: 2.5,
    nextReviewDate,
    history: [],
  };
}

describe("adaptive study planner", () => {
  it("normalizes valid dates and safely rejects invalid dates", () => {
    expect(getDateKey(TODAY)).toBe("2026-09-27");
    expect(getDateKey("2026-09-27T22:00:00.000Z")).toBe("2026-09-27");
    expect(getDateKey("not-a-date")).toBe("");
  });

  it("counts a current streak and allows the first session of today to be pending", () => {
    const history = [
      attempt("reading", 7, TODAY),
      attempt("writing", 7, new Date(2026, 8, 26, 12)),
      attempt("speaking", 7, new Date(2026, 8, 25, 12)),
    ];
    expect(calculateStudyStreak(history, TODAY)).toBe(3);
    expect(calculateStudyStreak(history.slice(1), TODAY)).toBe(2);
    expect(calculateStudyStreak([], TODAY)).toBe(0);
    expect(
      calculateStudyStreak(
        [attempt("reading", 7, new Date(2026, 8, 24, 12))],
        TODAY,
      ),
    ).toBe(0);
  });

  it("rotates untouched skills and prioritizes the lowest recent band", () => {
    expect(selectFocusSkill([], TODAY)).toBe("writing");
    expect(
      selectFocusSkill(
        [
          attempt("reading", 7.5, TODAY),
          attempt("listening", 6.5, TODAY),
          attempt("writing", 7.5, TODAY),
          attempt("speaking", 7.5, TODAY),
        ],
        TODAY,
      ),
    ).toBe("listening");
    expect(
      selectFocusSkill(
        [
          attempt("reading", 6.5, TODAY),
          attempt("listening", 6.5, TODAY),
          attempt("writing", 8, TODAY),
          attempt("speaking", 8, TODAY),
        ],
        new Date(2026, 8, 1, 12),
      ),
    ).toBe("reading");
  });

  it("prioritizes due vocabulary, weakest skill, and a balanced second skill", () => {
    const settings = { ...DEFAULT_SETTINGS, dailyGoalMinutes: 30 };
    const history = [
      attempt("reading", 7.5, TODAY),
      attempt("listening", 8, TODAY),
      attempt("writing", 6, TODAY),
      attempt("speaking", 7, TODAY),
    ];
    const plan = buildStudyPlan(
      settings,
      history,
      [card("one", "2026-09-27")],
      TODAY,
    );

    expect(plan).toMatchObject({ date: "2026-09-27", targetMinutes: 30 });
    expect(plan.tasks.map((task) => task.skill)).toEqual([
      "vocabulary",
      "writing",
      "speaking",
    ]);
    expect(plan.tasks.map((task) => task.reason)).toEqual([
      "due-vocabulary",
      "focus-skill",
      "balance",
    ]);
    expect(plan.tasks[0].dueCardCount).toBe(1);
    expect(plan.tasks.reduce((sum, task) => sum + task.minutes, 0)).toBe(30);
  });

  it("creates a short plan without review debt and clamps malformed goals", () => {
    const shortPlan = buildStudyPlan(
      { ...DEFAULT_SETTINGS, dailyGoalMinutes: 0 },
      [],
      [],
      TODAY,
    );
    expect(shortPlan.targetMinutes).toBe(15);
    expect(shortPlan.tasks).toHaveLength(2);
    expect(shortPlan.tasks.every((task) => task.minutes >= 5)).toBe(true);

    const safePlan = buildStudyPlan(
      { ...DEFAULT_SETTINGS, dailyGoalMinutes: Number.NaN },
      [],
      [card("tomorrow", "2026-09-28")],
      TODAY,
    );
    expect(safePlan.targetMinutes).toBe(30);
    expect(
      safePlan.tasks.some((task) => task.reason === "due-vocabulary"),
    ).toBe(false);
  });
});
