import Calculations from "src/model/calculations";

import { describe, expect, test } from "@jest/globals";

describe(Calculations.OutstandingStockSharesCalculator, () => {
  test("zero case", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    expect(subject.value).toBe(0);
  });

  test("issuances", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply({ object_type: "TX_STOCK_ISSUANCE", quantity: "10" });
    subject.apply({ object_type: "TX_STOCK_ISSUANCE", quantity: "1" });
    expect(subject.value).toBe(11);
  });

  test("cancellations", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply({ object_type: "TX_STOCK_ISSUANCE", quantity: "10" });
    subject.apply({ object_type: "TX_STOCK_CANCELLATION", quantity: "1" });
    expect(subject.value).toBe(9);
  });
});
