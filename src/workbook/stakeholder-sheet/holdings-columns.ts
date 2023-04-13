import WorksheetRangePrinter from "../worksheet-range-printer";
import {
  Model,
  StockClassModel,
  StakeholderModel,
  WorksheetLinePrinter,
} from "../interfaces";
import Styles from "../styles";

export class StakeholderColumn {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(stakeholders: Array<StakeholderModel>) {
    const myColumn = this.parent.createNestedRange("top-to-bottom");

    myColumn
      .createNestedRange("top-to-bottom", {
        style: Styles.subheader,
        height: 40.0,
      })
      .addCell("Stakeholder");

    const myData = myColumn.createNestedRange("top-to-bottom", {
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
      .createNestedRange("top-to-bottom")
      .addBlankCell(Styles.default)
      .addCell("Total", Styles.footer);

    myColumn.setWidth(longestStakeholderNameLen);
  }
}

export class StakeholderGroupColumn {
  public constructor(private readonly parent: WorksheetRangePrinter) {}

  public write(stakeholders: Array<StakeholderModel>) {
    this.parent
      .createNestedRange("top-to-bottom")
      .addCell("Stakeholder Group", Styles.subheader)
      .addBlankCells(stakeholders.length, Styles.default)
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
    const myColumn = this.parent.createNestedRange("top-to-bottom");

    myColumn
      .createNestedRange("top-to-bottom", {
        style: Styles.subheader,
        height: 50.0,
      })
      .addCell(this.outstandingStockClassHeadingFor(stockClass));

    const myData = myColumn.createNestedRange("top-to-bottom", {
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
      .createNestedRange("top-to-bottom")
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
    outstandingRange: WorksheetRangePrinter,
    worksheet: WorksheetLinePrinter // this feels like an abstraction break, but for refactoring purposes OK for now
  ) {
    const myColumn = this.parent.createNestedRange("top-to-bottom");

    myColumn
      .createNestedRange("top-to-bottom", {
        style: Styles.subheader,
        height: 50.0,
      })
      .addCell(this.asConvertedStockClassHeadingFor(stockClass));

    const myData = myColumn.createNestedRange("top-to-bottom", {
      style: Styles.default,
    });

    const tl = worksheet.getAddress(
      outstandingRange.getExtents().topLeft.row,
      outstandingRange.getExtents().topLeft.col
    );

    myData.addRepeatedFormulaCell(
      `ROUND(${tl} * ${stockClass.conversion_ratio}, 0)`,
      outstandingRange.getExtents().height
    );

    myColumn
      .createNestedRange("top-to-bottom")
      .addBlankCell(Styles.default)
      .addSumFor(myData, Styles.footer);

    myColumn.setWidth(15);
    return myData;
  }

  private asConvertedStockClassHeadingFor(stockClass: StockClassModel) {
    return `${stockClass.display_name}\n(as converted)`;
  }
}
