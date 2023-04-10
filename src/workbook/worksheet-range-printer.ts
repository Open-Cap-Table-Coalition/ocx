import { WorksheetLinePrinter } from "./interfaces";

type RangePrinterOrientation = "top-to-bottom" | "left-to-right";

interface Cursor {
  row: number;
  col: number;
}

abstract class WorksheetRangePrinter {
  // "extents" describes the bounding box of cells in this range
  protected extents: {
    topLeft: Cursor;
    btmRight: Cursor;
  };

  /**
   * Factory method for creating the initial "WorksheetRangePrinter"
   * for a particular worksheet. This will always create a range at
   * the origin ("A1") of the worksheet, so calling this more than
   * once on a single sheet will create overlapping range printers.
   */
  public static create(
    printer: WorksheetLinePrinter,
    orientation: RangePrinterOrientation
  ): WorksheetRangePrinter {
    return WorksheetRangePrinter.createWithCursor(printer, orientation, {
      row: 1,
      col: 1,
    });
  }

  private static createWithCursor(
    printer: WorksheetLinePrinter,
    orientation: RangePrinterOrientation,
    cursor: Cursor,
    parent?: WorksheetRangePrinter
  ): WorksheetRangePrinter {
    if (orientation === "top-to-bottom") {
      return new WorksheetTopToBottomRangePrinter(printer, cursor, parent);
    } else {
      return new WorksheetLeftToRightRangePrinter(printer, cursor, parent);
    }
  }

  protected constructor(
    private readonly printer: WorksheetLinePrinter,
    protected cursor: Cursor,
    protected parent: WorksheetRangePrinter | null = null
  ) {
    // The initial cursor position is copied into the extents structure
    this.extents = { topLeft: { ...cursor }, btmRight: { ...cursor } };
  }

  /**
   * Factory method for creating printers for ranges nested within this
   * one. Creating nested ranges allow us to refer to ranges and sub-ranges
   * of the worksheet elsewhere in the code.
   */
  public createNestedRange(
    orientation: RangePrinterOrientation
  ): WorksheetRangePrinter {
    // If no cells have been written yet, we don't want to adjust the
    // cursor before creating the sub range; otherwise we end up with
    // unnecessary blank rows / cols
    if (
      this.extents.topLeft.row !== this.extents.btmRight.row ||
      this.extents.topLeft.col !== this.extents.btmRight.col
    ) {
      // otherwise, we perform a range "break" based on the current
      // extents and orientiation of the block; this prevents
      // the user from having to insert extra `.break()` statements
      // that don't make the code any clearer or easier to write
      if (this.orientation === "top-to-bottom") {
        this.cursor.row = this.extents.btmRight.row + 1;
        this.cursor.col = this.extents.topLeft.col;
      } else {
        this.cursor.row = this.extents.topLeft.row;
        this.cursor.col = this.extents.btmRight.col + 1;
      }
    }

    return WorksheetRangePrinter.createWithCursor(
      this.printer,
      orientation,
      this.cursor,
      this
    );
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
    const topLeftCell = this.printer.getAddress(
      this.extents.topLeft.row,
      this.extents.topLeft.col
    );
    const bottomRightCell = this.printer.getAddress(
      this.extents.btmRight.row,
      this.extents.btmRight.col
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
    if (this.cursor.row > this.extents.btmRight.row) {
      this.extents.btmRight.row = this.cursor.row;
    }
    if (this.cursor.col > this.extents.btmRight.col) {
      this.extents.btmRight.col = this.cursor.col;
    }

    this.parent?.checkExtents();
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
    this.cursor.col = this.extents.topLeft.col;
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
    this.cursor.row = this.extents.topLeft.row;
  }

  public get orientation(): RangePrinterOrientation {
    return "top-to-bottom";
  }
}

export default WorksheetRangePrinter;
