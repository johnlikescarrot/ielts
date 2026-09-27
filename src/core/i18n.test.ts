import { describe, expect, it } from "vitest";
import { translate } from "./i18n";
describe("translation", () => {
  it("returns both language catalogs", () => {
    expect(translate("en", "today")).toBe("Today");
    expect(translate("vi", "today")).toBe("Hôm nay");
  });
});
