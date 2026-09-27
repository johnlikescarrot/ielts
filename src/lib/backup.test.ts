import { describe, expect, it } from "vitest";
import { exportData, parseBackup } from "./backup";
import { DEFAULT_SETTINGS, EMPTY_DATA } from "./model";

describe("backup", () => {
  it("round-trips application data", () => {
    expect(parseBackup(exportData(EMPTY_DATA))).toEqual(EMPTY_DATA);
  });

  it.each(["null", "{}", '{"version":2}'])(
    "rejects unsupported data: %s",
    (raw) => {
      expect(() => parseBackup(raw)).toThrow("Unsupported backup format");
    },
  );

  it.each([
    '{"version":1,"cards":{},"sessions":[]}',
    '{"version":1,"cards":[],"sessions":{}}',
  ])("rejects missing study arrays", (raw) => {
    expect(() => parseBackup(raw)).toThrow("Backup is missing study data");
  });

  it("fills optional legacy fields and filters invalid dates", () => {
    const parsed = parseBackup(
      JSON.stringify({
        version: 1,
        cards: [],
        sessions: [],
        settings: { language: "vi" },
        streakDates: ["2026-09-27", 42],
      }),
    );
    expect(parsed.settings).toEqual({ ...DEFAULT_SETTINGS, language: "vi" });
    expect(parsed.streakDates).toEqual(["2026-09-27"]);
  });

  it("uses defaults when optional fields are absent", () => {
    const parsed = parseBackup('{"version":1,"cards":[],"sessions":[]}');
    expect(parsed.settings).toEqual(DEFAULT_SETTINGS);
    expect(parsed.streakDates).toEqual([]);
  });
});
