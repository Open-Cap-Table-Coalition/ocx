import { Model, WorksheetLinePrinter } from "./interfaces";
import Styles from "./styles";

class StakeholderSheet {
  constructor(
    private readonly worksheet: WorksheetLinePrinter,
    private readonly model: Model
  ) {
    worksheet.nextRow({ height: 59.5 });

    worksheet
      .createRange("details.header", {
        fill: Styles.headerFill,
        font: Styles.headerFont,
        border: Styles.headerBorder,
      })
      .addFormulaCell("Context!A1", {
        alignment: { vertical: "bottom", horizontal: "right" },
        numFmt: "yyyy.mm.dd;@",
      })
      .addBlankCell()
      .addCell(`${this.model.issuerName} Capitalization by Holder`, {
        alignment: { vertical: "middle", horizontal: "left" },
      })
      .addBlankCells(3)
      .rangeComplete();
  }
}

export default StakeholderSheet;
