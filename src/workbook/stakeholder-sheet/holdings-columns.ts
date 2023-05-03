import WorksheetRangePrinter from "../worksheet-range-printer";
import {
  Model,
  StockClassModel,
  StockPlanModel,
  StakeholderModel,
} from "../interfaces";
import Styles from "../styles";
import { ExtentsCollection } from "../extents";
import Big from "big.js";

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
      .addCell(this.outstandingStockClassHeadingFor(stockClass));

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
      .addCell(0)
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

  private outstandingStockClassHeadingFor(stockClass: StockClassModel) {
    let suffix = "";
    if (stockClass.is_preferred) {
      const ratioToFourPlaces = stockClass.conversion_ratio?.toFixed(4);
      suffix = `\n(outstanding) (${ratioToFourPlaces})`;
    }

    return `${stockClass.display_name}${suffix}`;
  }
}

export class StockClassAsConvertedColumn {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(
    stockClass: StockClassModel,
    outstandingRange: WorksheetRangePrinter
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

    myData.addRepeatedFormulaCell(
      `ROUND(${outstandingRange.getExtents().topLeftAddress} * ${
        stockClass.conversion_ratio
      }, 0)`,
      outstandingRange.getExtents().height
    );

    myColumn
      .createNestedRange()
      .addBlankCell(Styles.default)
      .addCell(0)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer);

    myColumn.setWidth(15);
    return myData;
  }

  private asConvertedStockClassHeadingFor(stockClass: StockClassModel) {
    return `${stockClass.display_name}\n(as converted)`;
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
    let total_holdings = 0;
    model.stakeholders.forEach((s) => {
      const holding = model.getStakeholderStockPlanHoldings
        ? model.getStakeholderStockPlanHoldings(s, stockPlan)
        : 0;
      total_holdings += holding;
      myData.addCell(holding);
      if (holding > largestHolding) {
        largestHolding = holding;
      }
    });

    const initialSharesReserved =
      stockPlan.initial_shares_reserved !== undefined
        ? stockPlan.initial_shares_reserved
        : 0;
    const options_remaining =
      initialSharesReserved !== 0
        ? new Big(initialSharesReserved).toNumber() - total_holdings
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
      .addBlankCell(Styles.default)
      .addCell(0)
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
      .addCell(0)
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
      .addCell(0)
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer__percentage);

    myColumn.setWidth(15);
  }

  public static asChildOf(parent: WorksheetRangePrinter) {
    return new TotalAsConverted(parent);
  }
}
