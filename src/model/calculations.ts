import Big from "big.js";

function convertRatioToDecimalNumber(ratio: {
  numerator: string;
  denominator: string;
}) {
  const quotient = Big(ratio.numerator).div(ratio.denominator);
  return quotient;
}

// Reference: https://docs.google.com/document/d/19iVTJfJxIMr_gQHzMgSAHR6PhCBFEHg0TahjYc8uOac/edit#heading=h.fiexe0ua8jk7
class OutstandingStockSharesCalculator {
  private value_: Big = Big("0");
  private issuanceAmounts_: Map<string, string> = new Map();
  private reissuedSecurityIds_: Set<string> = new Set();

  public get value() {
    for (const reissuedSecurityId of this.reissuedSecurityIds_) {
      const reissuedAmount = this.issuanceAmounts_.get(reissuedSecurityId);
      if (reissuedAmount !== undefined) {
        this.issuanceAmounts_.delete(reissuedSecurityId);
        this.reissuedSecurityIds_.delete(reissuedSecurityId);
        this.value_ = this.value_.minus(reissuedAmount);
      } else {
        // TODO: Interesting question here; log? raise error? save the reissuance for "later"?
      }
    }

    return this.value_.toNumber();
  }

  public apply(txn: {
    object_type: string;
    security_id: string;
    quantity?: string;
    quantity_converted?: string;
  }) {
    const operand = txn.quantity ?? txn.quantity_converted ?? "0";

    if (txn.object_type === "TX_STOCK_ISSUANCE") {
      this.value_ = this.value_.plus(operand);
      this.issuanceAmounts_.set(txn.security_id, operand);
    } else if (txn.object_type === "TX_STOCK_REISSUANCE") {
      this.reissuedSecurityIds_.add(txn.security_id);
    } else {
      this.value_ = this.value_.minus(operand);
    }
  }
}

export default {
  convertRatioToDecimalNumber,
  OutstandingStockSharesCalculator,
};
