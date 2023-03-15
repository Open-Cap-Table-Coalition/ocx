import { Style } from "exceljs";

export interface StakeholderModel {
  id?: string;
  display_name: string;
}

export interface StockClassModel {
  id?: string;
  display_name: string;
  is_preferred?: boolean;
  conversion_ratio?: number;
}

// This is a case of "the client defines the interface". The
// OCX.Model class is the concrete implementation, but we don't
// want OCX packages to depend directly on one another. So, we
// create the interface we need here.
export interface Model {
  asOfDate: Date;
  issuerName: string;
  stakeholders: Array<StakeholderModel>;

  stockClasses?: Array<StockClassModel>;

  getStakeholderStockHoldings?: (
    stakeholder: StakeholderModel,
    stockClass: StockClassModel
  ) => number;
}

export interface WorksheetLinePrinter {
  nextRow: (opts?: { height?: number }) => WorksheetLinePrinter;
  createRange: (name: string, style?: Partial<Style>) => WorksheetLinePrinter;
  addCell: (
    value: Date | string | number,
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
