import Excel from "exceljs";
import { Style } from "exceljs";

class ExcelJSWriter {
  private readonly workbook;

  constructor(workbook?: Excel.Workbook) {
    this.workbook = workbook || new Excel.Workbook();
  }

  public addWorksheet(name?: string): ExcelJSLinePrinter {
    return new ExcelJSLinePrinter(this.workbook.addWorksheet(name));
  }
}

class ExcelJSLinePrinter {
  private col: number;
  private row: number;
  private currentStyle: Partial<Style>;

  constructor(private readonly worksheet: Excel.Worksheet) {
    this.col = 0;
    this.row = 0;
    this.currentStyle = {};
  }

  public nextRow(opts?: { height?: number }) {
    this.col = 0;
    this.row += 1;

    if (opts?.height) {
      this.worksheet.getRow(this.row).height = opts.height;
    }
    return this;
  }

  public nextColumnCell(opts?: { height?: number }) {
    this.row += 1;

    if (opts?.height) {
      this.worksheet.getRow(this.row).height = opts.height;
    }
    return this;
  }

  public nextColumn(opts?: { width?: number }) {
    this.row = 1;
    this.col += 1;

    if (opts?.width) {
      this.worksheet.getColumn(this.col).width = opts.width;
    }

    // find first cell in current row that has no value
    while (this.hasValue()) {
      this.row += 1;
    }

    return this;
  }

  public previousRowCell(opts?: { height?: number }) {
    this.col -= 1;

    if (opts?.height) {
      this.worksheet.getRow(this.row).height = opts.height;
    }
    return this;
  }

  public createRange(name: string, style?: Partial<Style>) {
    this.currentStyle = style || {};
    return this;
  }

  public addCell(value: Date | string | number | null, style?: Partial<Style>) {
    this.col += 1;
    this.worksheet.getCell(this.row, this.col).value = value;
    this.worksheet.getCell(this.row, this.col).style = {
      ...this.currentStyle,
      ...style,
    };
    return this;
  }

  public writeCell(
    value: Date | string | number | null,
    style?: Partial<Style>
  ) {
    this.worksheet.getCell(this.row, this.col).value = value;
    this.worksheet.getCell(this.row, this.col).style = {
      ...this.currentStyle,
      ...style,
    };
    return this;
  }

  public createColumnRange(name: string, style?: Partial<Style>) {
    this.currentStyle = style || {};
    this.row += 1;
    this.col = 1;
    return this;
  }

  public currentAddress() {
    return this.worksheet.getCell(this.row, this.col).address;
  }

  public currentAddressVal() {
    return this.worksheet.getCell(this.row, this.col).value;
  }

  private hasValue() {
    const address = this.currentAddress();
    const cell = this.worksheet.getCell(address);
    return cell.value !== null && cell.value !== undefined;
  }

  public addBlankCell() {
    return this.addCell(null);
  }
  public addBlankCells(n: number) {
    for (let idx = 0; idx < n; idx++) {
      this.addBlankCell();
    }
    return this;
  }

  public addFormulaCell(formula: string, style?: Partial<Style>) {
    this.col += 1;
    this.worksheet.getCell(this.row, this.col).value = {
      formula,
      date1904: false, // Unclear what this is for but it is required by the type system
    };
    this.worksheet.getCell(this.row, this.col).style = {
      ...this.currentStyle,
      ...style,
    };
    return this;
  }

  public writeFormulaCell(formula: string, style?: Partial<Style>) {
    this.worksheet.getCell(this.row, this.col).value = {
      formula,
      date1904: false, // Unclear what this is for but it is required by the type system
    };
    this.worksheet.getCell(this.row, this.col).style = {
      ...this.currentStyle,
      ...style,
    };
    return this;
  }

  public rangeComplete() {
    // could add the range to the actual worksheet
    // or could just keep track of in our own structure
    // we'll see
  }
}

export default ExcelJSWriter;
