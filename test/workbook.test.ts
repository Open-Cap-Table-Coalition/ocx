import { describe, expect, test } from "@jest/globals";

import Excel from "exceljs";

import OCX from "../src";
import ExcelJSWriter from "../src/workbook/exceljs-writer";
import ApprovalTestHelper from "./helpers/approval-tests-helper";

describe("workbook", () => {
  const fakeModel = {
    asOfDate: new Date("2022-07-14"),
    issuerName: "ACME Corp",
    stakeholders: [],
  };

  test("worksheets", () => {
    const excel = new Excel.Workbook();
    new OCX.Workbook(new ExcelJSWriter(excel), fakeModel);

    expect(excel.worksheets[0].name).toBe("Summary Snapshot");
    expect(excel.worksheets[1].name).toBe("Stakeholder Snapshot");
    expect(excel.worksheets[2].name).toBe("Voting by SH Group");
    expect(excel.worksheets[3].name).toBe("Context");
  });

  test("approval dummy tests", async () => {
    const excel = new Excel.Workbook();
    new OCX.Workbook(new ExcelJSWriter(excel), fakeModel);
    const helper = new ApprovalTestHelper();
    const differences = await helper.approveExcel("ExcelHeaderTest", excel);

    expect(differences.length).toEqual(0);
  });

  describe("Summary snapshot sheet", () => {
    const excel = new Excel.Workbook();
    new OCX.Workbook(new ExcelJSWriter(excel), fakeModel);

    expect(excel.worksheets[0].getCell("A1").formula).toEqual("Context!A1");
    expect(excel.worksheets[0].getCell("C1").value).toBe(
      `${fakeModel.issuerName} Summary Capitalization`
    );
  });

  describe("Context sheet", () => {
    const excel = new Excel.Workbook();
    new OCX.Workbook(new ExcelJSWriter(excel), fakeModel);

    expect(excel.worksheets[3].getCell("A1").value).toEqual(fakeModel.asOfDate);
    expect(excel.worksheets[3].getCell("C1").value).toBe("Context");
  });
});
