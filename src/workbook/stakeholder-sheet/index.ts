import { Model, StockClassModel, WorksheetLinePrinter } from "../interfaces";
import WorksheetRangePrinter from "../worksheet-range-printer";

import { CapitalizationByStakeholderHeader } from "./headers";
import * as Holdings from "./holdings-columns";
import { ExtentsCollection } from "../extents";

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

    const holdingsTable = this.sheet.createNestedRange({
      orientation: "left-to-right",
    });
    new Holdings.StakeholderColumn(holdingsTable).write(
      this.model.stakeholders
    );
    new Holdings.StakeholderGroupColumn(holdingsTable).write(
      this.model.stakeholders
    );

    const outstandingRanges = new Array<WorksheetRangePrinter>();
    const asConvertedRanges = new ExtentsCollection();
    for (let idx = 0; idx < this.stockClasses.length; ++idx) {
      const stockClass = this.stockClasses[idx];
      const outstandingRange = new Holdings.StockClassOutstandingColumn(
        holdingsTable
      ).write(stockClass, this.model);
      outstandingRanges.push(outstandingRange);

      if (stockClass.is_preferred && stockClass.conversion_ratio !== 1.0) {
        asConvertedRanges.push(
          new Holdings.StockClassAsConvertedColumn(holdingsTable)
            .write(stockClass, outstandingRange)
            .getExtents()
        );
      } else {
        asConvertedRanges.push(outstandingRange.getExtents());
      }
    }

    for (const plan of this.stockPlans) {
      new Holdings.StockPlanColumn(holdingsTable).write(plan);
    }

    new Holdings.TotalOutstanding(holdingsTable).write(outstandingRanges);
    new Holdings.TotalAsConverted(holdingsTable).write(asConvertedRanges);
  }

  private get stockClasses() {
    return this.model.stockClasses || [];
  }

  private get stockPlans() {
    return this.model.stockPlans || [];
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
