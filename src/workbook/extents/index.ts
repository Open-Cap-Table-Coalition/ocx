import Excel from "exceljs";

interface Cursor {
  row: number;
  col: number;
}

interface ExtentsCursors {
  topLeft: Cursor;
  btmRight: Cursor;
}

export class ExcelUtils {
  private static worksheet: Excel.Worksheet = ExcelUtils.dummyWorksheet();

  private static dummyWorksheet() {
    const wb = new Excel.Workbook();
    return wb.addWorksheet();
  }

  public static cursorToAddress(c: Cursor) {
    return ExcelUtils.worksheet.getCell(c.row, c.col).address;
  }

  public static addressToCursor(addr: string): Cursor {
    const cell = ExcelUtils.worksheet.getCell(addr);
    return {
      row: parseInt(cell.row),
      col: parseInt(cell.col),
    };
  }
}

class Extents implements ExtentsCursors {
  public readonly topLeft: Cursor;
  public readonly btmRight: Cursor;

  public constructor(original: ExtentsCursors) {
    // We want this object to _clone_ the original extents so that
    // the reader does not inadvertently modify registered extents
    this.topLeft = { ...original.topLeft };
    this.btmRight = { ...original.btmRight };
  }

  public get topLeftAddress() {
    return ExcelUtils.cursorToAddress(this.topLeft);
  }

  public get btmRightAddress() {
    return ExcelUtils.cursorToAddress(this.btmRight);
  }

  public get height(): number {
    return this.btmRight.row - this.topLeft.row + 1;
  }
}

export class ExtentsCollection extends Array<Extents> {
  public static buildFrom(extents: ExtentsCursors[]) {
    return new ExtentsCollection(...extents.map((e) => new Extents(e)));
  }

  public get height(): number {
    return Math.max(...this.map((e) => e.height));
  }
}

export class ExtentsFactory {
  static createAt(origin: Cursor): ExtentsCursors {
    const newExtentsObj = {
      topLeft: { ...origin }, // destructure to clone
      btmRight: { ...origin },
    };

    return newExtentsObj;
  }
}
