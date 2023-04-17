import { Model, WorksheetLinePrinter } from "../interfaces";
import WorksheetRangePrinter from "../worksheet-range-printer";

import Styles from "../styles";

class SummarySheet {
  private sheet: WorksheetRangePrinter;

  constructor(
    private readonly worksheet: WorksheetLinePrinter,
    private readonly model: Model
  ) {
    this.sheet = WorksheetRangePrinter.create(worksheet, "top-to-bottom");

    const summary = this.sheet.createNestedRange({
      orientation: "left-to-right",
      style: Styles.header,
      rowHeight: 59.5,
    });

    summary
      .addFormulaCell("Context!A1", Styles.header__date)
      .addBlankCell()
      .addCell(
        `${this.model.issuerName} Summary Capitalization`,
        Styles.header__title
      )
      .addBlankCells(3);
  }
}

export default SummarySheet;
