import Big from "big.js";

function convertRatioToDecimalNumber(ratio: {
  numerator: string;
  denominator: string;
}) {
  const quotient = Big(ratio.numerator).div(ratio.denominator);
  return quotient;
}

class OutstandingStockSharesCalculator {
  private value_: Big = Big("0");

  public get value(): number {
    return this.value_.toNumber();
  }

  public apply(txn: { object_type: string; quantity?: string }) {
    if (txn.quantity) {
      this.value_ = this.value_.plus(txn.quantity);
    }
  }
}

export default {
  convertRatioToDecimalNumber,
  OutstandingStockSharesCalculator,
};
