import OCX from "src";

import { describe, expect, test } from "@jest/globals";

describe(OCX.Model, () => {
  test("creation", () => {
    const d1 = new Date("2022-07-14");
    const d2 = new Date();
    const model = new OCX.Model(d1, d2);
    expect(model.asOfDate).toEqual(d1);
    expect(model.generatedAtTimestamp).toEqual(d2);
  });

  function subject() {
    return new OCX.Model(new Date(), new Date());
  }

  describe("stakeholders", () => {
    test("empty case", () => {
      const model = subject();
      expect(model.stakeholders).toHaveLength(0);
    });

    test("multiple stakeholders", () => {
      const model = subject();
      const fakeStakeholder001 = fakeStakeholder("001");
      const fakeStakeholder002 = fakeStakeholder("002");
      model.consume(fakeStakeholder001);
      model.consume(fakeStakeholder002);
      expect(model.stakeholders).toHaveLength(2);

      expect(model.stakeholders).toContainEqual({
        id: "001",
        display_name: "Whodat 001",
      });
      expect(model.stakeholders).toContainEqual({
        id: "002",
        display_name: "Whodat 002",
      });
    });
  });

  describe("stock classes", () => {
    test("empty case", () => {
      const model = subject();
      expect(model.stockClasses).toHaveLength(0);
    });

    test("common stock", () => {
      const model = subject();
      const commonStockClass = fakeCommonStockClass("Class A");
      model.consume(commonStockClass);
      expect(model.stockClasses).toHaveLength(1);
      const modelClass = model.stockClasses[0];

      expect(modelClass.id).toBe(commonStockClass.id);
      expect(modelClass.display_name).toBe(commonStockClass.name);
      expect(modelClass.is_preferred).toBe(false);
      expect(model.getStockClassConversionRatio(modelClass)).toEqual(1);
    });

    test("preferred stock w/ no conversion rights", () => {
      const model = subject();
      const preferredStockClass = fakePreferredStockClass("Series Seed");
      model.consume(preferredStockClass);
      expect(model.stockClasses).toHaveLength(1);
      const modelClass = model.stockClasses[0];

      expect(modelClass.id).toBe(preferredStockClass.id);
      expect(modelClass.display_name).toBe(preferredStockClass.name);
      expect(modelClass.is_preferred).toBe(true);
      expect(model.getStockClassConversionRatio(modelClass)).toEqual(1);
    });

    test("preferred stock w/ conversion rights", () => {
      const model = subject();
      const commonStockClass = fakeCommonStockClass("Class A");
      const preferredStockClass = fakePreferredStockClass("Series A", {
        convertsFrom: "3",
        to: "4",
        converts_to_stock_class_id: "Class A",
      });
      model.consume(commonStockClass);
      model.consume(preferredStockClass);
      expect(model.stockClasses).toHaveLength(2);
      const modelClass = model.stockClasses[1];

      expect(modelClass.id).toBe(preferredStockClass.id);
      expect(modelClass.display_name).toBe(preferredStockClass.name);
      expect(modelClass.is_preferred).toBe(true);
      expect(model.getStockClassConversionRatio(modelClass)).toEqual(
        1.3333333333333333
      );
    });

    test("stock class sort order", () => {
      const model = subject();
      const commonStockClassA = fakeCommonStockClass("Abc", {
        boardApproved: "2011-01-01",
      });
      const commonStockClassB = fakeCommonStockClass("Bcd", {
        boardApproved: new Date().toISOString(),
      });
      const commonStockClassC = fakeCommonStockClass("Cde");
      const commonStockClassD = fakeCommonStockClass("Def");

      const preferredStockClass001 = fakePreferredStockClass("001", {
        boardApproved: "2010-01-01",
      });
      const preferredStockClass002 = fakePreferredStockClass("002", {
        boardApproved: new Date().toISOString(),
      });
      const preferredStockClass003 = fakePreferredStockClass("003", {
        boardApproved: preferredStockClass002.board_approval_date,
      });
      const preferredStockClass004 = fakePreferredStockClass("004");

      model.consume(preferredStockClass004);
      model.consume(preferredStockClass003);
      model.consume(preferredStockClass002);
      model.consume(preferredStockClass001);
      model.consume(commonStockClassD);
      model.consume(commonStockClassC);
      model.consume(commonStockClassB);
      model.consume(commonStockClassA);

      expect(model.stockClasses.map((sc) => sc.id).join(" ")).toEqual(
        "Abc Bcd Cde Def 001 002 003 004"
      );
    });
  });

  function fakeStakeholder(id: string): object {
    return {
      id,
      object_type: "STAKEHOLDER",
      name: {
        legal_name: `Whodat ${id}`,
      },
    };
  }

  describe("test stock plans", () => {
    test("empty case", () => {
      const model = subject();
      expect(model.stockPlans).toHaveLength(0);
    });

    test("model stock plan", () => {
      const model = subject();
      const commonStockPlan = fakeStockPlan("Stock Plan");
      model.consume(commonStockPlan);
      expect(model.stockPlans).toHaveLength(1);
      const stockPlan = model.stockPlans[0];

      expect(stockPlan.id).toBe(commonStockPlan.id);
      expect(stockPlan.plan_name).toBe(commonStockPlan.plan_name);
    });

    test("stock plan sort order", () => {
      const model = subject();
      const commonStockPlanA = fakeStockPlan("Stock Plan Z", {
        boardApproved: "2011-01-01",
      });
      const commonStockPlanB = fakeStockPlan("Stock Plan B", {
        boardApproved: new Date().toISOString(),
      });
      const commonStockPlanC = fakeStockPlan("Stock Plan C");
      const commonStockPlanD = fakeStockPlan("Stock Plan D");

      model.consume(commonStockPlanA);
      model.consume(commonStockPlanB);
      model.consume(commonStockPlanC);
      model.consume(commonStockPlanD);

      expect(model.stockPlans.map((plan) => plan.id).join(" ")).toEqual(
        "Stock Plan Z Stock Plan B Stock Plan C Stock Plan D"
      );
    });

    test("stock plan conversion", () => {
      const model = subject();
      const holder = fakeStakeholder("Fake Holder");
      const fakeCommon = fakeCommonStockClass("Fake Common");
      const fakePreferred = fakePreferredStockClass(
        "Fake",
        {
          convertsFrom: "4",
          to: "2",
          converts_to_stock_class_id: fakeCommon.id,
        },
        "NORMAL"
      );
      const stockPlan = fakeStockPlan("Fake Plan", {
        stock_class_id: fakePreferred.id,
      });
      model.consume(holder);
      model.consume(stockPlan);
      model.consume(fakePreferred);
      model.consume(fakeCommon);
      model.consume(
        fakePlanTxn("PLAN_SECURITY_ISSUANCE", {
          quantity: "10",
          stock_plan_id: stockPlan.id,
          stakeholder_id: "Fake Holder",
        })
      );
      expect(
        model.getStakeholderStockPlanHoldings(
          model.stakeholders[0],
          model.stockPlans[0]
        )
      ).toBe(5);
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

  function fakeStockPlan(
    id: string,
    opts?: { boardApproved?: string; stock_class_id?: string }
  ) {
    return {
      id: id,
      object_type: "STOCK_PLAN",
      plan_name: `${id}`,
      board_approval_date: opts?.boardApproved,
      initial_shares_reserved: "1000000",
      stock_class_id: opts?.stock_class_id,
    };
  }

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

  describe("getStakeholderStockHoldings", () => {
    test("simple case", () => {
      const model = subject();
      model.consume(fakeCommonStockClass("Fake"));
      model.consume(fakeStakeholder("joe"));
      model.consume(fakeStockIssuanceForStakeholder("joe", "Fake")[0]);

      expect(
        model.getStakeholderStockHoldings(
          model.stakeholders[0],
          model.stockClasses[0]
        )
      ).toBe(100);
    });
  });

  describe("getStakeholderStockPlanHoldings", () => {
    test("when we have issuances", () => {
      const model = subject();
      model.consume(fakeStockPlan("Fake"));
      model.consume(fakeStakeholder("joe"));
      model.consume(fakeStockIssuanceForStakeholder("joe", "Fake")[1]);
      model.consume(fakeStockIssuanceForStakeholder("joe", "Fake")[2]);

      expect(
        model.getStakeholderStockPlanHoldings(
          model.stakeholders[0],
          model.stockPlans[0]
        )
      ).toBe(120);
    });

    test("when we have issuances and retractions", () => {
      const model = subject();
      model.consume(fakeStockPlan("Fake"));
      model.consume(fakeStakeholder("joe"));

      // if we consume retraction before issuance
      model.consume(fakeStockIssuanceForStakeholder("joe", "Fake")[3]);
      expect(
        model.getStakeholderStockPlanHoldings(
          model.stakeholders[0],
          model.stockPlans[0]
        )
      ).toBe(0);

      model.consume(fakeStockIssuanceForStakeholder("joe", "Fake")[1]);
      model.consume(fakeStockIssuanceForStakeholder("joe", "Fake")[2]);

      expect(
        model.getStakeholderStockPlanHoldings(
          model.stakeholders[0],
          model.stockPlans[0]
        )
      ).toBe(20);
    });
  });

  describe("rounding method", () => {
    test("normal type", () => {
      const model = subject();
      model.consume(
        fakePreferredStockClass(
          "Fake",
          { convertsFrom: "3", to: "2" },
          "NORMAL"
        )
      );

      expect(model.stockClasses[0].rounding_type).toBe("NORMAL");
    });

    test("floor type", () => {
      const model = subject();
      model.consume(
        fakePreferredStockClass("Fake", { convertsFrom: "3", to: "2" }, "FLOOR")
      );

      expect(model.stockClasses[0].rounding_type).toBe("FLOOR");
    });

    test("ceiling type", () => {
      const model = subject();
      model.consume(
        fakePreferredStockClass(
          "Fake",
          { convertsFrom: "3", to: "2" },
          "CEILING"
        )
      );

      expect(model.stockClasses[0].rounding_type).toBe("CEILING");
    });
  });

  describe("warrants", () => {
    test("target class for warrant", () => {
      const model = subject();
      const holder = fakeStakeholder("Fake Holder");
      const fakeCommon = fakeCommonStockClass("Fake Common");
      const fakeCommon2 = fakeCommonStockClass("Fake Common 2");
      const fakePreferred = fakePreferredStockClass(
        "Fake Preferred 1",
        {
          convertsFrom: "2",
          to: "4",
          converts_to_stock_class_id: fakeCommon.id,
        },
        "NORMAL"
      );
      const fakePreferred2 = fakePreferredStockClass(
        "Fake Preferred 2",
        {
          convertsFrom: "4",
          to: "2",
          converts_to_stock_class_id: fakeCommon2.id,
        },
        "NORMAL"
      );

      model.consume(fakePreferred);
      model.consume(fakePreferred2);

      model.consume(fakeCommon);
      model.consume(fakeCommon2);

      model.consume(holder);

      model.consume(
        fakeWarrantTxn("WARRANT_ISSUANCE", {
          quantity: "10",
          exercise_triggers: [
            {
              conversion_right: {
                conversion_mechanism: {
                  type: "FIXED_AMOUNT_CONVERSION",
                  converts_to_quantity: "10000.00",
                },
                converts_to_stock_class_id: fakePreferred.id,
              },
            },
          ],
          stakeholder_id: "Fake Holder",
        })
      );

      model.consume(
        fakeWarrantTxn("WARRANT_ISSUANCE", {
          quantity: "17",
          exercise_triggers: [
            {
              conversion_right: {
                conversion_mechanism: {
                  type: "FIXED_AMOUNT_CONVERSION",
                  converts_to_quantity: "10000.00",
                },
                converts_to_stock_class_id: fakePreferred2.id,
              },
            },
          ],
          stakeholder_id: "Fake Holder",
        })
      );
      expect(Array.from(model.warrantStockIds)[0]).toBe("Fake Preferred 1");
      expect(model.getConversionCommonStockClass(fakePreferred)).toEqual({
        display_name: fakeCommon.name,
        is_preferred: false,
        board_approval_date: null,
      });
      expect(model.getStockClassConversionRatio(fakePreferred)).toEqual(2);
      const security =
        model.stockClasses.find((cls) => cls.id === "Fake Preferred 2") ||
        model.stakeholders[1];
      expect(
        model.getStakeholderWarrantHoldings(model.stakeholders[0], security)
      ).toEqual(8.5);
    });
    let securityIncrementer = 0;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    function fakeWarrantTxn(
      type: string,
      attrs: { [x: string]: string | Array<any> }
    ) {
      securityIncrementer += 1;

      return {
        object_type: `TX_${type}`,
        security_id: `security-${securityIncrementer}`,
        ...attrs,
      };
    }
  });

  describe("non plan awards", () => {
    test("target class for non plan awards", () => {
      const model = subject();
      const holder = fakeStakeholder("Fake Holder");
      const fakeCommon = fakeCommonStockClass("Fake Common");
      const fakeCommon2 = fakeCommonStockClass("Fake Common 2");
      const fakePreferred = fakePreferredStockClass(
        "Fake Preferred 1",
        {
          convertsFrom: "2",
          to: "4",
          converts_to_stock_class_id: fakeCommon.id,
        },
        "NORMAL"
      );
      const fakePreferred2 = fakePreferredStockClass(
        "Fake Preferred 2",
        {
          convertsFrom: "4",
          to: "2",
          converts_to_stock_class_id: fakeCommon2.id,
        },
        "NORMAL"
      );

      model.consume(fakePreferred);
      model.consume(fakePreferred2);

      model.consume(fakeCommon);
      model.consume(fakeCommon2);

      model.consume(holder);

      model.consume(
        fakeNonPlanTxn("EQUITY_COMPENSATION_ISSUANCE", {
          quantity: "10",
          stakeholder_id: "Fake Holder",
          stock_class_id: fakePreferred.id,
        })
      );

      model.consume(
        fakeNonPlanTxn("EQUITY_COMPENSATION_ISSUANCE", {
          quantity: "17",
          stakeholder_id: "Fake Holder",
          stock_class_id: fakePreferred2.id,
        })
      );
      expect(Array.from(model.nonPlanStockIds)[0]).toBe("Fake Preferred 1");
      expect(model.getConversionCommonStockClass(fakePreferred)).toEqual({
        display_name: fakeCommon.name,
        is_preferred: false,
        board_approval_date: null,
      });
      expect(model.getStockClassConversionRatio(fakePreferred)).toEqual(2);
      const security =
        model.stockClasses.find((cls) => cls.id === "Fake Preferred 2") ||
        model.stakeholders[1];
      expect(
        model.getStakeholderNonPlanHoldings(model.stakeholders[0], security)
      ).toEqual(8.5);
    });

    let securityIncrementer = 0;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    function fakeNonPlanTxn(
      type: string,
      attrs: { [x: string]: string | Array<any> }
    ) {
      securityIncrementer += 1;

      return {
        object_type: `TX_${type}`,
        security_id: `security-${securityIncrementer}`,
        ...attrs,
      };
    }
  });

  function fakeStockIssuanceForStakeholder(id: string, stock_id: string) {
    return [
      {
        security_id: "yup",
        stakeholder_id: id,
        stock_class_id: stock_id,
        quantity: "100",
        object_type: "TX_STOCK_ISSUANCE",
      },
      {
        security_id: "plan-issuance-1",
        stakeholder_id: id,
        stock_plan_id: stock_id,
        quantity: "100",
        object_type: "TX_PLAN_SECURITY_ISSUANCE",
      },
      {
        security_id: "plan-issuance-2",
        stakeholder_id: id,
        stock_plan_id: stock_id,
        quantity: "20",
        object_type: "TX_PLAN_SECURITY_ISSUANCE",
      },
      {
        id: "retraction-1",
        security_id: "plan-issuance-1",
        object_type: "TX_PLAN_SECURITY_RETRACTION",
      },
    ];
  }
});
