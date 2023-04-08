import { WorksheetLinePrinter } from "./interfaces";

type RangePrinterOrientation = "top-to-bottom" | "left-to-right";

interface Cursor {
  row: number;
  col: number;
}

abstract class WorksheetRangePrinter {
  protected readonly startRow;
  protected readonly startCol;
  protected extents: Cursor;

  private lastChild: WorksheetRangePrinter | null = null;

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
    this.extents = { ...cursor };
  }

  public createNestedRange(
    orientation: RangePrinterOrientation
  ): WorksheetRangePrinter {
    if (this.lastChild?.orientation !== this.orientation) {
      this.lastChild?.break();
    } else if (this.orientation === "top-to-bottom") {
      this.cursor.col = this.startCol;
    } else {
      this.cursor.row = this.startRow;
    }

    this.lastChild = WorksheetRangePrinter.createWithCursor(
      this.printer,
      orientation,
      this.cursor
    );

    return this.lastChild;
  }

  public addCell(
    value: Date | string | number
    //style?: Partial<Style>
  ): WorksheetRangePrinter {
    this.printer.setCellAtCursor(this.cursor.row, this.cursor.col, value);
    this.checkExtents();
    this.advanceCursor();
    return this;
  }

  public addSum(): WorksheetRangePrinter {
    const topLeftCell = this.printer.getAddress(this.startRow, this.startCol);
    const bottomRightCell = this.printer.getAddress(
      this.extents.row,
      this.extents.col
    );
    this.printer.setFormulaCellAtCursor(
      this.cursor.row,
      this.cursor.col,
      `=SUM(${topLeftCell}:${bottomRightCell})`
    );
    this.checkExtents();
    this.advanceCursor();
    return this;
  }

  public abstract get orientation(): RangePrinterOrientation;

  public abstract break(): WorksheetRangePrinter;

  protected abstract rewind(): void;

  protected abstract advanceCursor(): void;

  private checkExtents(): void {
    if (this.cursor.row > this.extents.row) {
      this.extents.row = this.cursor.row;
    }
    if (this.cursor.col > this.extents.col) {
      this.extents.col = this.cursor.col;
    }
  }
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
