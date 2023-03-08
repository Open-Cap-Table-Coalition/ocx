import StakeholderSheet from "./stakeholder-sheet";
import { Model, WorksheetLinePrinter } from "./interfaces";
import Styles from "./styles";

// WorkbookWriter is our own interface that reduces / limits
// the interface of ExcelJS to the pieces we use. This means
// there will be less to implement in the future if we need
// to create a different writer.
interface WorkbookWriter {
  addWorksheet: (name?: string) => WorksheetLinePrinter;
}

class Workbook {
  private readonly stakeholders: StakeholderSheet;

  constructor(private workbook: WorkbookWriter, private model: Model) {
    this.addSummarySheet();
    this.stakeholders = new StakeholderSheet(
      workbook.addWorksheet("Stakeholder Snapshot"),
      this.model
    );
    this.addVotingDetailsSheet();
    this.addContextSheet();
  }

  private addSummarySheet() {
    const summary = this.workbook.addWorksheet("Summary Snapshot");

    summary.nextRow({ height: 59.5 });

    summary
      .createRange("summary.header", {
        fill: Styles.headerFill,
        font: Styles.headerFont,
        border: Styles.headerBorder,
      })
      .addFormulaCell("Context!A1", {
        alignment: { vertical: "bottom", horizontal: "right" },
        numFmt: "yyyy.mm.dd;@",
      })
      .addBlankCell()
      .addCell(`${this.model.issuerName} Summary Capitalization`, {
        alignment: { vertical: "middle", horizontal: "left" },
      })
      .addBlankCells(3)
      .rangeComplete();
  }

  private addVotingDetailsSheet() {
    const voting = this.workbook.addWorksheet("Voting by SH Group");

    voting.nextRow({ height: 59.5 });

    voting
      .createRange("voting.header", {
        fill: Styles.headerFill,
        font: Styles.headerFont,
        border: Styles.headerBorder,
      })
      .addFormulaCell("Context!A1", {
        alignment: { vertical: "bottom", horizontal: "right" },
        numFmt: "yyyy.mm.dd;@",
      })
      .addBlankCell()
      .addCell("Voting Power by Shareholder Group", {
        alignment: { vertical: "middle", horizontal: "left" },
      })
      .addBlankCells(3)
      .rangeComplete();
  }

  private addContextSheet() {
    const context = this.workbook.addWorksheet("Context");

    context.nextRow({ height: 59.5 });

    context
      .createRange("context.header", {
        fill: Styles.headerFill,
        font: Styles.headerFont,
        border: Styles.headerBorder,
      })
      .addCell(this.model.asOfDate, {
        alignment: { vertical: "bottom", horizontal: "right" },
        numFmt: "yyyy.mm.dd;@",
      })
      .addBlankCell()
      .addCell("Context", {
        alignment: { vertical: "middle", horizontal: "left" },
      })
      .addBlankCells(3)
      .rangeComplete();
  }
}

export default Workbook;
