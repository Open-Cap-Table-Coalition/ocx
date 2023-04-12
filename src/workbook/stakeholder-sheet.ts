import { Model, WorksheetLinePrinter } from "./interfaces";
import WorksheetRangePrinter from "./worksheet-range-printer";
import Styles from "./styles";

class StakeholderSheet {
  constructor(
    private readonly worksheet: WorksheetLinePrinter,
    private readonly model: Model
  ) {
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

    const holdingsTable = sheet.createNestedRange("top-to-bottom");

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

    const holdingsData = holdingsTable.createNestedRange("left-to-right");

    const stakeholders = holdingsData.createNestedRange("top-to-bottom");
    stakeholders.setStyle(Styles.default);

    for (const stakeholder of model.stakeholders || []) {
      stakeholders.addCell(stakeholder.display_name);
    }

    stakeholders.addCell("Total", Styles.subheader);
    stakeholders.break().break();

    for (const stockClass of model.stockClasses || []) {
      const data = holdingsData.createNestedRange("top-to-bottom");

      for (const stakeholder of model.stakeholders || []) {
        if (model.getStakeholderStockHoldings) {
          const holdings = model.getStakeholderStockHoldings(
            stakeholder,
            stockClass
          );
          data.addCell(holdings);
        }
      }

      data.addSum();

      if (stockClass.is_preferred && stockClass.conversion_ratio !== 1.0) {
        const formulas = holdingsData.createNestedRange("top-to-bottom");
        const tl = worksheet.getAddress(
          data.getExtents().topLeft.row,
          data.getExtents().topLeft.col
        );
        formulas.addRepeatedFormulaCell(
          `ROUND(${tl} * ${stockClass.conversion_ratio}, 0)`,
          model.stakeholders.length
        );

        formulas.addSum();
      }
    }
  }
}

export default StakeholderSheet;
