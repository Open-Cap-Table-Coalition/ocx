// WorkbookWriter is our own interface that reduces / limits
// the interface of ExcelJS to the pieces we use. This means
// there will be less to implement in the future if we need
// to create a different writer.
interface WorkbookWriter {
  addWorksheet: (name?: string) => WorksheetWriter;
}

interface WorksheetWriter {
  getCell: (address: string) => {
    value: Date;
  };
}

// This is a case of "the client defines the interface". The
// OCX.Model class is the concrete implementation, but we don't
// want OCX packages to depend directly on one another. So, we
// create the interface we need here.
interface Model {
  asOfDate: Date;
}

export class Workbook {
  constructor(private workbook: WorkbookWriter, private model: Model) {
    this.workbook.addWorksheet("Summary Snapshot");
    this.workbook.addWorksheet("Detailed Snapshot");
    this.workbook.addWorksheet("Voting by SH Group");
    const context = this.workbook.addWorksheet("Context");
    context.getCell("A1").value = model.asOfDate;
  }
}

export default Workbook;
