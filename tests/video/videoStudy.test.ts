import { describe, expect, it } from "vitest";
import {
  LOOP_DURATIONS,
  createTimestampedVideoUrl,
  createVideoLoop,
  formatVideoTimestamp,
  getVideoPage,
  normalizeLoopDuration,
} from "../../src/video/videoStudy";

describe("videoStudy utilities", () => {
  it("recognises supported video services and rejects malformed or unrelated URLs", () => {
    expect(getVideoPage("https://www.youtube.com/watch?v=abc")).toEqual({
      provider: "youtube",
      url: "https://www.youtube.com/watch?v=abc",
    });
    expect(getVideoPage("https://youtu.be/abc")).toMatchObject({
      provider: "youtube",
    });
    expect(getVideoPage("https://m.bilibili.com/video/BV1xx")).toMatchObject({
      provider: "bilibili",
    });
    expect(getVideoPage("https://example.com/video")).toBeNull();
    expect(getVideoPage("not a URL")).toBeNull();
  });

  it("normalises loop durations to the deliberate practice choices", () => {
    expect(normalizeLoopDuration(LOOP_DURATIONS[0])).toBe(5);
    expect(normalizeLoopDuration(11)).toBe(10);
    expect(normalizeLoopDuration(Number.POSITIVE_INFINITY)).toBe(10);
  });

  it("creates bounded loops for finite media and a safe loop for streams", () => {
    expect(createVideoLoop(12.8, 20, 25)).toEqual({
      startSeconds: 12.8,
      endSeconds: 25,
    });
    expect(createVideoLoop(-3, 5)).toEqual({ startSeconds: 0, endSeconds: 5 });
    expect(createVideoLoop(5, 5, 0)).toEqual({
      startSeconds: 5,
      endSeconds: 10,
    });
    expect(createVideoLoop(Number.NaN, 999, Number.POSITIVE_INFINITY)).toEqual({
      startSeconds: 0,
      endSeconds: 10,
    });
    expect(createVideoLoop(30, 10, 30)).toBeNull();
  });

  it("formats media timestamps defensively", () => {
    expect(formatVideoTimestamp(0)).toBe("0:00");
    expect(formatVideoTimestamp(65.9)).toBe("1:05");
    expect(formatVideoTimestamp(3661)).toBe("1:01:01");
    expect(formatVideoTimestamp(Number.NaN)).toBe("0:00");
  });

  it("creates timestamp links without failing on an invalid saved source", () => {
    expect(
      createTimestampedVideoUrl("https://www.youtube.com/watch?v=abc", 42.8),
    ).toBe("https://www.youtube.com/watch?v=abc&t=42");
    expect(createTimestampedVideoUrl("not a URL", -3)).toBe("not a URL");
  });
});
