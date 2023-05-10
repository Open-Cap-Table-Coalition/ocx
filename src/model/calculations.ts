/* eslint-disable @typescript-eslint/no-explicit-any */
import Big from "big.js";

enum RoundingType {
  CEILING = "CEILING",
  FLOOR = "FLOOR",
  NORMAL = "NORMAL",
}

function convertRatioToDecimalNumber(
  ratio: {
    numerator: string;
    denominator: string;
  },
  roundingType: RoundingType
) {
  const quotient = Big(ratio.numerator).div(ratio.denominator);
  switch (roundingType) {
    case RoundingType.CEILING:
      return Math.ceil(quotient.toNumber());
    case RoundingType.FLOOR:
      return Math.floor(quotient.toNumber());
    case RoundingType.NORMAL:
    default:
      return quotient.toNumber();
  }
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

export class OptionsRemainingCalculator {
  protected value_: Big = Big("0");

  public get value() {
    return this.value_.toNumber();
  }

  public apply(
    initial_shares_reserved: string,
    total_holdings: number,
    adjustments?: Set<any>
  ): void {
    if (adjustments && adjustments.size > 0) {
      const array_of_adjustments = Array.from(adjustments);
      array_of_adjustments.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const shares_reserved = array_of_adjustments[0].shares_reserved;
      this.value_ = new Big(shares_reserved).minus(new Big(total_holdings));
    } else {
      this.value_ = new Big(initial_shares_reserved).minus(
        new Big(total_holdings)
      );
    }
  }
}

const Calculations = {
  convertRatioToDecimalNumber,
  OutstandingStockSharesCalculator,
  OutstandingStockPlanCalculator,
  OptionsRemainingCalculator,
};

export default Calculations;
