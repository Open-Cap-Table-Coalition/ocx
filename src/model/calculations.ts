import Big from "big.js";

function convertRatioToDecimalNumber(ratio: {
  numerator: string;
  denominator: string;
}) {
  const quotient = Big(ratio.numerator).div(ratio.denominator);
  return quotient;
}

interface Transaction {
  object_type: string;
  security_id: string;
  quantity?: string;
  quantity_converted?: string;
}

abstract class OutstandingEquityCalculatorBase {
  protected value_: Big = Big("0");
  protected issuanceAmounts_: Map<string, string> = new Map();
  protected pendingSecurityIds_: Set<string> = new Set();

  public get value() {
    for (const pendingSecurity of this.pendingSecurityIds_) {
      const pendingAmount = this.issuanceAmounts_.get(pendingSecurity);
      if (pendingAmount !== undefined) {
        this.issuanceAmounts_.delete(pendingSecurity);
        this.pendingSecurityIds_.delete(pendingSecurity);
        this.value_ = this.value_.minus(pendingAmount);
      } else {
        // TODO: Interesting question here; log? raise error? save the reissuance for "later"?
      }
    }

    return this.value_.toNumber();
  }

  abstract apply(txn: Transaction): void;
}

export class OutstandingStockSharesCalculator extends OutstandingEquityCalculatorBase {
  public apply(txn: Transaction): void {
    const operand = txn.quantity ?? txn.quantity_converted ?? "0";
    if (txn.object_type === "TX_STOCK_ISSUANCE") {
      this.value_ = this.value_.plus(operand);
      this.issuanceAmounts_.set(txn.security_id, operand);
    } else if (txn.object_type === "TX_STOCK_REISSUANCE") {
      this.pendingSecurityIds_.add(txn.security_id);
    } else {
      this.value_ = this.value_.minus(operand);
    }
  }
}

export class OutstandingStockPlanCalculator extends OutstandingEquityCalculatorBase {
  public apply(txn: Transaction): void {
    const operand = txn.quantity ?? txn.quantity_converted ?? "0";
    if (
      txn.object_type === "TX_PLAN_SECURITY_ISSUANCE" ||
      txn.object_type === "TX_EQUITY_COMPENSATION_ISSUANCE"
    ) {
      this.value_ = this.value_.plus(operand);
      this.issuanceAmounts_.set(txn.security_id, operand);
    } else if (
      txn.object_type === "TX_PLAN_SECURITY_RETRACTION" ||
      txn.object_type === "TX_EQUITY_COMPENSATION_RETRACTION"
    ) {
      this.pendingSecurityIds_.add(txn.security_id);
    } else {
      this.value_ = this.value_.minus(operand);
    }
  }
}

const Calculations = {
  convertRatioToDecimalNumber,
  OutstandingStockSharesCalculator,
  OutstandingStockPlanCalculator,
};

export default Calculations;
