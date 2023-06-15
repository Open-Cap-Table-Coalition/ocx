import {
  Model as WorkbookModel,
  StakeholderModel,
  StockClassModel as WorkbookStockClassModel,
  StockPlanModel as WorkbookStockPlanModel,
} from "src/workbook/interfaces";

// When I tried to use "Calculations.OutstandingStockSharesCalculator"
// in a Map generic, I got a "cannot find namespace 'Calculations'"
// error. Until I have time to understand this, I'm importing the
// calculator separately.
import {
  OutstandingStockSharesCalculator,
  OutstandingStockPlanCalculator,
  OptionsRemainingCalculator,
  ConversionRatioCalculator,
  WarrantSharesCalculator,
} from "./calculations";

interface StockClassModel extends WorkbookStockClassModel {
  board_approval_date: Date | null;
}

interface StockPlanModel extends WorkbookStockPlanModel {
  board_approval_date: Date | null;
}

class Model implements WorkbookModel {
  public issuerName = "";
  private stakeholders_: StakeholderModel[] = [];
  private stockClasses_: StockClassModel[] = [];
  private sortedStockClasses_: StockClassModel[] = [];
  private stockPlans_: StockPlanModel[] = [];
  private sortedStockPlans_: StockPlanModel[] = [];
  private ratioCalculator = new ConversionRatioCalculator();
  public warrantStockIds: Set<string> = new Set();
  public nonPlanStockIds: Set<string> = new Set();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transactionsBySecurityId_ = new Map<string, Set<any>>();
  private issuedSecuritiesByStakeholderAndStockClassIds_ = new Map<
    string,
    Set<string>
  >();
  private issuedSecuritiesByStakeholderAndStockPlanIds_ = new Map<
    string,
    Set<string>
  >();
  private issuedSecuritiesByStakeholderAndWarrantStockIds_ = new Map<
    string,
    Set<string>
  >();

  private issuedSecuritiesByStakeholderAndNonPlanStockIds_ = new Map<
    string,
    Set<string>
  >();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private adjustmentsByStockPlanId_ = new Map<string, Set<any>>();

  constructor(
    public readonly asOfDate: Date,
    public readonly generatedAtTimestamp: Date
  ) {}

  // This is required here because an object being "consumed" from
  // the ocf package is by definition "anything". This `any` will
  // likely stick around, but we will look at how we might share a
  // real type / interface here instead.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public consume(value: any) {
    if (value?.object_type === "ISSUER") {
      this.ISSUER(value);
    }

    if (value?.object_type === "STAKEHOLDER") {
      this.STAKEHOLDER(value);
    }

    if (value?.object_type === "STOCK_CLASS") {
      this.STOCK_CLASS(value);
    }

    if (value?.object_type === "STOCK_PLAN") {
      this.STOCK_PLAN(value);
    }

    if ((value?.object_type ?? "").startsWith("TX_STOCK_")) {
      this.TX_STOCK(value);
    }

    if ((value?.object_type ?? "").startsWith("TX_PLAN_SECURITY_")) {
      this.TX_PLAN_SECURITY(value);
    }

    if ((value?.object_type ?? "").startsWith("TX_EQUITY_COMPENSATION_")) {
      this.TX_EQUITY_COMPENSATION(value);
    }

    if ((value?.object_type ?? "") === "TX_STOCK_PLAN_POOL_ADJUSTMENT") {
      this.TX_STOCK_PLAN_POOL_ADJUSTMENT(value);
    }

    if ((value?.object_type ?? "").startsWith("TX_WARRANT_")) {
      this.TX_WARRANT(value);
    }
  }

  public get stakeholders() {
    return this.stakeholders_;
  }

  public get stockClasses() {
    if (this.sortedStockClasses_.length !== this.stockClasses_.length) {
      this.sortedStockClasses_ = [...this.stockClasses_].sort(
        this.compareClassesForSort
      );
    }

    return this.sortedStockClasses_;
  }

  public get stockPlans() {
    if (this.sortedStockPlans_.length !== this.stockPlans_.length) {
      this.sortedStockPlans_ = [...this.stockPlans_].sort(
        this.comparePlansForSort
      );
    }

    return this.sortedStockPlans_;
  }

  public getStakeholderStockHoldings(
    stakeholder: StakeholderModel,
    stockClass: WorkbookStockClassModel
  ) {
    const calculator = new OutstandingStockSharesCalculator();

    const issuanceSecurityIds =
      this.issuedSecuritiesByStakeholderAndStockClassIds_.get(
        `${stakeholder.id}/${stockClass.id}`
      ) || new Set();

    for (const id of issuanceSecurityIds) {
      for (const txn of this.transactionsBySecurityId_.get(id) || []) {
        calculator.apply(txn);
      }
    }

    return calculator.value;
  }

  public getStakeholderStockPlanHoldings(
    stakeholder: StakeholderModel,
    stockPlan: WorkbookStockPlanModel
  ) {
    const calculator = new OutstandingStockPlanCalculator();

    // get stock class for this plan
    // get ratio if stock class is preferred
    const stockClass = this.stockClasses_.find(
      (cls) => cls.id === stockPlan.stock_class_id
    );
    let ratio = 1;
    if (stockClass?.is_preferred) {
      ratio = this.getStockClassConversionRatio(stockClass);
    }

    const issuanceSecurityIds =
      this.issuedSecuritiesByStakeholderAndStockPlanIds_.get(
        `${stakeholder.id}/${stockPlan.id}`
      ) || new Set();
    for (const id of issuanceSecurityIds) {
      for (const txn of this.transactionsBySecurityId_.get(id) || []) {
        calculator.apply(txn);
      }
    }

    return calculator.value * ratio;
  }

  public getStakeholderWarrantHoldings(
    stakeholder: StakeholderModel,
    stockClass: WorkbookStockClassModel
  ) {
    const calculator = new WarrantSharesCalculator();
    // get ratio if stock class is preferred
    let ratio = 1;
    if (stockClass?.is_preferred) {
      ratio = this.getStockClassConversionRatio(stockClass);
    }

    const issuanceSecurityIds =
      this.issuedSecuritiesByStakeholderAndWarrantStockIds_.get(
        `${stakeholder.id}/${stockClass.id}`
      ) || new Set();

    for (const id of issuanceSecurityIds) {
      for (const txn of this.transactionsBySecurityId_.get(id) || []) {
        calculator.apply(txn);
      }
    }

    return calculator.value * ratio;
  }

  public getStakeholderNonPlanHoldings(
    stakeholder: StakeholderModel,
    stockClass: WorkbookStockClassModel
  ) {
    const calculator = new OutstandingStockPlanCalculator();
    // get ratio if stock class is preferred
    let ratio = 1;
    if (stockClass?.is_preferred) {
      ratio = this.getStockClassConversionRatio(stockClass);
    }

    const issuanceSecurityIds =
      this.issuedSecuritiesByStakeholderAndNonPlanStockIds_.get(
        `${stakeholder.id}/${stockClass.id}`
      ) || new Set();

    for (const id of issuanceSecurityIds) {
      for (const txn of this.transactionsBySecurityId_.get(id) || []) {
        calculator.apply(txn);
      }
    }

    return calculator.value * ratio;
  }

  public getOptionsRemainingForIssuance(stockPlan: WorkbookStockPlanModel) {
    let total_holdings = 0;
    this.stakeholders_.forEach((s) => {
      total_holdings += this.getStakeholderStockPlanHoldings(s, stockPlan);
    });

    const shares_reserved = stockPlan.initial_shares_reserved;

    const calculator = new OptionsRemainingCalculator();

    if (stockPlan.id !== undefined && shares_reserved !== undefined) {
      const adjustments = this.adjustmentsByStockPlanId_.get(stockPlan.id);
      calculator.apply(shares_reserved, total_holdings, adjustments);
    }

    return calculator.value;
  }

  private compareClassesForSort(
    classA: StockClassModel,
    classB: StockClassModel
  ) {
    // Sort criteria 1: Common before preferred
    if (classA.is_preferred !== classB.is_preferred) {
      return classA.is_preferred ? 1 : -1;
    }

    // Sort criteria 2: Older before newer
    const now = new Date();
    const dateDiff: number =
      (classA.board_approval_date ?? now).valueOf() -
      (classB.board_approval_date ?? now).valueOf();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    // Tie-breaker: Sort by name
    return classA.display_name.localeCompare(classB.display_name);
  }

  private comparePlansForSort(classA: StockPlanModel, classB: StockPlanModel) {
    // Sort criteria 1: Older before newer
    const nullDate = new Date();
    const dateA = classA.board_approval_date ?? nullDate;
    const dateB = classB.board_approval_date ?? nullDate;
    const dateDiff: number = dateA.valueOf() - dateB.valueOf();
    if (dateDiff !== 0) {
      return dateDiff;
    }

    // Tie-breaker: Sort by name
    return classA.plan_name.localeCompare(classB.plan_name);
  }

  // This is required on the methods below because an object being
  // "consumed" from the ocf package is by definition "anything".
  // These `anys` may go away because we can define some
  // expectations about the shape of specific objects, but for now
  // we'll do this.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ISSUER(value: any) {
    if ("dba" in value) {
      this.issuerName = `${value.dba}`;
    } else if ("legal_name" in value) {
      this.issuerName = `${value.legal_name}`;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private STAKEHOLDER(value: any) {
    this.stakeholders_.push({
      id: value?.id,
      display_name: value?.name?.legal_name || " - ",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private STOCK_CLASS(value: any) {
    this.ratioCalculator.apply(value);

    const rounding_type = this.getStockClassRoundingType(
      value?.conversion_rights
    );

    let board_approval_date = null;

    if (value?.board_approval_date) {
      board_approval_date = new Date(value.board_approval_date);
    }
    this.stockClasses_.push({
      id: value?.id,
      display_name: value?.name,
      is_preferred: value?.class_type !== "COMMON",
      board_approval_date,
      rounding_type,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private STOCK_PLAN(value: any) {
    let board_approval_date = null;

    if (value?.board_approval_date) {
      board_approval_date = new Date(value.board_approval_date);
    }
    this.stockPlans_.push({
      id: value?.id,
      plan_name: value?.plan_name,
      board_approval_date,
      initial_shares_reserved: value?.initial_shares_reserved,
      stock_class_id: value?.stock_class_id,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private TX_STOCK(value: any) {
    if (value.object_type === "TX_STOCK_ISSUANCE") {
      const key = `${value.stakeholder_id}/${value.stock_class_id}`;
      const ids =
        this.issuedSecuritiesByStakeholderAndStockClassIds_.get(key) ||
        new Set();
      ids.add(value.security_id);
      this.issuedSecuritiesByStakeholderAndStockClassIds_.set(key, ids);
    }
    const txns =
      this.transactionsBySecurityId_.get(value.security_id) || new Set();
    txns.add(value);
    this.transactionsBySecurityId_.set(value.security_id, txns);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private TX_WARRANT(value: any) {
    if (value.object_type === "TX_WARRANT_ISSUANCE") {
      const stock_class_id = this.getStockClassIdForWarrant(value);
      if (stock_class_id !== undefined) {
        const key = `${value.stakeholder_id}/${stock_class_id}`;
        const ids =
          this.issuedSecuritiesByStakeholderAndWarrantStockIds_.get(key) ||
          new Set();
        ids.add(value.security_id);
        this.issuedSecuritiesByStakeholderAndWarrantStockIds_.set(key, ids);
        this.warrantStockIds.add(stock_class_id);
      }
    }
    const txns =
      this.transactionsBySecurityId_.get(value.security_id) || new Set();
    txns.add(value);
    this.transactionsBySecurityId_.set(value.security_id, txns);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private TX_STOCK_PLAN_POOL_ADJUSTMENT(value: any) {
    const txns =
      this.adjustmentsByStockPlanId_.get(value.stock_plan_id) || new Set();
    txns.add(value);
    this.adjustmentsByStockPlanId_.set(value.stock_plan_id, txns);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private TX_PLAN_SECURITY(value: any) {
    if (value.object_type === "TX_PLAN_SECURITY_ISSUANCE") {
      const key = `${value.stakeholder_id}/${value.stock_plan_id}`;
      const ids =
        this.issuedSecuritiesByStakeholderAndStockPlanIds_.get(key) ||
        new Set();
      ids.add(value.security_id);
      this.issuedSecuritiesByStakeholderAndStockPlanIds_.set(key, ids);
    }
    const txns =
      this.transactionsBySecurityId_.get(value.security_id) || new Set();
    txns.add(value);
    this.transactionsBySecurityId_.set(value.security_id, txns);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private TX_EQUITY_COMPENSATION(value: any) {
    if (
      value.object_type === "TX_EQUITY_COMPENSATION_ISSUANCE" &&
      value.stock_class_id !== undefined
    ) {
      const key = `${value.stakeholder_id}/${value.stock_class_id}`;
      const ids =
        this.issuedSecuritiesByStakeholderAndNonPlanStockIds_.get(key) ||
        new Set();
      ids.add(value.security_id);
      this.issuedSecuritiesByStakeholderAndNonPlanStockIds_.set(key, ids);
      this.nonPlanStockIds.add(value.stock_class_id);
    }
    const txns =
      this.transactionsBySecurityId_.get(value.security_id) || new Set();
    txns.add(value);
    this.transactionsBySecurityId_.set(value.security_id, txns);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getStockClassConversionRatio(value: any): number {
    if (value?.is_preferred === false) {
      return 1;
    }
    return this.ratioCalculator.findRatio(value.id).ratio;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getConversionCommonStockClass(value: any): any {
    if (value?.is_preferred === false) {
      return value;
    }
    const path = this.ratioCalculator.findRatio(value.id).path;
    const stockClass = path[path.length - 1];
    return {
      display_name: stockClass.name,
      is_preferred: false,
      board_approval_date: null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getStockClassRoundingType(value: any): string {
    const mechanism = Array.of(value).flat()[0]?.conversion_mechanism;
    const roundingType = mechanism?.rounding_type || "NORMAL";
    return roundingType;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getStockClassIdForWarrant(value: any): string | undefined {
    for (const trigger of value.exercise_triggers) {
      if (trigger?.conversion_right?.converts_to_stock_class_id !== undefined) {
        return trigger.conversion_right.converts_to_stock_class_id;
      }
    }
    return undefined;
  }
}

export default Model;
