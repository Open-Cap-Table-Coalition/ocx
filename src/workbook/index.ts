// WorkbookWriter is our own interface that reduces / limits
// the interface of ExcelJS to the pieces we use. This means
// there will be less to implement in the future if we need
// to create a different writer.
interface WorkbookWriter {
  addWorksheet: (name?: string) => void;
}

class Workbook {
  constructor(private workbook: WorkbookWriter) {
    this.workbook.addWorksheet("Summary Snapshot");
    this.workbook.addWorksheet("Detailed Snapshot");
    this.workbook.addWorksheet("Voting by SH Group");
    this.workbook.addWorksheet("Context");
  }
}

export default Workbook;
