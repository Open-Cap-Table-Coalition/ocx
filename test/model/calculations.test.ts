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
    subject.apply(
      fakePlanTxn("EQUITY_COMPENSATION_ISSUANCE", { quantity: "10" })
    );
    subject.apply(fakePlanTxn("PLAN_SECURITY_CANCELLATION", { quantity: "1" }));
    subject.apply(
      fakePlanTxn("EQUITY_COMPENSATION_CANCELLATION", { quantity: "1" })
    );
    expect(subject.value).toBe(18);
  });

  test("plan releases", () => {
    const subject = new Calculations.OutstandingStockPlanCalculator();
    subject.apply(fakePlanTxn("PLAN_SECURITY_ISSUANCE", { quantity: "10" }));
    subject.apply(fakePlanTxn("PLAN_SECURITY_RELEASE", { quantity: "1" }));
    subject.apply(
      fakePlanTxn("EQUITY_COMPENSATION_RELEASE", { quantity: "1" })
    );
    expect(subject.value).toBe(8);
  });

  test("plan exercises", () => {
    const subject = new Calculations.OutstandingStockPlanCalculator();
    subject.apply(fakePlanTxn("PLAN_SECURITY_ISSUANCE", { quantity: "10" }));
    subject.apply(fakePlanTxn("PLAN_SECURITY_EXERCISE", { quantity: "1" }));
    subject.apply(
      fakePlanTxn("EQUITY_COMPENSATION_EXERCISE", { quantity: "1" })
    );
    expect(subject.value).toBe(8);
  });

  test("plan transfer", () => {
    const subject = new Calculations.OutstandingStockPlanCalculator();
    subject.apply(fakePlanTxn("PLAN_SECURITY_ISSUANCE", { quantity: "10" }));
    subject.apply(fakePlanTxn("PLAN_SECURITY_TRANSFER", { quantity: "1" }));
    subject.apply(
      fakePlanTxn("EQUITY_COMPENSATION_TRANSFER", { quantity: "1" })
    );
    expect(subject.value).toBe(8);
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

describe(Calculations.OptionsRemainingCalculator, () => {
  type StockPlanPoolAdjustment = {
    date: string;
    shares_reserved: string;
  };

  const adjustments: Set<StockPlanPoolAdjustment> = new Set([
    {
      object_type: "STOCK_PLAN_POOL_ADJUSTMENT",
      date: "2022-11-14",
      shares_reserved: "400",
    },
    {
      object_type: "STOCK_PLAN_POOL_ADJUSTMENT",
      date: "2022-11-15",
      shares_reserved: "200",
    },
  ]);

  test("zero case", () => {
    const subject = new Calculations.OptionsRemainingCalculator();
    expect(subject.value).toBe(0);
  });
  test("value with two adjstments", () => {
    const subject = new Calculations.OptionsRemainingCalculator();
    subject.apply("500", 100, adjustments);
    expect(subject.value).toBe(100);
  });
});

describe(Calculations.ConversionRatioCalculator, () => {
  const stockClasses = [
    fakeCommonStockClass("Fake-1"),
    fakePreferredStockClass("Fake-2", {
      convertsFrom: "2",
      to: "4",
    }),
  ];

  test("converts_to_stock_class_id is null", () => {
    const subject = new Calculations.ConversionRatioCalculator();
    for (const stockClass of stockClasses) {
      subject.apply(stockClass);
    }
    expect(subject.findRatio(stockClasses[1].id).ratio).toBe(1);
  });

  test("one StockClassConversionRight that converts to a common stock class", () => {
    const subject = new Calculations.ConversionRatioCalculator();
    stockClasses.push(
      fakePreferredStockClass("Fake-3", {
        convertsFrom: "2",
        to: "10",
        converts_to_stock_class_id: "Fake-1",
      })
    );
    for (const stockClass of stockClasses) {
      subject.apply(stockClass);
    }
    expect(subject.findRatio(stockClasses[2].id).ratio).toBe(5);
  });

  test("2 or more StockClassConversionRights that convert to different common stock classes", () => {
    const subject = new Calculations.ConversionRatioCalculator();
    const commonClass = fakeCommonStockClass("Fake-4");
    commonClass.votes_per_share = 0.5;
    stockClasses.push(commonClass);
    const preferredClass = fakePreferredStockClass("Fake-5", {
      convertsFrom: "2",
      to: "10",
      converts_to_stock_class_id: "Fake-1",
    });
    preferredClass.conversion_rights.push({
      conversion_mechanism: {
        type: "RATIO_CONVERSION",
        ratio: {
          numerator: "9",
          denominator: "3",
        },
        rounding_type: undefined,
      },
      converts_to_stock_class_id: "Fake-4",
    });
    stockClasses.push(preferredClass);
    for (const stockClass of stockClasses) {
      subject.apply(stockClass);
    }
    expect(subject.findRatio(preferredClass.id).ratio).toBe(3);
  });
});

function fakeCommonStockClass(id: string, opts?: { boardApproved?: string }) {
  return {
    id: id,
    object_type: "STOCK_CLASS",
    name: `${id} Common Stock`,
    board_approval_date: opts?.boardApproved,
    class_type: "COMMON",
    votes_per_share: 1,
  };
}

function fakePreferredStockClass(
  id: string,
  opts?: {
    convertsFrom?: string;
    to?: string;
    boardApproved?: string;
    converts_to_stock_class_id?: string;
  },
  rounding_type?: string
) {
  return {
    id: id,
    object_type: "STOCK_CLASS",
    name: `${id} Preferred Stock`,
    board_approval_date: opts?.boardApproved,
    class_type: "PREFERRED",
    votes_per_share: 1,
    conversion_rights: opts?.convertsFrom
      ? [
          {
            conversion_mechanism: {
              type: "RATIO_CONVERSION",
              ratio: {
                numerator: opts.to,
                denominator: opts.convertsFrom,
              },
              rounding_type: rounding_type,
            },
            converts_to_stock_class_id: opts.converts_to_stock_class_id,
          },
        ]
      : [],
  };
}
