import { DEFAULT_SETTINGS, type AppData } from "./model";

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function parseBackup(raw: string): AppData {
  const candidate: unknown = JSON.parse(raw);
  if (!isRecord(candidate) || candidate.version !== 1) {
    throw new Error("Unsupported backup format");
  }
  if (!Array.isArray(candidate.cards) || !Array.isArray(candidate.sessions)) {
    throw new Error("Backup is missing study data");
  }
  const settings = isRecord(candidate.settings)
    ? { ...DEFAULT_SETTINGS, ...candidate.settings }
    : DEFAULT_SETTINGS;
  const streakDates = Array.isArray(candidate.streakDates)
    ? candidate.streakDates.filter(
        (date): date is string => typeof date === "string",
      )
    : [];
  return {
    version: 1,
    cards: candidate.cards as AppData["cards"],
    sessions: candidate.sessions as AppData["sessions"],
    settings,
    streakDates,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
