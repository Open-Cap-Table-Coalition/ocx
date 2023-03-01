import Excel from "exceljs";

class ExcelJSWriter {
  private readonly workbook;

  constructor(workbook?: Excel.Workbook) {
    this.workbook = workbook || new Excel.Workbook();
  }

  public addWorksheet(name?: string): ExcelJSWorksheet {
    return new ExcelJSWorksheet(this.workbook.addWorksheet(name));
  }
}

class ExcelJSWorksheet {
  constructor(private readonly worksheet: Excel.Worksheet) {}

  public setDateCell(address: string, value: Date) {
    this.worksheet.getCell(address).value = value;
  }
}

export default ExcelJSWriter;
