// WorkbookWriter is our own interface that reduces / limits
// the interface of ExcelJS to the pieces we use. This means
// there will be less to implement in the future if we need
// to create a different writer.
interface WorkbookWriter {
  addWorksheet: (name?: string) => WorksheetWriter;
  addWorksheet2: (name?: string) => WorksheetLinePrinter;
}

interface WorksheetWriter {
  setDateCell: (address: string, value: Date) => void;
  setStringCell: (address: string, value: string) => void;

  setRowHeight: (row: number, height: number) => void;
}

interface WorksheetLinePrinter {
  nextRow: (/*opts: { height?: number }*/) => WorksheetLinePrinter;
  createRange: (name: string /*, style: object */) => WorksheetLinePrinter;
  addCell: (value: Date | string /*, opts?: object */) => WorksheetLinePrinter;
  addBlankCell: () => WorksheetLinePrinter;
  addBlankCells: (n: number) => WorksheetLinePrinter;
  rangeComplete: () => void;
}

// This is a case of "the client defines the interface". The
// OCX.Model class is the concrete implementation, but we don't
// want OCX packages to depend directly on one another. So, we
// create the interface we need here.
interface Model {
  asOfDate: Date;
}

class Workbook {
  constructor(private workbook: WorkbookWriter, private model: Model) {
    this.workbook.addWorksheet("Summary Snapshot");
    this.workbook.addWorksheet("Detailed Snapshot");
    this.workbook.addWorksheet("Voting by SH Group");

    this.addContextSheet();
  }

  private addContextSheet() {
    const context = this.workbook.addWorksheet2("Context");

    context.nextRow(/*{ height: 59.5 }*/);

    context
      .createRange("context.header" /*, { fillColor: "#2a39c4" }*/)
      .addCell(this.model.asOfDate /*, { name: "context.header.date" } */)
      .addBlankCell()
      .addCell("Context")
      .addBlankCells(3)
      .rangeComplete();
  }
}

export default Workbook;
