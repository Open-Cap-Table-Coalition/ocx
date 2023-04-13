import { Model, StockClassModel, WorksheetLinePrinter } from "../interfaces";
import WorksheetRangePrinter from "../worksheet-range-printer";
import Styles from "../styles";

import { CapitalizationByStakeholderHeader } from "./headers";

class StakeholderSheet {
  private sheet: WorksheetRangePrinter;

  constructor(
    private readonly worksheet: WorksheetLinePrinter,
    private readonly model: Model
  ) {
    this.sheet = WorksheetRangePrinter.create(worksheet, "top-to-bottom");
    this.createCapitalizationByStakeholderTable();
  }

  private createCapitalizationByStakeholderTable() {
    // top header
    const stockColumns = this.stockColumns();

    new CapitalizationByStakeholderHeader(this.sheet).write(
      this.model.issuerName,
      stockColumns.length
    );

    // stock class subheader
    const holdingsTable = this.sheet.createNestedRange("top-to-bottom");
    const holdingsHeadings = holdingsTable.createNestedRange("left-to-right");
    holdingsHeadings.setStyle(Styles.subheader);
    holdingsHeadings.addCell("Stakeholder").addCell("Stakeholder Group");

    for (const stockColumn of stockColumns) {
      holdingsHeadings.addCell(stockColumn.heading);
    }

    const holdingsData = holdingsTable.createNestedRange("left-to-right");
    const stakeholders = holdingsData.createNestedRange("top-to-bottom");

    // stakeholder names
    stakeholders.setStyle(Styles.default);
    for (const stakeholder of this.model.stakeholders || []) {
      stakeholders.addCell(stakeholder.display_name);
    }
    stakeholders.addCell("Total", Styles.subheader);
    stakeholders.break();

    // stakeholder groups
    // TODO: Data validation
    stakeholders.addBlankCells(this.model.stakeholders?.length || 0);
    stakeholders.addBlankCell(Styles.subheader);
    stakeholders.break();

    // holdings data / formulas
    for (const stockClass of this.model.stockClasses || []) {
      const data = holdingsData.createNestedRange("top-to-bottom");

      for (const stakeholder of this.model.stakeholders || []) {
        if (this.model.getStakeholderStockHoldings) {
          const holdings = this.model.getStakeholderStockHoldings(
            stakeholder,
            stockClass
          );
          data.addCell(holdings);
        }
      }

      data.addSum(Styles.subheader);

      if (stockClass.is_preferred && stockClass.conversion_ratio !== 1.0) {
        const formulas = holdingsData.createNestedRange("top-to-bottom");
        const tl = this.worksheet.getAddress(
          data.getExtents().topLeft.row,
          data.getExtents().topLeft.col
        );
        formulas.addRepeatedFormulaCell(
          `ROUND(${tl} * ${stockClass.conversion_ratio}, 0)`,
          this.model.stakeholders.length
        );

        formulas.addSum(Styles.subheader);
      }
    }
  }

  private stockColumns() {
    const result = [];

    for (const stockClass of this.model.stockClasses || []) {
      result.push({
        heading: this.outstandingStockClassHeadingFor(stockClass),
        stockClass,
      });

      if (stockClass.is_preferred && stockClass.conversion_ratio !== 1.0) {
        result.push({
          heading: this.asConvertedStockClassHeadingFor(stockClass),
          stockClass,
        });
      }
    }

    return result;
  }

  private outstandingStockClassHeadingFor(stockClass: StockClassModel) {
    let suffix = "";
    if (stockClass.is_preferred) {
      const ratioToFourPlaces = stockClass.conversion_ratio?.toFixed(4);
      suffix = `\n(outstanding) (${ratioToFourPlaces})`;
    }

    return `${stockClass.display_name}${suffix}`;
  }

  private asConvertedStockClassHeadingFor(stockClass: StockClassModel) {
    return `${stockClass.display_name}\n(as converted)`;
  }
}

export default StakeholderSheet;
