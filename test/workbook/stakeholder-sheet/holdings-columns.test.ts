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

      getOptionsRemainingForIssuance: (stockPlan: any) => {
        return 100;
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

  describe(Holdings.WarrantColumn, () => {
    const stockClassModels = Array.of(
      {
        display_name: "Common Stock A",
      },
      {
        display_name: "Common Stock B",
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
      getStakeholderWarrantHoldings: (stakeholder: any, stockPlan: any) => {
        return 50;
      },
    };

    test("header", () => {
      const { parentRange, cell } = prepareTestWorksheet();
      const warrantPrinter = Holdings.WarrantColumn.asChildOf(parentRange);
      for (const stockClass of stockClassModels) {
        warrantPrinter.write(stockClass, model);
      }
      expect(cell("A1").value).toBe("Common Stock A Warrants");
      expect(cell("B1").value).toBe("Common Stock B Warrants");
    });

    test("holdings for stakeholder", () => {
      const { parentRange, cell } = prepareTestWorksheet();

      const stakeholderPrinter =
        Holdings.StakeholderColumn.asChildOf(parentRange);
      stakeholderPrinter.write(model.stakeholders);

      const warrantPrinter = Holdings.WarrantColumn.asChildOf(parentRange);
      for (const stockClass of stockClassModels) {
        warrantPrinter.write(stockClass, model);
      }
      expect(cell("A1").value).toBe("Stakeholder");
      expect(cell("A2").value).toBe("Stockholder 1");
      expect(cell("A3").value).toBe("Optionholder 42");
      expect(cell("B1").value).toBe("Common Stock A Warrants");
      expect(cell("B2").value).toBe(50);
      expect(cell("B3").value).toBe(50);
      expect(cell("C1").value).toBe("Common Stock B Warrants");
      expect(cell("C2").value).toBe(50);
      expect(cell("C3").value).toBe(50);
      expect(cell("A7").value).toBe("Total");
      expect(cell("B7").formula).toBe("=SUM(B2:B3)");
      expect(cell("C7").formula).toBe("=SUM(C2:C3)");
    });
  });

  describe(Holdings.NonPlanColumn, () => {
    const stockClassModels = Array.of(
      {
        display_name: "Common Stock A",
      },
      {
        display_name: "Common Stock B",
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
      getStakeholderNonPlanHoldings: (stakeholder: any, stockPlan: any) => {
        return 50;
      },
    };

    test("header", () => {
      const { parentRange, cell } = prepareTestWorksheet();
      const nonPlanPrinter = Holdings.NonPlanColumn.asChildOf(parentRange);
      for (const stockClass of stockClassModels) {
        nonPlanPrinter.write(stockClass, model);
      }
      expect(cell("A1").value).toBe("Common Stock A Non-Plan Awards");
      expect(cell("B1").value).toBe("Common Stock B Non-Plan Awards");
    });

    test("holdings for stakeholder", () => {
      const { parentRange, cell } = prepareTestWorksheet();

      const stakeholderPrinter =
        Holdings.StakeholderColumn.asChildOf(parentRange);
      stakeholderPrinter.write(model.stakeholders);

      const nonPlanPrinter = Holdings.NonPlanColumn.asChildOf(parentRange);
      for (const stockClass of stockClassModels) {
        nonPlanPrinter.write(stockClass, model);
      }
      expect(cell("A1").value).toBe("Stakeholder");
      expect(cell("A2").value).toBe("Stockholder 1");
      expect(cell("A3").value).toBe("Optionholder 42");
      expect(cell("B1").value).toBe("Common Stock A Non-Plan Awards");
      expect(cell("B2").value).toBe(50);
      expect(cell("B3").value).toBe(50);
      expect(cell("C1").value).toBe("Common Stock B Non-Plan Awards");
      expect(cell("C2").value).toBe(50);
      expect(cell("C3").value).toBe(50);
      expect(cell("A7").value).toBe("Total");
      expect(cell("B7").formula).toBe("=SUM(B2:B3)");
      expect(cell("C7").formula).toBe("=SUM(C2:C3)");
    });
  });

  describe(Holdings.FullyDilutedShares, () => {
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

    const stockClasses = Array.of(
      {
        display_name: "Class A Common Stock",
        is_preferred: false,
      },
      {
        display_name: "Class A Preferred Stock",
        is_preferred: true,
        conversion_ratio: 1,
      },
      {
        display_name: "Class A Preferred Stock Converted",
        is_preferred: true,
        conversion_ratio: 2,
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
      getStakeholderStockHoldings: (stakeholder: any, stockClass: any) => {
        return 50;
      },

      getStakeholderStockPlanHoldings: (stakeholder: any, stockPlan: any) => {
        return 50;
      },

      getOptionsRemainingForIssuance: (stockPlan: any) => {
        return 100;
      },
    };

    test("header", () => {
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      Holdings.FullyDilutedShares.asChildOf(parentRange).write(makeExtents());

      expect(cell("A1").value).toBe("Fully Diluted Shares**");
      expect(cell("B1").value).toBe("Fully Diluted %");
    });

    test("formulas", () => {
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      const sourceDataRanges = makeExtents("X2:X3", "Y2:Y3");

      Holdings.FullyDilutedShares.asChildOf(parentRange).write(
        sourceDataRanges
      );

      expect(cell("A2").formula).toBe("=SUM(X2,Y2)");
      expect(cell("A3").formula).toBe("=SUM(X3,Y3)");
      expect(cell("B2").formula).toBe("=A2 / $A$7");
      expect(cell("B3").formula).toBe("=A3 / $A$7");
    });
  });

  describe(Holdings.StockClassAsConvertedColumn, () => {
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
      getStakeholderStockHoldings: (stakeholder: any, stockClass: any) => {
        return 50;
      },

      getStockClassConversionRatio: (stockClass: any) => {
        return 0.7;
      },
    };

    test("normal rounding type for as-converted values", () => {
      const stockClasses = Array.of({
        display_name: "Class A Preferred Stock Converted",
        is_preferred: true,
      });
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      const stockClassPrinter =
        Holdings.StockClassOutstandingColumn.asChildOf(parentRange);
      const stockConvertedPrinter =
        Holdings.StockClassAsConvertedColumn.asChildOf(parentRange);
      const outstandingRange = stockClassPrinter.write(stockClasses[0], model);
      stockConvertedPrinter.write(stockClasses[0], outstandingRange, model);

      expect(cell("A2").value).toBe(50);
      expect(cell("B2").formula).toBe("=ROUND(A2 * 0.7, 0)");
    });

    test("floor rounding type for as-converted values", () => {
      const stockClasses = Array.of({
        display_name: "Class A Preferred Stock Converted",
        is_preferred: true,
        rounding_type: "FLOOR",
      });
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      const stockClassPrinter =
        Holdings.StockClassOutstandingColumn.asChildOf(parentRange);
      const stockConvertedPrinter =
        Holdings.StockClassAsConvertedColumn.asChildOf(parentRange);
      const outstandingRange = stockClassPrinter.write(stockClasses[0], model);
      stockConvertedPrinter.write(stockClasses[0], outstandingRange, model);

      expect(cell("A2").value).toBe(50);
      expect(cell("B2").formula).toBe("=FLOOR(A2 * 0.7, 1)");
    });

    test("ceiling rounding type for as-converted values", () => {
      const stockClasses = Array.of({
        display_name: "Class A Preferred Stock Converted",
        is_preferred: true,
        rounding_type: "CEILING",
      });
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      const stockClassPrinter =
        Holdings.StockClassOutstandingColumn.asChildOf(parentRange);
      const stockConvertedPrinter =
        Holdings.StockClassAsConvertedColumn.asChildOf(parentRange);
      const outstandingRange = stockClassPrinter.write(stockClasses[0], model);
      stockConvertedPrinter.write(stockClasses[0], outstandingRange, model);

      expect(cell("A2").value).toBe(50);
      expect(cell("B2").formula).toBe("=CEILING(A2 * 0.7, 1)");
    });

    test("indicator for approximated conversion stock multiplier", () => {
      const modelWithRoundedRatio = {
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
        getStakeholderStockHoldings: (stakeholder: any, stockClass: any) => {
          return 50;
        },

        getStockClassConversionRatio: (stockClass: any) => {
          return 2.66666665;
        },
      };
      const stockClasses = Array.of({
        display_name: "Class A Preferred Stock Converted",
        is_preferred: true,
      });
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      const stockClassPrinter =
        Holdings.StockClassOutstandingColumn.asChildOf(parentRange);
      const stockConvertedPrinter =
        Holdings.StockClassAsConvertedColumn.asChildOf(parentRange);
      const outstandingRange = stockClassPrinter.write(
        stockClasses[0],
        modelWithRoundedRatio
      );
      stockConvertedPrinter.write(
        stockClasses[0],
        outstandingRange,
        modelWithRoundedRatio
      );

      expect(cell("A1").value).toBe(
        "Class A Preferred Stock Converted\n(outstanding) (~2.6667)"
      );
      expect(cell("B1").value).toBe(
        "Class A Preferred Stock Converted\n(as converted)"
      );
    });
  });

  describe(Holdings.OutstandingNotes, () => {
    test("outstanding notes", () => {
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      const outstandingNotesPrinter =
        Holdings.OutstandingNotes.asChildOf(parentRange);

      outstandingNotesPrinter.write({ value: 1 });

      expect(cell("A1").value).toBe(
        "* Outstanding Shares include all shares of capital stock that are issued and outstanding, but DO NOT include (1) shares of capital stock underlying outstanding warrants and stock options, (2) shares under Stock Plans remaining for issuance or (3) conversion shares for Outstanding Convertible Securities such as convertible notes or SAFEs."
      );
    });
  });

  describe(Holdings.FDNotes, () => {
    test("FD notes", () => {
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      const FDNotesPrinter = Holdings.FDNotes.asChildOf(parentRange);

      FDNotesPrinter.write({ value: 2 });

      expect(cell("A1").value).toBe(
        "** Fully Diluted Shares and % Fully Diluted include (1) Outstanding Shares (as converted to Common Stock), (2) shares of capital stock underlying outstanding warrants and stock options, (3) shares under Stock Plans remaining for issuance, but DO NOT include conversion shares for Outstanding Convertible Securities such as convertible notes or SAFEs."
      );
    });
  });

  describe(Holdings.WarrantsNotes, () => {
    test("Warrants notes", () => {
      const { parentRange, cell, makeExtents } = prepareTestWorksheet();

      const WarrantsNotesPrinter =
        Holdings.WarrantsNotes.asChildOf(parentRange);

      WarrantsNotesPrinter.write("UNSPECIFIED", { value: 3 });

      expect(cell("A1").value).toBe(
        "*** {Notes re: warrant from vendor} There is no specified source for the amount of this warrant"
      );
    });
  });
});
