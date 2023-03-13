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
      const fakeStockClassA = fakeCommonStockClass("Class A");
      model.consume(fakeStockClassA);
      expect(model.stockClasses).toHaveLength(1);
      const modelClass = model.stockClasses[0];

      expect(modelClass.id).toBe(fakeStockClassA.id);
      expect(modelClass.display_name).toBe(fakeStockClassA.name);
      expect(modelClass.is_preferred).toBe(false);
      expect(modelClass.conversion_ratio).toEqual(1);
    });
  });

  function fakeCommonStockClass(id: string) {
    return {
      id: id,
      object_type: "STOCK_CLASS",
      name: `${id} Common Stock`,
      board_approval_date: new Date(),
      class_type: "COMMON",
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
