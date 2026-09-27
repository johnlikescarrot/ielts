import { describe, expect, it } from "vitest";
import {
  addCard,
  dueCards,
  formatClock,
  initialData,
  schedule,
  wordCount,
} from "./model";

describe("learning model", () => {
  it("filters and orders due cards", () => {
    const cards = [
      { ...initialData.cards[0], id: "later", due: "2026-02-02T00:00:00Z" },
      { ...initialData.cards[1], id: "first", due: "2026-01-01T00:00:00Z" },
      { ...initialData.cards[2], id: "future", due: "2027-01-01T00:00:00Z" },
    ];
    expect(dueCards(cards, new Date("2026-06-01")).map((c) => c.id)).toEqual([
      "first",
      "later",
    ]);
  });
  it.each([
    [1, 1, 2.3],
    [2, 1, 2.45],
    [3, 2, 2.5],
    [4, 3, 2.65],
  ] as const)("schedules first rating %i", (rating, interval, ease) => {
    const result = schedule(
      initialData.cards[0],
      rating,
      new Date("2026-01-01T00:00:00Z"),
    );
    expect(result.interval).toBe(interval);
    expect(result.ease).toBeCloseTo(ease);
    expect(result.reviews).toBe(1);
  });
  it("uses mature intervals and clamps ease", () => {
    const old = { ...initialData.cards[0], reviews: 3, interval: 10, ease: 2 };
    expect(schedule(old, 2, new Date()).interval).toBe(12);
    expect(schedule(old, 3, new Date()).interval).toBe(20);
    expect(schedule(old, 4, new Date()).interval).toBe(30);
    expect(schedule({ ...old, ease: 1.3 }, 1, new Date()).ease).toBe(1.3);
    expect(schedule({ ...old, ease: 3 }, 4, new Date()).ease).toBe(3);
  });
  it("adds normalized unique cards", () => {
    const one = addCard([], "  vivid   example  ", " context ");
    expect(one[0]).toMatchObject({
      front: "vivid example",
      context: "context",
      back: "",
      interval: 0,
    });
    expect(addCard(one, "VIVID EXAMPLE")).toBe(one);
    expect(addCard(one, "   ")).toBe(one);
  });
  it("counts words and formats clocks safely", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount(" one\n two   three ")).toBe(3);
    expect(formatClock(125.9)).toBe("02:05");
    expect(formatClock(-4)).toBe("00:00");
  });
});
