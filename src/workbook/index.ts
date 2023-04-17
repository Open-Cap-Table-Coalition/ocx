import ContextSheet from "./context-sheet";
import StakeholderSheet from "./stakeholder-sheet";
import SummarySheet from "./summary-sheet";
import VotingDetailsSheet from "./voting-details-sheet";

import { Model, WorksheetLinePrinter } from "./interfaces";

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
    new SummarySheet(summary, this.model);
  }

  private addVotingDetailsSheet() {
    const voting = this.workbook.addWorksheet("Voting by SH Group");
    new VotingDetailsSheet(voting);
  }

  private addContextSheet() {
    const context = this.workbook.addWorksheet("Context");
    new ContextSheet(context, this.model);
  }
}

export default Workbook;
