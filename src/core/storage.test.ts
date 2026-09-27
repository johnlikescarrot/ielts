import { describe, expect, it } from "vitest";
import { initialData } from "./model";
import { parseData, serializeData } from "./storage";
describe("storage", () => {
  it("uses defaults for absent, malformed, or invalid data", () => {
    expect(parseData(null)).toEqual(initialData);
    expect(parseData("{")).toEqual(initialData);
    expect(parseData("{}")).toEqual(initialData);
    expect(
      parseData(JSON.stringify({ ...initialData, language: "fr" })),
    ).toEqual(initialData);
  });
  it("round trips valid data", () => {
    expect(parseData(serializeData(initialData))).toEqual(initialData);
  });
});
