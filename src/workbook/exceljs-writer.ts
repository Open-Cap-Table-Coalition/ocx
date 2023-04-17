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
  constructor(private readonly worksheet: Excel.Worksheet) {}

  public setCellAtCursor(
    row: number,
    col: number,
    value: Date | string | number | null,
    style?: Partial<Style>
  ) {
    this.worksheet.getCell(row, col).value = value;
    if (style) {
      this.worksheet.getCell(row, col).style = style;
    }
  }

  public setFormulaCellAtCursor(
    row: number,
    col: number,
    formula: string,
    style?: Partial<Style>
  ) {
    this.worksheet.getCell(row, col).value = {
      formula,
      date1904: false, // Unclear what this is for but it is required by the type system
    };
    if (style) {
      this.worksheet.getCell(row, col).style = style;
    }
  }

  public copyFormulaCell(
    from: string,
    row: number,
    col: number,
    style?: Partial<Style>
  ) {
    this.worksheet.getCell(row, col).value = {
      sharedFormula: from,
      date1904: false,
    };
    if (style) {
      this.worksheet.getCell(row, col).style = style;
    }
  }

  public getAddress(row: number, col: number) {
    return this.worksheet.getCell(row, col).address;
  }

  public setRowHeight(row: number, height: number) {
    this.worksheet.getRow(row).height = height;
  }

  public setColWidth(col: number, width: number) {
    this.worksheet.getColumn(col).width = width;
  }
}

export default ExcelJSWriter;
