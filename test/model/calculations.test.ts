import Calculations from "src/model/calculations";

import { describe, expect, test } from "@jest/globals";

describe(Calculations.OutstandingStockSharesCalculator, () => {
  test("zero case", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    expect(subject.value).toBe(0);
  });

  test("issuances", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("STOCK_ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("STOCK_ISSUANCE", { quantity: "1" }));
    expect(subject.value).toBe(11);
  });

  test("cancellations", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("STOCK_ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("STOCK_CANCELLATION", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  test("conversion", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("STOCK_ISSUANCE", { quantity: "10" }));
    subject.apply(
      fakeStockTxn("STOCK_CONVERSION", { quantity_converted: "1" })
    );
    expect(subject.value).toBe(9);
  });

  test("reissuance", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(
      fakeStockTxn("STOCK_ISSUANCE", {
        quantity: "10",
        security_id: "security-1",
      })
    );
    subject.apply(
      fakeStockTxn("STOCK_ISSUANCE", {
        quantity: "100",
        security_id: "security-2",
      })
    );
    subject.apply(
      fakeStockTxn("STOCK_REISSUANCE", { security_id: "security-1" })
    );

    // In reality, a re-issuance would be accompanied by a new issuance event.
    // This test does not care about that because that new issuance would also
    // be applied when iterating through all transactions.
    expect(subject.value).toBe(100);

    subject.apply(
      fakeStockTxn("STOCK_REISSUANCE", { security_id: "security-2" })
    );
    expect(subject.value).toBe(0);
  });

  test("issuance / reissuance order doesn't matter", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();

    subject.apply(
      fakeStockTxn("STOCK_REISSUANCE", { security_id: "security-1" })
    );
    subject.apply(
      fakeStockTxn("STOCK_ISSUANCE", {
        quantity: "10",
        security_id: "security-1",
      })
    );

    expect(subject.value).toBe(0);
  });

  test("repurchase", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("STOCK_ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("STOCK_REPURCHASE", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  test("retraction", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("STOCK_ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("STOCK_RETRACTION", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  test("transfer", () => {
    const subject = new Calculations.OutstandingStockSharesCalculator();
    subject.apply(fakeStockTxn("STOCK_ISSUANCE", { quantity: "10" }));
    subject.apply(fakeStockTxn("STOCK_TRANSFER", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  let securityIncrementer = 0;

  function fakeStockTxn(type: string, attrs: { [x: string]: string }) {
    securityIncrementer += 1;

    return {
      object_type: `TX_${type}`,
      security_id: `security-${securityIncrementer}`,
      ...attrs,
    };
  }
});

describe(Calculations.OutstandingStockPlanCalculator, () => {
  test("zero case", () => {
    const subject = new Calculations.OutstandingStockPlanCalculator();
    expect(subject.value).toBe(0);
  });
  test("plan issuances", () => {
    const subject = new Calculations.OutstandingStockPlanCalculator();
    subject.apply(fakePlanTxn("PLAN_SECURITY_ISSUANCE", { quantity: "10" }));
    subject.apply(fakePlanTxn("PLAN_SECURITY_ISSUANCE", { quantity: "1" }));
    expect(subject.value).toBe(11);
  });

  test("plan retractions", () => {
    const subject = new Calculations.OutstandingStockPlanCalculator();
    subject.apply(
      fakePlanTxn("PLAN_SECURITY_ISSUANCE", {
        quantity: "20",
        security_id: "security-1",
      })
    );
    subject.apply(
      fakePlanTxn("PLAN_SECURITY_ISSUANCE", {
        quantity: "15",
        security_id: "security-2",
      })
    );
    subject.apply(
      fakePlanTxn("PLAN_SECURITY_RETRACTION", { security_id: "security-1" })
    );

    expect(subject.value).toBe(15);

    subject.apply(
      fakePlanTxn("PLAN_SECURITY_RETRACTION", { security_id: "security-2" })
    );
    expect(subject.value).toBe(0);
  });

  test("plan cancellations", () => {
    const subject = new Calculations.OutstandingStockPlanCalculator();
    subject.apply(fakePlanTxn("PLAN_SECURITY_ISSUANCE", { quantity: "10" }));
    subject.apply(fakePlanTxn("PLAN_SECURITY_CANCELLATION", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  test("plan releases", () => {
    const subject = new Calculations.OutstandingStockPlanCalculator();
    subject.apply(fakePlanTxn("PLAN_SECURITY_ISSUANCE", { quantity: "10" }));
    subject.apply(fakePlanTxn("PLAN_SECURITY_RELEASE", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  test("plan exercises", () => {
    const subject = new Calculations.OutstandingStockPlanCalculator();
    subject.apply(fakePlanTxn("PLAN_SECURITY_ISSUANCE", { quantity: "10" }));
    subject.apply(fakePlanTxn("PLAN_SECURITY_EXERCISE", { quantity: "1" }));
    expect(subject.value).toBe(9);
  });

  let securityIncrementer = 0;

  function fakePlanTxn(type: string, attrs: { [x: string]: string }) {
    securityIncrementer += 1;

    return {
      object_type: `TX_${type}`,
      security_id: `security-${securityIncrementer}`,
      ...attrs,
    };
  }
});
