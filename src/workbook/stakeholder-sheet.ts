import { Model, WorksheetLinePrinter } from "./interfaces";

import { Borders, Fill, Font } from "exceljs";

class StakeholderSheet {
  constructor(
    private readonly worksheet: WorksheetLinePrinter,
    private readonly model: Model
  ) {
    worksheet.nextRow({ height: 59.5 });

    worksheet
      .createRange("details.header", {
        fill: this.headerFill,
        font: this.headerFont,
        border: this.headerBorder,
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

  // TODO: the below is shameless copy paste from Workbook
  private get headerFill(): Fill {
    return {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2a39c4" },
    };
  }

  private get headerFont(): Partial<Font> {
    return {
      name: "Calibri",
      bold: true,
      color: { argb: "ffffff" },
      size: 10,
    };
  }

  private get headerBorder(): Partial<Borders> {
    return {
      top: { style: "thin" },
      bottom: { style: "double" },
    };
  }
}

export default StakeholderSheet;
