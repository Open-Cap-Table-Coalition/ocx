import { WorksheetLinePrinter } from "./interfaces";

type RangePrinterOrientation = "top-to-bottom" | "left-to-right";

interface Cursor {
  row: number;
  col: number;
}

abstract class WorksheetRangePrinter {
  protected readonly startRow;
  protected readonly startCol;

  public static create(
    printer: WorksheetLinePrinter,
    orientation: RangePrinterOrientation
  ) {
    return WorksheetRangePrinter.createWithCursor(printer, orientation, {
      row: 1,
      col: 1,
    });
  }

  private static createWithCursor(
    printer: WorksheetLinePrinter,
    orientation: RangePrinterOrientation,
    cursor: Cursor
  ) {
    if (orientation === "top-to-bottom") {
      return new WorksheetTopToBottomRangePrinter(printer, cursor);
    } else {
      return new WorksheetLeftToRightRangePrinter(printer, cursor);
    }
  }

  protected constructor(
    private readonly printer: WorksheetLinePrinter,
    protected cursor: Cursor
  ) {
    this.startRow = cursor.row;
    this.startCol = cursor.col;
  }

  public createNestedRange(
    orientation: RangePrinterOrientation
  ): WorksheetRangePrinter {
    return WorksheetRangePrinter.createWithCursor(
      this.printer,
      orientation,
      this.cursor
    );
  }

  public addCell(
    value: Date | string | number
    //style?: Partial<Style>
  ): WorksheetRangePrinter {
    this.printer.setCellAtCursor(this.cursor.row, this.cursor.col, value);
    this.advanceCursor();
    return this;
  }

  public abstract get orientation(): RangePrinterOrientation;

  public abstract break(): WorksheetRangePrinter;

  protected abstract rewind(): void;

  protected abstract advanceCursor(): void;
}

class WorksheetLeftToRightRangePrinter extends WorksheetRangePrinter {
  protected advanceCursor() {
    this.cursor.col += 1;
  }

  public break(): WorksheetRangePrinter {
    this.rewind();
    this.cursor.row += 1;
    return this;
  }

  protected rewind(): void {
    this.cursor.col = this.startCol;
  }

  public get orientation(): RangePrinterOrientation {
    return "left-to-right";
  }
}

class WorksheetTopToBottomRangePrinter extends WorksheetRangePrinter {
  protected advanceCursor() {
    this.cursor.row += 1;
  }

  public break(): WorksheetRangePrinter {
    this.rewind();
    this.cursor.col += 1;
    return this;
  }

  protected rewind(): void {
    this.cursor.row = this.startRow;
  }

  public get orientation(): RangePrinterOrientation {
    return "top-to-bottom";
  }
}

export default WorksheetRangePrinter;
