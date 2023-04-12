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
    header.addCell(">").addCell(">").addCell(">");

    const data = subtable
      .createNestedRange("left-to-right")
      .createNestedRange("top-to-bottom");
    data
      .addCell("v")
      .addCell("v")
      .break()
      .addCell("v")
      .addCell("v")
      .break()
      .addCell("v")
      .addCell("v");

    const footer = subtable.createNestedRange("left-to-right");
    footer.addCell(">").addCell(">").addCell(">");

    expect(row(1)).toEqual(">>>");
    expect(row(2)).toEqual("vvv");
    expect(row(3)).toEqual("vvv");
    expect(row(5)).toEqual(">>>");
  });

  test("dimensionally-mismatched ranges", () => {
    // This test will make a shape with an empty center
    // just to prove that it doesn't have to "fill"
    // v>>v
    // v  v
    // >>>>
    //

    const container = WorksheetRangePrinter.create(
      fixture.worksheetWriter,
      "top-to-bottom"
    );

    const leftTopAndRight = container.createNestedRange("left-to-right");

    const left = leftTopAndRight.createNestedRange("top-to-bottom");
    left.addCell("v").addCell("v");

    const top = leftTopAndRight.createNestedRange("left-to-right");
    top.addCell(">").addCell(">");

    const right = leftTopAndRight.createNestedRange("top-to-bottom");
    right.addCell("v").addCell("v");

    const bottom = container.createNestedRange("left-to-right");
    bottom.addCell(">").addCell(">").addCell(">").addCell(">");

    expect(row(1)).toEqual("v>>v");
    expect(row(2)).toEqual("v  v");
    expect(row(3)).toEqual(">>>>");
  });

  function cell(address: string) {
    return fixture.worksheet.getCell(address);
  }

  function row(rowNum: number) {
    let content = "";

    fixture.worksheet
      .getRow(rowNum)
      .eachCell({ includeEmpty: true }, (cell) => {
        content += cell.value ?? " ";
      });

    return content;
  }
});
