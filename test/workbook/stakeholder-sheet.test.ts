import StakeholderSheet from "src/workbook/stakeholder-sheet";

import { describe, expect, test } from "@jest/globals";

import Excel from "exceljs";
import ExcelJSWriter from "src/workbook/exceljs-writer";
import { ConversionRatioCalculator } from "../../src/model/calculations";

describe(StakeholderSheet, () => {
  test("empty case", () => {
    const excel = new Excel.Workbook();
    const workbookWriter = new ExcelJSWriter(excel);
    const worksheetWriter = workbookWriter.addWorksheet("test");

    const sheet = new StakeholderSheet(worksheetWriter, {
      asOfDate: new Date(),
      issuerName: "Fred",
      stakeholders: [],
    });

    expect(sheet).not.toBeNull();
    expect(excel.worksheets[0].getCell("A2").value).toBe("Stakeholder");
  });

  test("two stakeholders", () => {
    const excel = new Excel.Workbook();
    const workbookWriter = new ExcelJSWriter(excel);
    const worksheetWriter = workbookWriter.addWorksheet("test");

    const sheet = new StakeholderSheet(worksheetWriter, {
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
    });

    expect(sheet).not.toBeNull();
    expect(excel.worksheets[0].getCell("A2").value).toBe("Stakeholder");
    expect(excel.worksheets[0].getCell("A3").value).toBe("Stockholder 1");
    expect(excel.worksheets[0].getCell("A4").value).toBe("Optionholder 42");
  });

  test("header for not preferred stock classes", () => {
    const excel = new Excel.Workbook();
    const workbookWriter = new ExcelJSWriter(excel);
    const worksheetWriter = workbookWriter.addWorksheet("test");

    const sheet = new StakeholderSheet(worksheetWriter, {
      asOfDate: new Date(),
      issuerName: "Fred",
      stakeholders: Array.of(),
      stockClasses: Array.of(
        {
          display_name: "Class A Common Stock",
          is_preferred: false,
        },
        {
          display_name: "Class B Common Stock",
          is_preferred: false,
        }
      ),
    });

    expect(sheet).not.toBeNull();
    expect(excel.worksheets[0].getCell("C2").value).toBe(
      "Class A Common Stock"
    );
    expect(excel.worksheets[0].getCell("D2").value).toBe(
      "Class B Common Stock"
    );
  });

  test("per stakeholder holdings for not preferred stock", () => {
    const excel = new Excel.Workbook();
    const workbookWriter = new ExcelJSWriter(excel);
    const worksheetWriter = workbookWriter.addWorksheet("test");

    const sheet = new StakeholderSheet(worksheetWriter, {
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
      stockClasses: Array.of(
        {
          display_name: "Class A Common Stock",
          is_preferred: false,
        },
        {
          display_name: "Class B Common Stock",
          is_preferred: false,
        }
      ),
      // eslint-disable-next-line
      getStakeholderStockHoldings: (stakeholder, stockClass) => {
        return 100;
      },
    });

    expect(sheet).not.toBeNull();
    expect(excel.worksheets[0].getCell("A3").value).toBe("Stockholder 1");
    expect(excel.worksheets[0].getCell("A4").value).toBe("Optionholder 42");
    expect(excel.worksheets[0].getCell("C2").value).toBe(
      "Class A Common Stock"
    );
    expect(excel.worksheets[0].getCell("D2").value).toBe(
      "Class B Common Stock"
    );
    expect(excel.worksheets[0].getCell("C3").value).toBe(100);
    expect(excel.worksheets[0].getCell("C4").value).toBe(100);
    expect(excel.worksheets[0].getCell("D3").value).toBe(100);
    expect(excel.worksheets[0].getCell("D4").value).toBe(100);
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

  test("per stakeholder holdings for preferred stock and total", () => {
    const excel = new Excel.Workbook();
    const workbookWriter = new ExcelJSWriter(excel);
    const worksheetWriter = workbookWriter.addWorksheet("test");
    const stockClasses = Array.of(
      fakeCommonStockClass("Class A"),
      fakePreferredStockClass("Class A"),
      fakePreferredStockClass("Class B", {
        convertsFrom: "2",
        to: "4",
        converts_to_stock_class_id: "Class A",
      })
    );
    const calculator = new ConversionRatioCalculator();
    for (const stockClass of stockClasses) {
      calculator.apply(stockClass);
    }

    const sheet = new StakeholderSheet(worksheetWriter, {
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
      stockClasses: Array.of(
        {
          id: "Class A",
          display_name: "Class A Common Stock",
          is_preferred: false,
        },
        {
          id: "Class A",
          display_name: "Class A Preferred Stock",
          is_preferred: true,
        },
        {
          id: "Class B",
          display_name: "Class B Preferred Stock",
          is_preferred: true,
        }
      ),
      // eslint-disable-next-line
      getStakeholderStockHoldings: (stakeholder, stockClass) => {
        return 50;
      },
      /* eslint-disable @typescript-eslint/no-explicit-any */
      getStockClassConversionRatio: (stockClass: any) => {
        return calculator.findRatio(stockClass.id).ratio;
      },
    });

    expect(sheet).not.toBeNull();
    expect(excel.worksheets[0].getCell("A3").value).toBe("Stockholder 1");
    expect(excel.worksheets[0].getCell("A4").value).toBe("Optionholder 42");
    expect(excel.worksheets[0].getCell("C2").value).toBe(
      "Class A Common Stock"
    );
    expect(excel.worksheets[0].getCell("D2").value).toBe(
      "Class A Preferred Stock\n(outstanding) (1.0000)"
    );
    expect(excel.worksheets[0].getCell("E2").value).toBe(
      "Class B Preferred Stock\n(outstanding) (2.0000)"
    );
    expect(excel.worksheets[0].getCell("F2").value).toBe(
      "Class B Preferred Stock\n(as converted)"
    );
    expect(excel.worksheets[0].getCell("C3").value).toBe(50);
    expect(excel.worksheets[0].getCell("C4").value).toBe(50);
    expect(excel.worksheets[0].getCell("D3").value).toBe(50);
    expect(excel.worksheets[0].getCell("D4").value).toBe(50);
    expect(excel.worksheets[0].getCell("E3").value).toBe(50);
    expect(excel.worksheets[0].getCell("E4").value).toBe(50);
    expect(excel.worksheets[0].getCell("F3").formula).toBe("=ROUND(E3 * 2, 0)");
    expect(excel.worksheets[0].getCell("F4").formula).toBe("=ROUND(E4 * 2, 0)");

    expect(excel.worksheets[0].getCell("C8").formula).toBe("=SUM(C3:C4)");
    expect(excel.worksheets[0].getCell("D8").formula).toBe("=SUM(D3:D4)");
    expect(excel.worksheets[0].getCell("E8").formula).toBe("=SUM(E3:E4)");
    expect(excel.worksheets[0].getCell("F8").formula).toBe("=SUM(F3:F4)");
  });

  test("per shareholder holdings for stock plans and total", () => {
    const excel = new Excel.Workbook();
    const workbookWriter = new ExcelJSWriter(excel);
    const worksheetWriter = workbookWriter.addWorksheet("test");

    const sheet = new StakeholderSheet(worksheetWriter, {
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
      stockClasses: Array.of(
        {
          display_name: "Class A Common Stock",
          is_preferred: false,
        },
        {
          display_name: "Class A Preferred Stock",
          is_preferred: true,
          conversion_ratio: 1,
        }
      ),
      stockPlans: Array.of(
        {
          plan_name: "Stock Plan A",
        },
        {
          plan_name: "Stock Plan B",
        }
      ),
    });

    expect(sheet).not.toBeNull();
    expect(excel.worksheets[0].getCell("A3").value).toBe("Stockholder 1");
    expect(excel.worksheets[0].getCell("A4").value).toBe("Optionholder 42");
    expect(excel.worksheets[0].getCell("C2").value).toBe(
      "Class A Common Stock"
    );
    expect(excel.worksheets[0].getCell("D2").value).toBe(
      "Class A Preferred Stock\n(outstanding) (1.0000)"
    );
    expect(excel.worksheets[0].getCell("E2").value).toBe("Stock Plan A");
    expect(excel.worksheets[0].getCell("F2").value).toBe("Stock Plan B");
  });

  test("fully diluted shares values", () => {
    const excel = new Excel.Workbook();
    const workbookWriter = new ExcelJSWriter(excel);
    const worksheetWriter = workbookWriter.addWorksheet("test");

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

    const stockClassesModels = Array.of(
      {
        id: "Class A",
        display_name: "Class A Common Stock",
        is_preferred: false,
      },
      {
        id: "Class A",
        display_name: "Class A Preferred Stock",
        is_preferred: true,
      },
      {
        id: "Class B",
        display_name: "Class B Preferred Stock",
        is_preferred: true,
      }
    );

    const stockClasses = Array.of(
      fakeCommonStockClass("Class A"),
      fakePreferredStockClass("Class A"),
      fakePreferredStockClass("Class B", {
        convertsFrom: "2",
        to: "4",
        converts_to_stock_class_id: "Class A",
      })
    );
    const calculator = new ConversionRatioCalculator();
    for (const stockClass of stockClasses) {
      calculator.apply(stockClass);
    }

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
      stockClasses: stockClassesModels,
      stockPlans: stockPlanModels,
      // eslint-disable-next-line
      /* eslint-disable @typescript-eslint/no-unused-vars */
      /* eslint-disable @typescript-eslint/no-explicit-any */
      getStakeholderStockHoldings: (stakeholder: any, stockClass: any) => {
        return 50;
      },

      getStakeholderStockPlanHoldings: (stakeholder: any, stockPlan: any) => {
        return 50;
      },

      getStockClassConversionRatio: (stockClass: any) => {
        return calculator.findRatio(stockClass.id).ratio;
      },

      getOptionsRemainingForIssuance: (stockPlan: any) => {
        return 100;
      },
    };

    const sheet = new StakeholderSheet(worksheetWriter, model);

    expect(sheet).not.toBeNull();

    expect(excel.worksheets[0].getCell("L2").value).toBe(
      "Fully Diluted Shares**"
    );
    expect(excel.worksheets[0].getCell("L3").formula).toBe(
      "=SUM(C3,D3,F3,G3,H3)"
    );
    expect(excel.worksheets[0].getCell("M3").formula).toBe("=L3 / $L$8");
    expect(excel.worksheets[0].getCell("M2").value).toBe("Fully Diluted %");
  });

  test("rounding method", () => {
    const excel = new Excel.Workbook();
    const workbookWriter = new ExcelJSWriter(excel);
    const worksheetWriter = workbookWriter.addWorksheet("test");

    const stockClassesModel = Array.of(
      {
        id: "Class A",
        display_name: "Class A Common Stock",
        is_preferred: false,
      },
      {
        id: "Class A",
        display_name: "Class A Preferred Stock Normal",
        is_preferred: true,
        rounding_type: "NORMAL",
      },
      {
        id: "Class B",
        display_name: "Class B Preferred Stock Normal",
        is_preferred: true,
        rounding_type: "NORMAL",
      },
      {
        id: "Class C",
        display_name: "Class C Preferred Stock Floor",
        is_preferred: true,
        rounding_type: "FLOOR",
      },
      {
        id: "Class D",
        display_name: "Class D Preferred Stock Ceiling",
        is_preferred: true,
        rounding_type: "CEILING",
      }
    );
    const stockClasses = Array.of(
      fakeCommonStockClass("Class A"),
      fakeCommonStockClass("Class B"),
      fakeCommonStockClass("Class C"),
      fakePreferredStockClass("Class A"),
      fakePreferredStockClass("Class B", {
        convertsFrom: "2",
        to: "4",
        converts_to_stock_class_id: "Class A",
      }),
      fakePreferredStockClass("Class C", {
        convertsFrom: "1",
        to: "1.3",
        converts_to_stock_class_id: "Class B",
      }),
      fakePreferredStockClass("Class D", {
        convertsFrom: "1",
        to: "0.7",
        converts_to_stock_class_id: "Class C",
      })
    );
    const calculator = new ConversionRatioCalculator();
    for (const stockClass of stockClasses) {
      calculator.apply(stockClass);
    }
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
      stockClasses: stockClassesModel,
      // eslint-disable-next-line
      /* eslint-disable @typescript-eslint/no-unused-vars */
      /* eslint-disable @typescript-eslint/no-explicit-any */
      getStakeholderStockHoldings: (stakeholder: any, stockClass: any) => {
        return 50;
      },

      getStockClassConversionRatio: (stockClass: any) => {
        return calculator.findRatio(stockClass.id).ratio;
      },

      getOptionsRemainingForIssuance: (stockPlan: any) => {
        return 100;
      },
    };

    const sheet = new StakeholderSheet(worksheetWriter, model);

    expect(sheet).not.toBeNull();

    expect(excel.worksheets[0].getCell("F3").formula).toBe("=ROUND(E3 * 2, 0)");
    expect(excel.worksheets[0].getCell("H3").formula).toBe(
      "=FLOOR(G3 * 1.3, 1)"
    );
    expect(excel.worksheets[0].getCell("J3").formula).toBe(
      "=CEILING(I3 * 0.7, 1)"
    );
  });
});
