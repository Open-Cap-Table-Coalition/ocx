import { WorksheetLinePrinter } from "./interfaces";

type RangePrinterOrientation = "top-to-bottom" | "left-to-right";

abstract class WorksheetRangePrinter {
  protected row = 1;
  protected col = 1;

  public static create(
    printer: WorksheetLinePrinter,
    orientation: RangePrinterOrientation
  ) {
    if (orientation === "top-to-bottom") {
      return new WorksheetTopToBottomRangePrinter(printer);
    } else {
      return new WorksheetLeftToRightRangePrinter(printer);
    }
  }

  protected constructor(private readonly printer: WorksheetLinePrinter) {}

  public addCell(
    value: Date | string | number
    //style?: Partial<Style>
  ): WorksheetRangePrinter {
    this.printer.setCellAtCursor(this.row, this.col, value);
    this.advanceCursor();
    return this;
  }

  public abstract break(): WorksheetRangePrinter;

  protected abstract advanceCursor(): void;
}

class WorksheetLeftToRightRangePrinter extends WorksheetRangePrinter {
  protected advanceCursor() {
    this.col += 1;
  }

  public break(): WorksheetRangePrinter {
    this.row += 1;
    this.col = 1;
    return this;
  }
}

class WorksheetTopToBottomRangePrinter extends WorksheetRangePrinter {
  protected advanceCursor() {
    this.row += 1;
  }

  public break(): WorksheetRangePrinter {
    this.row = 1;
    this.col += 1;
    return this;
  }
}

export default WorksheetRangePrinter;
