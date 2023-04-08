import { beforeEach, describe, expect, test } from "@jest/globals";

import Excel from "exceljs";
import ExcelJSWriter from "src/workbook/exceljs-writer";
import { WorksheetLinePrinter } from "src/workbook/interfaces";
import WorksheetRangePrinter from "src/workbook/worksheet-range-printer";

describe(WorksheetRangePrinter, () => {
  let fixture: {
    worksheetWriter: WorksheetLinePrinter;
    worksheet: Excel.Worksheet;
  };

  beforeEach(() => {
    const excel = new Excel.Workbook();
    const workbookWriter = new ExcelJSWriter(excel);
    const worksheetWriter = workbookWriter.addWorksheet("test");

    fixture = {
      worksheetWriter,
      worksheet: excel.worksheets[0],
    };
  });

  describe("left-to-right ranges", () => {
    test("single range", () => {
      const range = WorksheetRangePrinter.create(
        fixture.worksheetWriter,
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

      expect(cell("A1").value).toBe(1);
      expect(cell("B1").value).toBe(2);
      expect(cell("C1").value).toBe(3);
      expect(cell("A2").value).toBe("x");
      expect(cell("B2").value).toBe("y");
      expect(cell("C2").value).toBe("z");
    });

    test("nested ranges", () => {
      const parent = WorksheetRangePrinter.create(
        fixture.worksheetWriter,
        "left-to-right"
      );

      parent.addCell(1);

      const child = parent.createNestedRange("left-to-right");
      child.addCell(2);

      parent.addCell(3);

      expect(cell("A1").value).toBe(1);
      expect(cell("B1").value).toBe(2);
      expect(cell("C1").value).toBe(3);
    });
  });

  describe("top-to-bottom ranges", () => {
    test("single range", () => {
      const range = WorksheetRangePrinter.create(
        fixture.worksheetWriter,
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

      expect(cell("A1").value).toBe(1);
      expect(cell("A2").value).toBe(2);
      expect(cell("A3").value).toBe(3);
      expect(cell("B1").value).toBe("x");
      expect(cell("B2").value).toBe("y");
      expect(cell("B3").value).toBe("z");
    });

    test("nested ranges", () => {
      const parent = WorksheetRangePrinter.create(
        fixture.worksheetWriter,
        "top-to-bottom"
      );

      parent.addCell(1);

      const child = parent.createNestedRange("top-to-bottom");
      child.addCell(2);

      parent.addCell(3);

      expect(cell("A1").value).toBe(1);
      expect(cell("A2").value).toBe(2);
      expect(cell("A3").value).toBe(3);
    });

    test("sums", () => {
      const range = WorksheetRangePrinter.create(
        fixture.worksheetWriter,
        "top-to-bottom"
      );

      range.addCell(1).addCell(2).addCell(3);
      range.addSum();

      expect(cell("A4").formula).toEqual("=SUM(A1:A3)");
    });
  });

  // this test describes how one might create a table of data
  // writing headers left-to-right, then columns of data top-down
  // and left-to-right, then a footer
  test("mixed ranges", () => {
    // Primary orientation here is top-to-bottom
    const subtable = WorksheetRangePrinter.create(
      fixture.worksheetWriter,
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

    expect(fixture.worksheet.getRow(1).values).toEqual([
      undefined, // the undefined is because `getRow` from ExcelJS still uses index 0 arrays while using index 1 positions
      "A1",
      "B1",
      "C1",
    ]);
    expect(fixture.worksheet.getRow(2).values).toEqual([
      undefined,
      "A2",
      "B2",
      "C2",
    ]);
    expect(fixture.worksheet.getRow(3).values).toEqual([
      undefined,
      "A3",
      "B3",
      "C3",
    ]);
    expect(fixture.worksheet.getRow(4).values).toEqual([
      undefined,
      "A4",
      "B4",
      "C4",
    ]);
  });

  function cell(address: string) {
    return fixture.worksheet.getCell(address);
  }
});
