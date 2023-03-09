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
    expect(excel.worksheets[0].getCell("A3").value).toBeNull();
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
          legal_name: "Stockholder 1",
        },
        {
          legal_name: "Optionholder 42",
        }
      ),
    });

    expect(sheet).not.toBeNull();
    expect(excel.worksheets[0].getCell("A2").value).toBe("Stakeholder");
    expect(excel.worksheets[0].getCell("A3").value).toBe("Stockholder 1");
    expect(excel.worksheets[0].getCell("A4").value).toBe("Optionholder 42");
    expect(excel.worksheets[0].getCell("A5").value).toBeNull();
  });
});
