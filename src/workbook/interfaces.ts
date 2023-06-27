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
  rounding_type?: string;
}

export interface StockPlanModel {
  id?: string;
  plan_name: string;
  initial_shares_reserved?: string;
  stock_class_id?: string;
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

  stockPlans?: Array<StockPlanModel>;

  warrantStockIds?: Set<string>;

  warrantsSources?: Map<string, string>;

  nonPlanStockIds?: Set<string>;

  getStakeholderStockHoldings?: (
    stakeholder: StakeholderModel,
    stockClass: StockClassModel
  ) => number;

  getStakeholderStockPlanHoldings?: (
    stakeholder: StakeholderModel,
    stockPlan: StockPlanModel
  ) => number;

  getStakeholderWarrantHoldings?: (
    stakeholder: StakeholderModel,
    stockClass: StockClassModel
  ) => number;

  getStakeholderNonPlanHoldings?: (
    stakeholder: StakeholderModel,
    stockClass: StockClassModel
  ) => number;

  getOptionsRemainingForIssuance?: (stockPlan: StockPlanModel) => number;

  getStockClassConversionRatio?: (stockClass: StockClassModel) => number;

  getConversionCommonStockClass?: (
    stockClass: StockClassModel
  ) => StockClassModel;
}

export interface WorksheetLinePrinter {
  setCellAtCursor: (
    row: number,
    col: number,
    value: Date | string | number | null,
    style?: Partial<Style>
  ) => void;
  setFormulaCellAtCursor: (
    row: number,
    col: number,
    formula: string,
    style?: Partial<Style>
  ) => void;
  copyFormulaCell: (
    from: string,
    row: number,
    col: number,
    style?: Partial<Style>
  ) => void;
  setRowHeight: (row: number, height: number) => void;
  setColWidth: (col: number, width: number) => void;
  mergeCells(
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): void;
}
