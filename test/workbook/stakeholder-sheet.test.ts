import StakeholderSheet from "src/workbook/stakeholder-sheet";

import { describe, expect, test } from "@jest/globals";

import Excel from "exceljs";
import ExcelJSWriter from "src/workbook/exceljs-writer";

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

  test("per stakeholder holdings for preferred stock and total", () => {
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
        },
        {
          display_name: "Class B Preferred Stock",
          is_preferred: true,
          conversion_ratio: 2,
        }
      ),
      // eslint-disable-next-line
      getStakeholderStockHoldings: (stakeholder, stockClass) => {
        return 50;
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

    expect(excel.worksheets[0].getCell("C5").formula).toBe("=SUM(C3:C4)");
    expect(excel.worksheets[0].getCell("D5").formula).toBe("=SUM(D3:D4)");
    expect(excel.worksheets[0].getCell("E5").formula).toBe("=SUM(E3:E4)");
    expect(excel.worksheets[0].getCell("F5").formula).toBe("=SUM(F3:F4)");
  });
});
