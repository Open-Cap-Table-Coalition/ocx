import Calculations from "src/model/calculations";

import { describe, expect, test } from "@jest/globals";

describe(Calculations.OutstandingStockSharesCalculator, () => {
  test("zero case", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    expect(subject.value).toBe(0);
  });

  test("issuances", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("ISSUANCE", { quantity: "1" }));
    expect(subject.value).toBe(11);
  });

  test("cancellations", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("CANCELLATION", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  test("conversion", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("CONVERSION", { quantity_converted: "1" }));
    expect(subject.value).toBe(9);
  });

  test("reissuance", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(
      fakeStockTxn("ISSUANCE", {
        quantity: "10",
        security_id: "security-1",
      })
    );
    subject.apply(
      fakeStockTxn("ISSUANCE", {
        quantity: "100",
        security_id: "security-2",
      })
    );
    subject.apply(fakeStockTxn("REISSUANCE", { security_id: "security-1" }));

    // In reality, a re-issuance would be accompanied by a new issuance event.
    // This test does not care about that because that new issuance would also
    // be applied when iterating through all transactions.
    expect(subject.value).toBe(100);

    subject.apply(fakeStockTxn("REISSUANCE", { security_id: "security-2" }));
    expect(subject.value).toBe(0);
  });

  test("issuance / reissuance order doesn't matter", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();

    subject.apply(fakeStockTxn("REISSUANCE", { security_id: "security-1" }));
    subject.apply(
      fakeStockTxn("ISSUANCE", {
        quantity: "10",
        security_id: "security-1",
      })
    );

    expect(subject.value).toBe(0);
  });

  test("repurchase", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("REPURCHASE", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  test("retraction", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("RETRACTION", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  test("transfer", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("TRANSFER", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  let securityIncrementer = 0;

  function fakeStockTxn(type: string, attrs: { [x: string]: string }) {
    securityIncrementer += 1;

    return {
      object_type: `TX_STOCK_${type}`,
      security_id: `security-${securityIncrementer}`,
      ...attrs,
    };
  }
});
