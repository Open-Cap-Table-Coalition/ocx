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

    test("nested ranges", () => {
      const excel = new Excel.Workbook();
      const workbookWriter = new ExcelJSWriter(excel);
      const worksheetWriter = workbookWriter.addWorksheet("test");

      const parent = WorksheetRangePrinter.create(
        worksheetWriter,
        "left-to-right"
      );

      parent.addCell(1);

      const child = parent.createNestedRange("left-to-right");
      child.addCell(2);

      parent.addCell(3);

      expect(excel.worksheets[0].getCell("A1").value).toBe(1);
      expect(excel.worksheets[0].getCell("B1").value).toBe(2);
      expect(excel.worksheets[0].getCell("C1").value).toBe(3);
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

    test("nested ranges", () => {
      const excel = new Excel.Workbook();
      const workbookWriter = new ExcelJSWriter(excel);
      const worksheetWriter = workbookWriter.addWorksheet("test");

      const parent = WorksheetRangePrinter.create(
        worksheetWriter,
        "top-to-bottom"
      );

      parent.addCell(1);

      const child = parent.createNestedRange("top-to-bottom");
      child.addCell(2);

      parent.addCell(3);

      expect(excel.worksheets[0].getCell("A1").value).toBe(1);
      expect(excel.worksheets[0].getCell("A2").value).toBe(2);
      expect(excel.worksheets[0].getCell("A3").value).toBe(3);
    });
  });

  // this test describes how one might create a table of data
  // writing headers left-to-right, then columns of data top-down
  // and left-to-right, then a footer
  test("mixed ranges", () => {
    const excel = new Excel.Workbook();
    const workbookWriter = new ExcelJSWriter(excel);
    const worksheetWriter = workbookWriter.addWorksheet("test");

    // Primary orientation here is top-to-bottom
    const subtable = WorksheetRangePrinter.create(
      worksheetWriter,
      "top-to-bottom"
    );

    const header = subtable.createNestedRange("left-to-right");
    header.addCell("A1").addCell("B1").addCell("C1");

    const data = subtable.createNestedRange("top-to-bottom");
    data
      .addCell("A2")
      .addCell("A3")
      .break()
      .addCell("B2")
      .addCell("B3")
      .break()
      .addCell("C2")
      .addCell("C3");

    const footer = subtable.createNestedRange("left-to-right");
    footer.addCell("A4").addCell("B4").addCell("C4");

    expect(excel.worksheets[0].getRow(1).values).toEqual([
      undefined, // the undefined is because `getRow` from ExcelJS still uses index 0 arrays while using index 1 positions
      "A1",
      "B1",
      "C1",
    ]);
    expect(excel.worksheets[0].getRow(2).values).toEqual([
      undefined,
      "A2",
      "B2",
      "C2",
    ]);
    expect(excel.worksheets[0].getRow(3).values).toEqual([
      undefined,
      "A3",
      "B3",
      "C3",
    ]);
    expect(excel.worksheets[0].getRow(4).values).toEqual([
      undefined,
      "A4",
      "B4",
      "C4",
    ]);
  });
});
