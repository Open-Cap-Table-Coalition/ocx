import WorksheetRangePrinter from "../worksheet-range-printer";
import Styles from "../styles";

export class CapitalizationByStakeholderHeader {
  constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(issuerName: string, numberOfHoldingTypes: number) {
    const header = this.parent.createNestedRange("left-to-right", {
      style: Styles.header,
      height: 59.5,
    });
    header
      .addFormulaCell("Context!A1", Styles.header__date)
      .addBlankCell()
      .addCell(`${issuerName} Capitalization by Holder`, Styles.header__title)
      .addBlankCells(numberOfHoldingTypes - 1 + 5);
  }
}
