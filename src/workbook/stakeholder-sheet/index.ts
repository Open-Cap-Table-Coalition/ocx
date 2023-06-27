import {
  Model,
  StockClassModel,
  StockPlanModel,
  WorksheetLinePrinter,
} from "../interfaces";
import WorksheetRangePrinter from "../worksheet-range-printer";

import { CapitalizationByStakeholderHeader, NotesHeader } from "./headers";
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
    this.addHorizontalSeparator();
    this.createNotesTable();
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
    const fullyDilutedRanges = new ExtentsCollection();
    for (let idx = 0; idx < this.stockClasses.length; ++idx) {
      const stockClass = this.stockClasses[idx];
      const outstandingRange = new Holdings.StockClassOutstandingColumn(
        holdingsTable
      ).write(stockClass, this.model);
      outstandingRanges.push(outstandingRange);
      const ratio = this.model.getStockClassConversionRatio
        ? this.model.getStockClassConversionRatio(stockClass)
        : 1.0;
      if (
        !stockClass.is_preferred ||
        (stockClass.is_preferred && ratio === 1.0)
      ) {
        fullyDilutedRanges.push(outstandingRange.getExtents());
      }

      if (stockClass.is_preferred && ratio !== 1.0) {
        const convertedRange = new Holdings.StockClassAsConvertedColumn(
          holdingsTable
        ).write(stockClass, outstandingRange, this.model);
        asConvertedRanges.push(convertedRange.getExtents());
        fullyDilutedRanges.push(convertedRange.getExtents());
      } else {
        asConvertedRanges.push(outstandingRange.getExtents());
      }
    }

    for (const plan of this.stockPlans) {
      const stockPlanRange = new Holdings.StockPlanColumn(holdingsTable).write(
        plan,
        this.model
      );
      fullyDilutedRanges.push(stockPlanRange.getExtents());
    }

    const warrantStockClasses = [];
    for (const id of this.warrantStockIds) {
      const stockClass = this.stockClasses.find(
        (stockClass) => stockClass.id === id
      );
      if (stockClass !== undefined) {
        warrantStockClasses.push(stockClass);
      }
    }
    for (const stockClass of warrantStockClasses) {
      const warrantRange = new Holdings.WarrantColumn(holdingsTable).write(
        stockClass,
        this.model
      );
      fullyDilutedRanges.push(warrantRange.getExtents());
    }

    const nonPlanStockClasses = [];
    for (const id of this.nonPlanStockIds) {
      const stockClass = this.stockClasses.find(
        (stockClass) => stockClass.id === id
      );
      if (stockClass !== undefined) {
        nonPlanStockClasses.push(stockClass);
      }
    }
    for (const stockClass of nonPlanStockClasses) {
      const nonPlanRange = new Holdings.NonPlanColumn(holdingsTable).write(
        stockClass,
        this.model
      );
      fullyDilutedRanges.push(nonPlanRange.getExtents());
    }

    new Holdings.TotalOutstanding(holdingsTable).write(outstandingRanges);
    new Holdings.TotalAsConverted(holdingsTable).write(asConvertedRanges);
    new Holdings.FullyDilutedShares(holdingsTable).write(fullyDilutedRanges);
  }

  private addHorizontalSeparator() {
    this.sheet
      .createNestedRange({
        orientation: "left-to-right",
      })
      .addBlankCell();
  }

  private createNotesTable() {
    new NotesHeader(this.sheet).write();
    const holdingsTable = this.sheet.createNestedRange({
      orientation: "top-to-bottom",
    });
    const notesObj = { value: 1 };
    new Holdings.OutstandingNotes(holdingsTable).write(notesObj);
    new Holdings.FDNotes(holdingsTable).write(notesObj);
    for (const id of this.warrantStockIds) {
      const source =
        this.warrantsSources instanceof Map
          ? this.warrantsSources.get(id)
          : "UNSPECIFIED";
      new Holdings.WarrantsNotes(holdingsTable).write(source, notesObj);
    }
    notesObj.value += 1;
  }

  private get stockClasses() {
    return this.model.stockClasses || [];
  }

  private get stockPlans() {
    return this.model.stockPlans || [];
  }

  private get warrantStockIds() {
    return this.model.warrantStockIds || [];
  }

  private get nonPlanStockIds() {
    return this.model.nonPlanStockIds || [];
  }

  private get warrantsSources() {
    return this.model.warrantsSources || [];
  }

  private stockColumns() {
    const result = [];

    for (const stockClass of this.model.stockClasses || []) {
      result.push({
        heading: this.outstandingStockClassHeadingFor(stockClass),
        stockClass,
      });
      const ratio = this.model.getStockClassConversionRatio
        ? this.model.getStockClassConversionRatio(stockClass)
        : 1.0;
      if (stockClass.is_preferred && ratio !== 1.0) {
        result.push({
          heading: this.asConvertedStockClassHeadingFor(stockClass),
          stockClass,
        });
      }
    }

    for (const plan of this.stockPlans) {
      result.push({
        heading: this.stockPlanHeadingFor(plan),
        stockClass: plan,
      });
    }

    for (const id of this.warrantStockIds) {
      const stockClass = this.stockClasses.find(
        (stockClass) => stockClass.id === id
      );
      if (stockClass !== undefined) {
        result.push({
          heading: this.warrantHeadingFor(stockClass),
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

  private stockPlanHeadingFor(stockPlan: StockPlanModel) {
    return `${stockPlan.plan_name}`;
  }

  private warrantHeadingFor(stockClass: StockClassModel) {
    return `${stockClass.display_name} Warrants`;
  }
}

export default StakeholderSheet;
