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
        display_name: "Whodat 001",
      });
      expect(model.stakeholders).toContainEqual({
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
      expect(modelClass.conversion_ratio).toEqual(1);
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
      expect(modelClass.conversion_ratio).toEqual(1);
    });

    test("preferred stock w/ conversion rights", () => {
      const model = subject();
      const preferredStockClass = fakePreferredStockClass("Series A", {
        convertsFrom: "3",
        to: "4",
      });
      model.consume(preferredStockClass);
      expect(model.stockClasses).toHaveLength(1);
      const modelClass = model.stockClasses[0];

      expect(modelClass.id).toBe(preferredStockClass.id);
      expect(modelClass.display_name).toBe(preferredStockClass.name);
      expect(modelClass.is_preferred).toBe(true);
      expect(modelClass.conversion_ratio).toEqual(1.3333333333333333);
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

  function fakeCommonStockClass(id: string, opts?: { boardApproved?: string }) {
    return {
      id: id,
      object_type: "STOCK_CLASS",
      name: `${id} Common Stock`,
      board_approval_date: opts?.boardApproved,
      class_type: "COMMON",
    };
  }

  function fakePreferredStockClass(
    id: string,
    opts?: { convertsFrom?: string; to?: string; boardApproved?: string }
  ) {
    return {
      id: id,
      object_type: "STOCK_CLASS",
      name: `${id} Preferred Stock`,
      board_approval_date: opts?.boardApproved,
      class_type: "PREFERRED",
      conversion_rights: opts?.convertsFrom
        ? [
            {
              conversion_mechanism: {
                type: "RATIO_CONVERSION",
                ratio: {
                  numerator: opts.to,
                  denominator: opts.convertsFrom,
                },
              },
            },
          ]
        : [],
    };
  }

  function fakeStakeholder(id: string): object {
    return {
      id: id,
      object_type: "STAKEHOLDER",
      name: {
        legal_name: `Whodat ${id}`,
      },
    };
  }
});
