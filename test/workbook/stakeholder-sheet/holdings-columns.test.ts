import * as Holdings from "src/workbook/stakeholder-sheet/holdings-columns";

import { describe, expect, test } from "@jest/globals";
import { prepareTestWorksheet } from "../test-utils";

describe("Holdings Columns", () => {
  describe(Holdings.TotalAsConverted, () => {
    test("header", () => {
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      Holdings.TotalAsConverted.asChildOf(parentRange).write(makeExtents());

      expect(cell("A1").value).toBe("Total Stock\n(as converted)");
      expect(cell("B1").value).toBe("Total Stock %\n(as converted)");
    });

    test("formulas when there are stock class ranges", () => {
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      const sourceDataRanges = makeExtents("X2:X3", "Y2:Y3");

      Holdings.TotalAsConverted.asChildOf(parentRange).write(sourceDataRanges);

      expect(cell("A2").formula).toBe("=SUM(X2,Y2)");
      expect(cell("A3").formula).toBe("=SUM(X3,Y3)");
      expect(cell("B2").formula).toBe("=A2 / $A$5");
      expect(cell("B3").formula).toBe("=A3 / $A$5");
    });
  });

  describe(Holdings.StockPlanColumn, () => {
    test("header", () => {
      const stockPlanModels = Array.of(
        {
          plan_name: "Stock Plan A",
        },
        {
          plan_name: "Stock Plan B",
        }
      );

      const { parentRange, cell } = prepareTestWorksheet();
      const stockPlanPrinter = Holdings.StockPlanColumn.asChildOf(parentRange);
      for (const plan of stockPlanModels) {
        stockPlanPrinter.write(plan);
      }
      expect(cell("A1").value).toBe("Stock Plan A");
      expect(cell("B1").value).toBe("Stock Plan B");
    });
  });
});
