import { Style } from "exceljs";

// This is a case of "the client defines the interface". The
// OCX.Model class is the concrete implementation, but we don't
// want OCX packages to depend directly on one another. So, we
// create the interface we need here.
export interface Model {
  asOfDate: Date;
  issuerName: string;
}

export interface WorksheetLinePrinter {
  nextRow: (opts?: { height?: number }) => WorksheetLinePrinter;
  createRange: (name: string, style?: Partial<Style>) => WorksheetLinePrinter;
  addCell: (
    value: Date | string,
    style?: Partial<Style>
  ) => WorksheetLinePrinter;
  addFormulaCell: (
    formula: string,
    style?: Partial<Style>
  ) => WorksheetLinePrinter;
  addBlankCell: () => WorksheetLinePrinter;
  addBlankCells: (n: number) => WorksheetLinePrinter;
  rangeComplete: () => void;
}
