import { Model, WorksheetLinePrinter } from "../interfaces";
import WorksheetRangePrinter from "../worksheet-range-printer";

import Styles from "../styles";

class ContextSheet {
  private sheet: WorksheetRangePrinter;

  constructor(
    private readonly worksheet: WorksheetLinePrinter,
    private readonly model: Model
  ) {
    this.sheet = WorksheetRangePrinter.create(worksheet, "top-to-bottom");

    const header = this.sheet.createNestedRange({
      orientation: "left-to-right",
      style: Styles.header,
      rowHeight: 59.5,
    });

    header
      .addCell(this.model.asOfDate, Styles.header__date)
      .addBlankCell()
      .addCell("Context", Styles.header__title)
      .addBlankCells(3);
  }
}

export default ContextSheet;
