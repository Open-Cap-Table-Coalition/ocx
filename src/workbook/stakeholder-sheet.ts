import { Model, WorksheetLinePrinter } from "./interfaces";
import WorksheetRangePrinter from "./worksheet-range-printer";
import Styles from "./styles";

class StakeholderSheet {
  constructor(
    private readonly worksheet: WorksheetLinePrinter,
    private readonly model: Model
  ) {
    const columnValues: number[][] = [];
    let row: number[] = [];

    const sheet = WorksheetRangePrinter.create(worksheet, "top-to-bottom");

    const header = sheet.createNestedRange("left-to-right");

    header.setStyle(Styles.header);

    header
      .addFormulaCell("Context!A1", Styles.header__date)
      .addBlankCell()
      .addCell(
        `${this.model.issuerName} Capitalization by Holder`,
        Styles.header__title
      )
      .addBlankCells(3);

    const holdingsTable = sheet.createNestedRange("left-to-right");

    const holdingsHeadings = holdingsTable.createNestedRange("left-to-right");
    holdingsHeadings.setStyle(Styles.subheader);

    holdingsHeadings.addCell("Stakeholder").addCell("Stakeholder Group");

    for (const stockClass of model.stockClasses || []) {
      if (!stockClass.is_preferred) {
        holdingsHeadings.addCell(stockClass.display_name);
      }
    }

    for (const stockClass of model.stockClasses || []) {
      if (stockClass.is_preferred) {
        const ratio = stockClass.conversion_ratio?.toFixed(4);
        holdingsHeadings.addCell(
          stockClass.display_name + " (outstanding) " + "(" + ratio + ")"
        );
        if (ratio && parseFloat(ratio) !== 1.0) {
          holdingsHeadings.addCell(stockClass.display_name + " (as converted)");
        }
      }
    }

    const writer = worksheet;
    writer.nextRow().nextRow().nextRow();

    for (const stakeholder of model.stakeholders || []) {
      writer.nextRow();
      writer
        .createRange(`stakeholder.holdings.${stakeholder}.id`, Styles.default)
        .addCell(stakeholder.display_name)
        .addBlankCell();

      for (const stockClass of model.stockClasses || []) {
        if (!stockClass.is_preferred && model.getStakeholderStockHoldings) {
          const holdings = model.getStakeholderStockHoldings(
            stakeholder,
            stockClass
          );
          writer.addCell(holdings);
          row.push(holdings);
        }
      }

      for (const stockClass of model.stockClasses || []) {
        if (stockClass.is_preferred && model.getStakeholderStockHoldings) {
          const holdings = model.getStakeholderStockHoldings(
            stakeholder,
            stockClass
          );
          writer.addCell(holdings);
          row.push(holdings);
          const ratio = stockClass.conversion_ratio?.toFixed(4);
          if (ratio && parseFloat(ratio) !== 1.0) {
            const convertedShares = holdings * parseFloat(ratio);
            writer.addCell(convertedShares);
            row.push(convertedShares);
          }
        }
      }

      columnValues.push(row);
      row = [];
    }

    worksheet.nextRow();

    const total = worksheet
      .createRange("stakeholders.totals")
      .createRange("subheader", {
        fill: Styles.subheaderFill,
        font: Styles.subheaderFont,
        border: Styles.headerBorder,
        alignment: { vertical: "bottom", horizontal: "right" },
        numFmt: '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)',
      })
      .addCell("Total")
      .addBlankCell();
    if (columnValues && columnValues.length > 0) {
      for (let i = 0; i < columnValues[0].length; i++) {
        let totalPerColumn = 0;
        for (let j = 0; j < columnValues.length; j++) {
          totalPerColumn += columnValues[j][i];
        }
        total.addCell(totalPerColumn);
      }
    }
  }
}

export default StakeholderSheet;
