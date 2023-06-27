import { WorksheetLinePrinter } from "./interfaces";

import { Style } from "exceljs";

import * as Extents from "./extents";

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

  private style: Partial<Style> = {};

  // TODO: This was written before the Extents module was created
  // and we have yet to eliminate it.
  public getExtents() {
    return {
      topLeft: { ...this.extents.topLeft },
      topLeftAddress: Extents.ExcelUtils.cursorToAddress(this.extents.topLeft),
      btmRight: { ...this.extents.btmRight },
      btmRightAddress: Extents.ExcelUtils.cursorToAddress(
        this.extents.btmRight
      ),
      height: this.extents.btmRight.row - this.extents.topLeft.row + 1,
    };
  }

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
    this.extents = Extents.ExtentsFactory.createAt(cursor);
  }

  /**
   * Factory method for creating printers for ranges nested within this
   * one. Creating nested ranges allow us to refer to ranges and sub-ranges
   * of the worksheet elsewhere in the code.
   */
  public createNestedRange(
    opts: {
      orientation?: RangePrinterOrientation;
      style?: Partial<Style>;
      rowHeight?: number;
    } = {}
  ): WorksheetRangePrinter {
    const resolvedOpts = {
      orientation: opts.orientation ?? this.orientation,
      style: { ...this.style, ...opts.style },
      rowHeight: opts.rowHeight,
    };

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

    const range = WorksheetRangePrinter.createWithCursor(
      this.printer,
      resolvedOpts.orientation,
      this.cursor,
      this
    );

    if (resolvedOpts.style) {
      range.setStyle(resolvedOpts.style);
    }

    if (resolvedOpts.rowHeight) {
      range.printer.setRowHeight(this.cursor.row, resolvedOpts.rowHeight);
    }

    return range;
  }

  public setStyle(style: Partial<Style>): WorksheetRangePrinter {
    this.style = style;
    return this;
  }

  public setWidth(width: number): WorksheetRangePrinter {
    this.printer.setColWidth(this.cursor.col, width);
    return this;
  }

  public setHeight(height: number): WorksheetRangePrinter {
    this.printer.setRowHeight(this.cursor.row, height);
    return this;
  }

  public addCell(
    value: Date | string | number,
    style?: Partial<Style>
  ): WorksheetRangePrinter {
    this.printer.setCellAtCursor(this.cursor.row, this.cursor.col, value, {
      ...this.style,
      ...style,
    });
    this.checkExtents();
    this.advanceCursor();
    return this;
  }

  public addFormulaCell(
    formula: string,
    style?: Partial<Style>
  ): WorksheetRangePrinter {
    this.printer.setFormulaCellAtCursor(
      this.cursor.row,
      this.cursor.col,
      `=${formula}`,
      { ...this.style, ...style }
    );
    this.checkExtents();
    this.advanceCursor();
    return this;
  }

  public addRepeatedFormulaCell(
    formula: string,
    repetitions: number,
    style?: Partial<Style>
  ) {
    this.printer.setFormulaCellAtCursor(
      this.cursor.row,
      this.cursor.col,
      `=${formula}`,
      { ...this.style, ...style }
    );

    const referenceFormulaAddress = Extents.ExcelUtils.cursorToAddress(
      this.cursor
    );

    for (let idx = 1; idx < repetitions; idx++) {
      this.advanceCursor();
      this.printer.copyFormulaCell(
        referenceFormulaAddress,
        this.cursor.row,
        this.cursor.col,
        { ...this.style, ...style }
      );
    }

    this.checkExtents();
    this.advanceCursor();
  }

  public addBlankCell(style?: Partial<Style>): WorksheetRangePrinter {
    this.printer.setCellAtCursor(this.cursor.row, this.cursor.col, null, {
      ...this.style,
      ...style,
    });
    this.checkExtents();
    this.advanceCursor();
    return this;
  }

  public addBlankCells(
    n: number,
    style?: Partial<Style>
  ): WorksheetRangePrinter {
    for (let idx = 0; idx < n; idx++) {
      this.addBlankCell(style);
    }
    return this;
  }

  public addSum(style?: Partial<Style>): WorksheetRangePrinter {
    return this.addSumFor(this, style);
  }

  public addSumFor(otherRange: WorksheetRangePrinter, style?: Partial<Style>) {
    const topLeftCell = Extents.ExcelUtils.cursorToAddress(
      otherRange.extents.topLeft
    );
    const bottomRightCell = Extents.ExcelUtils.cursorToAddress(
      otherRange.extents.btmRight
    );
    return this.addFormulaCell(`SUM(${topLeftCell}:${bottomRightCell})`, style);
  }

  public mergeCells(
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ) {
    this.printer.mergeCells(startRow, startCol, endRow, endCol);
    return this;
  }

  public getCurrentRow(): number {
    return this.cursor.row;
  }

  public abstract get orientation(): RangePrinterOrientation;

  public abstract break(): WorksheetRangePrinter;

  protected abstract rewind(): void;

  protected abstract advanceCursor(): void;

  protected checkExtents(): void {
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
