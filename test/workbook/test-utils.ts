import Excel from "exceljs";
import ExcelJSWriter from "src/workbook/exceljs-writer";
import WorksheetRangePrinter from "src/workbook/worksheet-range-printer";

import * as Extents from "src/workbook/extents";

export function prepareTestWorksheet() {
  const excel = new Excel.Workbook();
  const workbookWriter = new ExcelJSWriter(excel);
  const worksheetWriter = workbookWriter.addWorksheet("test");
  const cell = (address: string) => excel.worksheets[0].getCell(address);
  const parentRange = WorksheetRangePrinter.create(
    worksheetWriter,
    "left-to-right"
  );

  const makeExtents = (...addressRanges: string[]) => {
    const result = [];
    for (const address of addressRanges) {
      // Disabling prefer-const below because it feel clearer to capture
      // the const and non-const parts of the "split" address in a single
      // statement.
      // eslint-disable-next-line prefer-const
      let [topLeftAddr, btmRightAddr] = address.split(":", 2);
      if (!btmRightAddr) {
        btmRightAddr = topLeftAddr;
      }

      const topLeft = Extents.ExcelUtils.addressToCursor(topLeftAddr);
      const btmRight = Extents.ExcelUtils.addressToCursor(btmRightAddr);

      result.push({ topLeft, btmRight });
    }
    return Extents.ExtentsCollection.buildFrom(result);
  };

  return {
    cell,
    parentRange,
    makeExtents,
  };
}
