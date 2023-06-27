import WorksheetRangePrinter from "../worksheet-range-printer";
import {
  Model,
  StockClassModel,
  StockPlanModel,
  StakeholderModel,
} from "../interfaces";
import Styles from "../styles";
import { ExtentsCollection } from "../extents";

export class StakeholderColumn {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(stakeholders: Array<StakeholderModel>) {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });

    myColumn
      .createNestedRange({
        style: Styles.subheader,
        rowHeight: 40.0,
      })
      .addCell("Stakeholder");

    const myData = myColumn.createNestedRange({
      style: Styles.default,
    });

    let longestStakeholderNameLen = "Stakeholder".length;
    stakeholders.forEach((s) => {
      myData.addCell(s.display_name);
      if (s.display_name.length > longestStakeholderNameLen) {
        longestStakeholderNameLen = s.display_name.length;
      }
    });

    myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell("Options Remaining for Issuance")
      .addBlankCell(Styles.default)
      .addCell("Total", Styles.footer);

    myColumn.setWidth(longestStakeholderNameLen);
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new StakeholderColumn(parent);
  }
}

export class StakeholderGroupColumn {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(stakeholders: Array<StakeholderModel>) {
    this.parent
      .createNestedRange({ orientation: "top-to-bottom" })
      .addCell("Stakeholder Group", Styles.subheader)
      .addBlankCells(stakeholders.length, Styles.default)
      .addBlankCell(Styles.default)
      .addBlankCell(Styles.default)
      .addBlankCell(Styles.default)
      .addBlankCell(Styles.footer)
      .setWidth("Stakeholder Group".length);
  }
}

export class StockClassOutstandingColumn {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(
    stockClass: StockClassModel,
    model: Model
  ): WorksheetRangePrinter {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });

    myColumn
      .createNestedRange({
        style: Styles.subheader,
        rowHeight: 50.0,
      })
      .addCell(this.outstandingStockClassHeadingFor(stockClass, model));

    const myData = myColumn.createNestedRange({
      style: Styles.default,
    });

    let largestHolding = 0;

    model.stakeholders.forEach((s) => {
      const holding = model.getStakeholderStockHoldings
        ? model.getStakeholderStockHoldings(s, stockClass)
        : 0;
      myData.addCell(holding);
      if (holding > largestHolding) {
        largestHolding = holding;
      }
    });

    myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell(0, Styles.default)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer);

    myColumn.setWidth(
      Math.max(
        14,
        (largestHolding * model.stakeholders.length).toString().length
      )
    );
    return myData;
  }

  private outstandingStockClassHeadingFor(
    stockClass: StockClassModel,
    model: Model
  ) {
    let suffix = "";
    if (stockClass.is_preferred) {
      const ratio = model.getStockClassConversionRatio
        ? model.getStockClassConversionRatio(stockClass)
        : 1;
      const ratioToFourPlaces = ratio.toFixed(4);
      suffix = `\n(outstanding) (${
        ratio !== Number(ratioToFourPlaces) ? "~" : ""
      }${ratioToFourPlaces})`;
    }

    return `${stockClass.display_name}${suffix}`;
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new StockClassOutstandingColumn(parent);
  }
}

export class StockClassAsConvertedColumn {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(
    stockClass: StockClassModel,
    outstandingRange: WorksheetRangePrinter,
    model: Model
  ) {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });

    myColumn
      .createNestedRange({
        style: Styles.subheader,
        rowHeight: 50.0,
      })
      .addCell(this.asConvertedStockClassHeadingFor(stockClass));

    const myData = myColumn.createNestedRange({
      style: Styles.default,
    });

    const ratio = model.getStockClassConversionRatio
      ? model.getStockClassConversionRatio(stockClass)
      : 1;

    const conversion_value = `${
      outstandingRange.getExtents().topLeftAddress
    } * ${ratio}`;

    const formula = this.getRoundingFormula(stockClass, conversion_value);

    myData.addRepeatedFormulaCell(
      formula,
      outstandingRange.getExtents().height
    );

    myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell(0, Styles.default)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer);

    myColumn.setWidth(15);
    return myData;
  }

  private asConvertedStockClassHeadingFor(stockClass: StockClassModel) {
    return `${stockClass.display_name}\n(as converted)`;
  }

  private getRoundingFormula(
    stockClass: StockClassModel,
    conversion_value: string
  ): string {
    switch (stockClass.rounding_type) {
      case "CEILING":
        return `CEILING(${conversion_value}, 1)`;
        break;
      case "FLOOR":
        return `FLOOR(${conversion_value}, 1)`;
        break;
      case "NORMAL":
      default:
        return `ROUND(${conversion_value}, 0)`;
        break;
    }
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new StockClassAsConvertedColumn(parent);
  }
}

export class StockPlanColumn {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(stockPlan: StockPlanModel, model: Model): WorksheetRangePrinter {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });

    myColumn
      .createNestedRange({
        style: Styles.subheader,
        rowHeight: 50.0,
      })
      .addCell(this.stockPlanHeadingFor(stockPlan));

    const myData = myColumn.createNestedRange({
      style: Styles.default,
    });

    let largestHolding = 0;
    model.stakeholders.forEach((s) => {
      const holding = model.getStakeholderStockPlanHoldings
        ? model.getStakeholderStockPlanHoldings(s, stockPlan)
        : 0;
      myData.addCell(holding);
      if (holding > largestHolding) {
        largestHolding = holding;
      }
    });

    const options_remaining = model.getOptionsRemainingForIssuance
      ? model.getOptionsRemainingForIssuance(stockPlan)
      : 0;

    myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell(options_remaining)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer);

    myColumn.setWidth(
      Math.max(
        14,
        (largestHolding * model.stakeholders.length).toString().length
      )
    );

    return myData;
  }

  private stockPlanHeadingFor(stockPlan: StockPlanModel) {
    return `${stockPlan.plan_name}`;
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new StockPlanColumn(parent);
  }
}

export class WarrantColumn {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(
    stockClass: StockClassModel,
    model: Model
  ): WorksheetRangePrinter {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });
    let targetClass = stockClass;

    // if class is preferred
    // get target common class
    if (stockClass.is_preferred) {
      targetClass = model.getConversionCommonStockClass
        ? model.getConversionCommonStockClass(stockClass)
        : stockClass;
    }

    myColumn
      .createNestedRange({
        style: Styles.subheader,
        rowHeight: 50.0,
      })
      .addCell(this.warrantHeadingFor(targetClass));

    const myData = myColumn.createNestedRange({
      style: Styles.default,
    });

    let largestHolding = 0;
    model.stakeholders.forEach((s) => {
      const holding = model.getStakeholderWarrantHoldings
        ? model.getStakeholderWarrantHoldings(s, stockClass)
        : 0;
      myData.addCell(holding);
      if (holding > largestHolding) {
        largestHolding = holding;
      }
    });

    myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell(0, Styles.default)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer);

    myColumn.setWidth(
      Math.max(
        14,
        (largestHolding * model.stakeholders.length).toString().length
      )
    );

    return myData;
  }

  private warrantHeadingFor(stockClass: StockClassModel) {
    return `${stockClass.display_name} Warrants`;
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new WarrantColumn(parent);
  }
}

export class NonPlanColumn {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(
    stockClass: StockClassModel,
    model: Model
  ): WorksheetRangePrinter {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });
    let targetClass = stockClass;

    // if class is preferred
    // get target common class
    if (stockClass.is_preferred) {
      targetClass = model.getConversionCommonStockClass
        ? model.getConversionCommonStockClass(stockClass)
        : stockClass;
    }

    myColumn
      .createNestedRange({
        style: Styles.subheader,
        rowHeight: 50.0,
      })
      .addCell(this.nonPlanHeadingFor(targetClass));

    const myData = myColumn.createNestedRange({
      style: Styles.default,
    });

    let largestHolding = 0;
    model.stakeholders.forEach((s) => {
      const holding = model.getStakeholderNonPlanHoldings
        ? model.getStakeholderNonPlanHoldings(s, stockClass)
        : 0;
      myData.addCell(holding);
      if (holding > largestHolding) {
        largestHolding = holding;
      }
    });

    myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell(0, Styles.default)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer);

    myColumn.setWidth(
      Math.max(
        14,
        (largestHolding * model.stakeholders.length).toString().length
      )
    );

    return myData;
  }

  private nonPlanHeadingFor(stockClass: StockClassModel) {
    return `${stockClass.display_name} Non-Plan Awards`;
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new NonPlanColumn(parent);
  }
}

export class TotalOutstanding {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(outstandingRanges: Array<WorksheetRangePrinter>) {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });

    myColumn
      .createNestedRange({
        style: Styles.withLeftHandBorder(Styles.subheader),
      })
      .addCell("Total Stock\n(outstanding)*");

    const myData = myColumn.createNestedRange({
      style: Styles.withLeftHandBorder(Styles.default),
    });

    const cellsToSum = outstandingRanges
      .map((o) => o.getExtents().topLeftAddress)
      .join(",");
    const height = Math.max(
      ...outstandingRanges.map((o) => o.getExtents().height)
    );
    myData.addRepeatedFormulaCell(`SUM(${cellsToSum})`, height);

    myColumn
      .createNestedRange()
      .addBlankCell(Styles.withLeftHandBorder(Styles.default))
      .addCell(0, Styles.withLeftHandBorder(Styles.default))
      .addBlankCell(Styles.withLeftHandBorder(Styles.default))
      .addSumFor(myData, Styles.withLeftHandBorder(Styles.footer));

    myColumn.setWidth(15);
    return myData;
  }
}

export class TotalAsConverted {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(sourceRanges: ExtentsCollection) {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });

    myColumn
      .createNestedRange({
        style: Styles.subheader,
      })
      .addCell("Total Stock\n(as converted)");

    const myData = myColumn.createNestedRange({
      style: Styles.default,
    });

    const cellsToSum = sourceRanges.map((o) => o.topLeftAddress).join(",");
    myData.addRepeatedFormulaCell(`SUM(${cellsToSum})`, sourceRanges.height);

    const myTotal = myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell(0, Styles.default)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer);

    myColumn.setWidth(15);
    myColumn.break();
    this.writePercentagesCalculatedFrom(
      myData,
      myTotal.getExtents().btmRightAddress
    );
    return myData;
  }

  private writePercentagesCalculatedFrom(
    data: WorksheetRangePrinter,
    totalAddress: string
  ) {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });

    myColumn
      .createNestedRange({
        style: Styles.subheader,
      })
      .addCell("Total Stock %\n(as converted)");

    const myData = myColumn.createNestedRange({
      style: Styles.default__percentage,
    });

    const totalAbsoluteAddress = totalAddress.replace(/(\D+)(\d+)/, "$$$1$$$2");
    const formula = `${
      data.getExtents().topLeftAddress
    } / ${totalAbsoluteAddress}`;
    myData.addRepeatedFormulaCell(formula, data.getExtents().height);

    myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell(0, Styles.default)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer__percentage);

    myColumn.setWidth(15);
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new TotalAsConverted(parent);
  }
}

export class FullyDilutedShares {
  public constructor(private readonly parent: WorksheetRangePrinter) {}
  public write(fullyDilutedRanges: ExtentsCollection) {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });

    myColumn
      .createNestedRange({
        style: Styles.subheader,
      })
      .addCell("Fully Diluted Shares**");

    const myData = myColumn.createNestedRange({
      style: Styles.default,
    });

    const cellsToSum = fullyDilutedRanges
      .map((o) => o.topLeftAddress)
      .join(",");
    myData.addRepeatedFormulaCell(
      `SUM(${cellsToSum})`,
      fullyDilutedRanges.height
    );

    const myTotal = myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell(0, Styles.default)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer);

    myColumn.setWidth(15);
    myColumn.break();
    this.writePercentagesCalculatedFrom(
      myData,
      myTotal.getExtents().btmRightAddress
    );
    return myData;
  }

  private writePercentagesCalculatedFrom(
    data: WorksheetRangePrinter,
    totalAddress: string
  ) {
    const myColumn = this.parent.createNestedRange({
      orientation: "top-to-bottom",
    });

    myColumn
      .createNestedRange({
        style: Styles.subheader,
      })
      .addCell("Fully Diluted %");

    const myData = myColumn.createNestedRange({
      style: Styles.default__percentage,
    });

    const totalAbsoluteAddress = totalAddress.replace(/(\D+)(\d+)/, "$$$1$$$2");
    const formula = `${
      data.getExtents().topLeftAddress
    } / ${totalAbsoluteAddress}`;
    myData.addRepeatedFormulaCell(formula, data.getExtents().height);

    myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell(0, Styles.default)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer__percentage);

    myColumn.setWidth(15);
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new FullyDilutedShares(parent);
  }
}

export class OutstandingNotes {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(notesObj: { value: number }) {
    const myColumn = this.parent.createNestedRange({
      orientation: "left-to-right",
      rowHeight: 28,
    });

    const notes = "*".repeat(notesObj.value);
    const content = `${notes} Outstanding Shares include all shares of capital stock that are issued and outstanding, but DO NOT include (1) shares of capital stock underlying outstanding warrants and stock options, (2) shares under Stock Plans remaining for issuance or (3) conversion shares for Outstanding Convertible Securities such as convertible notes or SAFEs.`;
    notesObj.value += 1;
    myColumn.addCell(content, {
      ...Styles.text,
      alignment: { vertical: "middle", horizontal: "left", wrapText: true },
    });

    const startColumn = myColumn.getExtents().topLeft.col;
    const endColumn = myColumn.getExtents().btmRight.col + 9;
    const row = myColumn.getCurrentRow();

    myColumn.mergeCells(row, startColumn, row, endColumn);

    myColumn.break();
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new OutstandingNotes(parent);
  }
}

export class FDNotes {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(notesObj: { value: number }) {
    const myColumn = this.parent.createNestedRange({
      orientation: "left-to-right",
      rowHeight: 28,
    });

    const notes = "*".repeat(notesObj.value);
    const content = `${notes} Fully Diluted Shares and % Fully Diluted include (1) Outstanding Shares (as converted to Common Stock), (2) shares of capital stock underlying outstanding warrants and stock options, (3) shares under Stock Plans remaining for issuance, but DO NOT include conversion shares for Outstanding Convertible Securities such as convertible notes or SAFEs.`;
    notesObj.value += 1;
    myColumn.addCell(content, {
      ...Styles.text,
      alignment: { vertical: "middle", horizontal: "left", wrapText: true },
    });
    const startColumn = myColumn.getExtents().topLeft.col;
    const endColumn = myColumn.getExtents().btmRight.col + 9;
    const row = myColumn.getCurrentRow();

    myColumn.mergeCells(row, startColumn, row, endColumn);
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new FDNotes(parent);
  }
}

export class WarrantsNotes {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(source: string | undefined, notesObj: { value: number }) {
    const myColumn = this.parent.createNestedRange({
      orientation: "left-to-right",
    });
    const notes = "*".repeat(notesObj.value);
    const content = `${notes} {Notes re: warrant from vendor} ${this.getNotes(
      source
    )}`;
    myColumn.addCell(content, {
      ...Styles.text,
      alignment: { vertical: "middle", horizontal: "left", wrapText: true },
    });
    const startColumn = myColumn.getExtents().topLeft.col;
    const endColumn = myColumn.getExtents().btmRight.col + 9;
    const row = myColumn.getCurrentRow();

    myColumn.mergeCells(row, startColumn, row, endColumn);
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new WarrantsNotes(parent);
  }

  private getNotes(source: string | undefined) {
    switch (source) {
      case "HUMAN_ESTIMATED":
        return "Reflects the human estimated amount of an adjustable warrant.";
        break;
      case "MACHINE_ESTIMATED":
        return "Reflects the machine estimated amount of an adjustable warrant.";
      case "INSTRUMENT_FIXED":
        return "Reflects the fixed amount of a warrant.";
      case "INSTRUMENT_MAX":
        return "Reflects the maximum amount of an adjustable warrant.";
      case "INSTRUMENT_MIN":
        return "Reflects the minimum amount of an adjustable warrant.";
      default:
        return "There is no specified source for the amount of this warrant";
        break;
    }
  }
}

export class HorizontalSeparator {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write() {
    const myColumn = this.parent.createNestedRange({
      orientation: "left-to-right",
    });

    myColumn
      .createNestedRange({
        style: Styles.subheader,
        rowHeight: 40.0,
      })
      .addBlankCell(Styles.default);
    // myColumn.setWidth(longestStakeholderNameLen);
  }
}
