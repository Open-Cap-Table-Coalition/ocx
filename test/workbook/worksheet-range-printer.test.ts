import { describe, expect, test } from "@jest/globals";

import Excel from "exceljs";
import ExcelJSWriter from "src/workbook/exceljs-writer";
import WorksheetRangePrinter from "src/workbook/worksheet-range-printer";

describe(WorksheetRangePrinter, () => {
  describe("left-to-right ranges", () => {
    test("single range", () => {
      const excel = new Excel.Workbook();
      const workbookWriter = new ExcelJSWriter(excel);
      const worksheetWriter = workbookWriter.addWorksheet("test");

      const range = WorksheetRangePrinter.create(
        worksheetWriter,
        "left-to-right"
      );

      range
        .addCell(1)
        .addCell(2)
        .addCell(3)
        .break()
        .addCell("x")
        .addCell("y")
        .addCell("z");

      expect(excel.worksheets[0].getCell("A1").value).toBe(1);
      expect(excel.worksheets[0].getCell("B1").value).toBe(2);
      expect(excel.worksheets[0].getCell("C1").value).toBe(3);
      expect(excel.worksheets[0].getCell("A2").value).toBe("x");
      expect(excel.worksheets[0].getCell("B2").value).toBe("y");
      expect(excel.worksheets[0].getCell("C2").value).toBe("z");
    });
  });

  describe("top-to-bottom ranges", () => {
    test("single range", () => {
      const excel = new Excel.Workbook();
      const workbookWriter = new ExcelJSWriter(excel);
      const worksheetWriter = workbookWriter.addWorksheet("test");

      const range = WorksheetRangePrinter.create(
        worksheetWriter,
        "top-to-bottom"
      );

      range
        .addCell(1)
        .addCell(2)
        .addCell(3)
        .break()
        .addCell("x")
        .addCell("y")
        .addCell("z");

      expect(excel.worksheets[0].getCell("A1").value).toBe(1);
      expect(excel.worksheets[0].getCell("A2").value).toBe(2);
      expect(excel.worksheets[0].getCell("A3").value).toBe(3);
      expect(excel.worksheets[0].getCell("B1").value).toBe("x");
      expect(excel.worksheets[0].getCell("B2").value).toBe("y");
      expect(excel.worksheets[0].getCell("B3").value).toBe("z");
    });
  });
});
