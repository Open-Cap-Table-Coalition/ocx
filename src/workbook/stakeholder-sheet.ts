import { Model, WorksheetLinePrinter } from "./interfaces";
import Styles from "./styles";

class StakeholderSheet {
  constructor(
    private readonly worksheet: WorksheetLinePrinter,
    private readonly model: Model
  ) {
    worksheet.nextRow({ height: 59.5 });

    worksheet
      .createRange("stakeholders.header", {
        fill: Styles.headerFill,
        font: Styles.headerFont,
        border: Styles.headerBorder,
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

    worksheet.nextRow();

    // write the headers
    const writer = worksheet
      .createRange("stakeholders.holdings")
      .createRange("subheader", {
        fill: Styles.subheaderFill,
        font: Styles.subheaderFont,
        border: Styles.subheaderBorder,
        alignment: { vertical: "bottom", horizontal: "center" },
      })
      .addCell("Stakeholder")
      .addCell("Stakeholder Group");

    for (const stockClass of model.stockClasses || []) {
      if (!stockClass.is_preferred) {
        writer.addCell(stockClass.display_name);
        console.log(writer.currentAddress());
      }
    }

    for (const stockClass of model.stockClasses || []) {
      if (stockClass.is_preferred) {
        const ratio = stockClass.conversion_ratio?.toFixed(4);
        writer.addCell(
          stockClass.display_name + " (outstanding) " + "(" + ratio + ")"
        );
        if (ratio && parseFloat(ratio) !== 1.0) {
          writer.addCell(stockClass.display_name + " (as converted)");
        }
      }
    }

    // write column for stakeholders
    for (const stakeholder of model.stakeholders || []) {
      writer.nextRow();
      writer
        .createRange(`stakeholder.holdings.${stakeholder}.id`, Styles.default)
        .addCell(stakeholder.display_name)
        .addBlankCell();
    }

    // add total range
    writer.nextRow().nextRow();

    worksheet
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

    writer.nextColumn();

    // not preferred stock columns
    for (const stockClass of model.stockClasses || []) {
      if (!stockClass.is_preferred && model.getStakeholderStockHoldings) {
        const startAddress = writer.currentAddress();
        let endAddress = null;
        for (const stakeholder of model.stakeholders || []) {
          const holdings = model.getStakeholderStockHoldings(
            stakeholder,
            stockClass
          );
          writer.writeCell(holdings, Styles.default);
          endAddress = writer.currentAddress();
          writer.nextColumnCell();
          console.log(writer.currentAddress());
        }
        writer.writeFormulaCell(
          `=SUM(${startAddress}:${endAddress})`,
          Styles.default
        );
        writer.nextColumn();
      }
    }

    // This logic for preferred stocks (outstanding and converted) is a big mess
    // I couldn'ty have time to think about this properly.
    for (const stakeholder of model.stakeholders || []) {
      for (const stockClass of model.stockClasses || []) {
        if (stockClass.is_preferred && model.getStakeholderStockHoldings) {
          const startFirstColumnAddress = writer.currentAddress();
          let endFirstColumnAddress = null;
          let startSecondColumnAddress = null;
          let endSecondColumnAddress = null;
          const holdings = model.getStakeholderStockHoldings(
            stakeholder,
            stockClass
          );
          writer.writeCell(holdings);
          endFirstColumnAddress = writer.currentAddress();
          const ratio = stockClass.conversion_ratio?.toFixed(4);
          if (ratio && parseFloat(ratio) !== 1.0) {
            const convertedShares = holdings * parseFloat(ratio);
            writer.addCell(convertedShares);
            startSecondColumnAddress = !startSecondColumnAddress
              ? writer.currentAddress()
              : startSecondColumnAddress;
            endSecondColumnAddress = writer.currentAddress();
            writer.previousRowCell();
          }
          writer.nextColumnCell();
          writer.writeFormulaCell(
            `=SUM(${startFirstColumnAddress}:${endFirstColumnAddress})`,
            Styles.default
          );
          writer.addFormulaCell(
            `=SUM(${startSecondColumnAddress}:${endSecondColumnAddress})`,
            Styles.default
          );
          writer.nextColumn();
        }
      }
    }
  }
}

export default StakeholderSheet;
