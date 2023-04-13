import { Model, StockClassModel, WorksheetLinePrinter } from "../interfaces";
import WorksheetRangePrinter from "../worksheet-range-printer";

import { CapitalizationByStakeholderHeader } from "./headers";
import * as Holdings from "./holdings-columns";

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

    const holdingsTable = this.sheet.createNestedRange("left-to-right");
    new Holdings.StakeholderColumn(holdingsTable).write(
      this.model.stakeholders
    );
    new Holdings.StakeholderGroupColumn(holdingsTable).write(
      this.model.stakeholders
    );

    for (let idx = 0; idx < this.stockClasses.length; ++idx) {
      const stockClass = this.stockClasses[idx];
      const outstandingRange = new Holdings.StockClassOutstandingColumn(
        holdingsTable
      ).write(stockClass, this.model);

      if (stockClass.is_preferred && stockClass.conversion_ratio !== 1.0) {
        new Holdings.StockClassAsConvertedColumn(holdingsTable).write(
          stockClass,
          outstandingRange
        );
      }
    }
  }

  private get stockClasses() {
    return this.model.stockClasses || [];
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
