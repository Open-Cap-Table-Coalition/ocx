import { WorksheetLinePrinter } from "../interfaces";
import WorksheetRangePrinter from "../worksheet-range-printer";

import Styles from "../styles";

class VotingDetailsSheet {
  private sheet: WorksheetRangePrinter;

  constructor(private readonly worksheet: WorksheetLinePrinter) {
    this.sheet = WorksheetRangePrinter.create(worksheet, "top-to-bottom");

    const header = this.sheet.createNestedRange({
      orientation: "left-to-right",
      style: Styles.header,
      rowHeight: 59.5,
    });

    header
      .addFormulaCell("Context!A1", Styles.header__date)
      .addBlankCell()
      .addCell("Voting Power by Shareholder Group", Styles.header__title)
      .addBlankCells(3);
  }
}

export default VotingDetailsSheet;
