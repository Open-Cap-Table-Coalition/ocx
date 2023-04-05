import { describe, expect, test, beforeAll } from "@jest/globals";
import i18next from "i18next";
import us from "../src/strings/us";
import ca from "../src/strings/ca";

describe("translations", () => {
  beforeAll(() => {
    i18next.init({
      lng: "en-US",
      resources: {
        "en-US": us,
        "en-CA": ca,
      },
    });
  });

  test("loads US translations", () => {
    expect(i18next.t("compensation")).toEqual("Stock Options");
  });

  test("loads Canada translations", () => {
    i18next.changeLanguage("en-CA");
    expect(i18next.t("compensation")).toEqual("Stock Appreciation Rights");
  });
});
