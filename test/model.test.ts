import { describe, expect, test } from "@jest/globals";

import OCX from "../src";

describe("model", () => {
  test("creation", () => {
    const d1 = new Date("2022-07-14");
    const d2 = new Date();
    const model = new OCX.Model(d1, d2);
    expect(model.asOfDate).toEqual(d1);
    expect(model.generatedAtTimestamp).toEqual(d2);
  });
});
