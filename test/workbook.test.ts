import { describe, expect, test } from "@jest/globals";

import Excel from "exceljs";

import OCX from "../src";
import ExcelJSWriter from "../src/workbook/exceljs-writer";

describe("workbook", () => {
  const fakeModel = {
    asOfDate: new Date("2022-07-14"),
  };

  test("worksheets", () => {
    const excel = new Excel.Workbook();
    new OCX.Workbook(new ExcelJSWriter(excel), fakeModel);

    expect(excel.worksheets[0].name).toBe("Summary Snapshot");
    expect(excel.worksheets[1].name).toBe("Detailed Snapshot");
    expect(excel.worksheets[2].name).toBe("Voting by SH Group");
    expect(excel.worksheets[3].name).toBe("Context");
  });

  describe("Context sheet", () => {
    const excel = new Excel.Workbook();
    new OCX.Workbook(new ExcelJSWriter(excel), fakeModel);

    expect(excel.worksheets[3].getCell("A1").value).toEqual(fakeModel.asOfDate);
  });
});
