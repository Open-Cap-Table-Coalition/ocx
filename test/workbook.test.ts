import { describe, expect, test } from "@jest/globals";

import Excel from "exceljs";

import OCX from "../src";

describe("workbook", () => {
  test("worksheets", () => {
    const excel = new Excel.Workbook();

    /* eslint-disable-next-line no-unused-vars --
     * This is disabled here because the constructor is doing the
     * work that we are testing.
     **/
    const workbook = new OCX.Workbook(excel); // eslint-disable-line

    expect(excel.worksheets[0].name).toBe("Summary Snapshot");
    expect(excel.worksheets[1].name).toBe("Detailed Snapshot");
    expect(excel.worksheets[2].name).toBe("Voting by SH Group");
    expect(excel.worksheets[3].name).toBe("Context");
  });
});
