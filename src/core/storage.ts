import { initialData, type AppData } from "./model";

export const STORAGE_KEY = "ielts-compass.v1";

export function parseData(raw: string | null): AppData {
  if (!raw) return structuredClone(initialData);
  try {
    const value = JSON.parse(raw) as Partial<AppData>;
    if (
      !Array.isArray(value.cards) ||
      !value.progress ||
      (value.language !== "en" && value.language !== "vi")
    )
      return structuredClone(initialData);
    return value as AppData;
  } catch {
    return structuredClone(initialData);
  }
}

export function serializeData(data: AppData): string {
  return JSON.stringify(data);
}
