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
      expect(cell("B2").formula).toBe("=A2 / $A$7");
      expect(cell("B3").formula).toBe("=A3 / $A$7");
    });
  });

  describe(Holdings.StockPlanColumn, () => {
    const stockPlanModels = Array.of(
      {
        plan_name: "Stock Plan A",
        initial_shares_reserved: "200",
      },
      {
        plan_name: "Stock Plan B",
        initial_shares_reserved: "200",
      }
    );
    const model = {
      asOfDate: new Date(),
      issuerName: "Fred",
      stakeholders: Array.of(
        {
          display_name: "Stockholder 1",
        },
        {
          display_name: "Optionholder 42",
        }
      ),
      // eslint-disable-next-line
      /* eslint-disable @typescript-eslint/no-unused-vars */
      /* eslint-disable @typescript-eslint/no-explicit-any */
      getStakeholderStockPlanHoldings: (stakeholder: any, stockPlan: any) => {
        return 50;
      },
    };

    test("header", () => {
      const { parentRange, cell } = prepareTestWorksheet();
      const stockPlanPrinter = Holdings.StockPlanColumn.asChildOf(parentRange);
      for (const plan of stockPlanModels) {
        stockPlanPrinter.write(plan, model);
      }
      expect(cell("A1").value).toBe("Stock Plan A");
      expect(cell("B1").value).toBe("Stock Plan B");
    });

    test("holdings for stakeholder", () => {
      const { parentRange, cell } = prepareTestWorksheet();

      const stakeholderPrinter =
        Holdings.StakeholderColumn.asChildOf(parentRange);
      stakeholderPrinter.write(model.stakeholders);

      const stockPlanPrinter = Holdings.StockPlanColumn.asChildOf(parentRange);
      for (const plan of stockPlanModels) {
        stockPlanPrinter.write(plan, model);
      }
      expect(cell("A1").value).toBe("Stakeholder");
      expect(cell("A2").value).toBe("Stockholder 1");
      expect(cell("A3").value).toBe("Optionholder 42");
      expect(cell("B1").value).toBe("Stock Plan A");
      expect(cell("B2").value).toBe(50);
      expect(cell("B3").value).toBe(50);
      expect(cell("C1").value).toBe("Stock Plan B");
      expect(cell("C2").value).toBe(50);
      expect(cell("C3").value).toBe(50);
      expect(cell("A7").value).toBe("Total");
      expect(cell("B7").formula).toBe("=SUM(B2:B3)");
      expect(cell("C7").formula).toBe("=SUM(C2:C3)");
    });

    test("options remaining for issuance", () => {
      const { parentRange, cell } = prepareTestWorksheet();

      const stakeholderPrinter =
        Holdings.StakeholderColumn.asChildOf(parentRange);
      stakeholderPrinter.write(model.stakeholders);

      const stockPlanPrinter = Holdings.StockPlanColumn.asChildOf(parentRange);
      for (const plan of stockPlanModels) {
        stockPlanPrinter.write(plan, model);
      }
      expect(cell("A5").value).toBe("Options Remaining for Issuance");
      expect(cell("A7").value).toBe("Total");
      expect(cell("B5").value).toBe(100);
      expect(cell("B7").formula).toBe("=SUM(B2:B3)");
      expect(cell("C5").value).toBe(100);
      expect(cell("C7").formula).toBe("=SUM(C2:C3)");
    });
  });
});
