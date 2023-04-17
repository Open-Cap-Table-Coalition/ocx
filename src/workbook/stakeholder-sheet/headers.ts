import WorksheetRangePrinter from "../worksheet-range-printer";
import Styles from "../styles";

export class CapitalizationByStakeholderHeader {
  constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(issuerName: string, numberOfHoldingTypes: number) {
    const header = this.parent.createNestedRange({
      orientation: "left-to-right",
      style: Styles.header,
      rowHeight: 59.5,
    });
    header
      .addFormulaCell("Context!A1", Styles.header__date)
      .addBlankCell()
      .addCell(
        `${issuerName} Capitalization by Stakeholder`,
        Styles.header__title
      )
      .addBlankCells(numberOfHoldingTypes - 1 + 5);
  }
}
