import { describe, expect, it } from "vitest";
import { EMPTY_DATA } from "./model";
import {
  addStudyDate,
  cloze,
  createCard,
  currentStreak,
  logSession,
  minutesToday,
  normalizeWords,
  transcriptScore,
  wordCount,
} from "./study";

const NOW = 1_700_000_000_000;

describe("study helpers", () => {
  it("creates a locally due card", () => {
    const card = createCard(
      {
        front: "robust",
        back: "strong",
        context: "robust evidence",
        sourceTitle: "Paper",
        sourceUrl: "https://example.com",
      },
      NOW,
      "card-1",
    );
    expect(card).toMatchObject({
      id: "card-1",
      createdAt: NOW,
      review: { dueAt: NOW },
    });
  });

  it("normalizes text and counts words", () => {
    expect(normalizeWords("  Evidence-based, isn't magic! 42 ")).toEqual([
      "evidence-based",
      "isn't",
      "magic",
      "42",
    ]);
    expect(wordCount("One, two — three.")).toBe(3);
  });

  it("scores transcripts without double-counting words", () => {
    expect(transcriptScore("", "anything")).toBe(0);
    expect(transcriptScore("the quick quick fox", "Quick fox the")).toBe(75);
    expect(transcriptScore("one two", "nothing")).toBe(0);
  });

  it("creates safe cloze prompts", () => {
    expect(cloze("Use C++? C++ is useful.", "C++")).toBe(
      "Use _____? _____ is useful.",
    );
  });

  it("logs scored and unscored practice", () => {
    expect(logSession("reading", 5, NOW, "a")).toEqual({
      id: "a",
      skill: "reading",
      durationMinutes: 5,
      completedAt: NOW,
    });
    expect(logSession("listening", 7, NOW, "b", 88)).toMatchObject({
      score: 88,
    });
  });

  it("sums only sessions within the day", () => {
    const data = {
      ...EMPTY_DATA,
      sessions: [
        logSession("reading", 4, 100, "a"),
        logSession("writing", 7, 199, "b"),
        logSession("speaking", 20, 200, "c"),
      ],
    };
    expect(minutesToday(data, 100, 200)).toBe(11);
  });

  it("calculates consecutive streaks from today", () => {
    expect(currentStreak(["2026-09-26"], "2026-09-27", ["2026-09-26"])).toBe(0);
    expect(
      currentStreak(["2026-09-25", "2026-09-27", "2026-09-26"], "2026-09-27", [
        "2026-09-26",
        "2026-09-25",
        "2026-09-24",
      ]),
    ).toBe(3);
  });

  it("adds each study date once and keeps order", () => {
    expect(addStudyDate(["2026-09-27"], "2026-09-27")).toEqual(["2026-09-27"]);
    expect(addStudyDate(["2026-09-27"], "2026-09-26")).toEqual([
      "2026-09-26",
      "2026-09-27",
    ]);
  });
});
