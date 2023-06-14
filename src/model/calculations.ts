/* eslint-disable @typescript-eslint/no-explicit-any */
import Big from "big.js";
import Logger from "../logging";

function convertRatioToDecimalNumber(ratio: {
  numerator: string;
  denominator: string;
}) {
  const quotient = Big(ratio.numerator).div(ratio.denominator);
  return quotient.toNumber();
}

interface Transaction {
  object_type: string;
  security_id: string;
  quantity?: string;
  quantity_converted?: string;
  exercise_triggers?: ExerciseTrigger[];
}

interface ExerciseTrigger {
  conversion_right?: {
    type?: string;
    conversion_mechanism?: {
      type: string;
      converts_to_quantity: string;
    };
    converts_to_stock_class_id?: string;
  };
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

export class WarrantSharesCalculator extends OutstandingEquityCalculatorBase {
  public apply(txn: Transaction): void {
    const operand = this.getQuantity(txn);
    if (txn.object_type === "TX_WARRANT_ISSUANCE") {
      this.value_ = this.value_.plus(operand);
      this.issuanceAmounts_.set(txn.security_id, operand);
    } else if (
      txn.object_type === "TX_WARRANT_RETRACTION" ||
      txn.object_type === "TX_WARRANT_EXERCISE"
    ) {
      this.pendingSecurityIds_.add(txn.security_id);
    } else {
      this.value_ = this.value_.minus(operand);
    }
  }

  public getQuantity(txn: Transaction): string {
    if (txn.quantity !== undefined) {
      return txn.quantity;
    }
    if (txn.exercise_triggers !== undefined) {
      for (const trigger of txn.exercise_triggers) {
        if (
          trigger?.conversion_right?.conversion_mechanism
            ?.converts_to_quantity !== undefined
        ) {
          return trigger.conversion_right.conversion_mechanism
            .converts_to_quantity;
        }
      }
    }
    return "0";
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

interface StockClass {
  object_type: string;
  id: string;
  name: string;
  class_type: string;
  votes_per_share?: number;
  conversion_rights?: StockClassConversionRight[];
}

interface StockClassConversionRight {
  conversion_mechanism: {
    type: string;
    ratio: {
      numerator: string;
      denominator: string;
    };
  };
  rounding_type?: string;
  converts_to_stock_class_id?: string;
}

export class ConversionRatioCalculator {
  private stockClasses: StockClass[] = [];

  public findRatio(preferredStockClassId: string): {
    ratio: number;
    lowestVotesPerShare: number;
    path: StockClass[];
  } {
    const visited: Set<string> = new Set();
    let lowestVotesPerShare = Infinity;
    let path: StockClass[] = [];

    // Find the root Preferred Stock Class
    const rootPreferredStockClass = this.stockClasses.find(
      (cls) =>
        cls.id === preferredStockClassId && cls.class_type === "PREFERRED"
    );
    if (rootPreferredStockClass === undefined) {
      throw new Error("Preferred Stock Class not found.");
    }

    const queue: { stockClass: StockClass; currentPath: StockClass[] }[] = [
      { stockClass: rootPreferredStockClass, currentPath: [] },
    ];

    // multiple conversion rights
    while (queue.length > 0) {
      const dequeuedClass = queue.shift();
      if (dequeuedClass) {
        const { stockClass, currentPath } = dequeuedClass;
        if (!visited.has(stockClass.id)) {
          visited.add(stockClass.id);
          const updatedPath = [...currentPath, stockClass];
          // if class is common
          if (
            stockClass.class_type === "COMMON" &&
            stockClass?.votes_per_share &&
            stockClass.votes_per_share > 0 &&
            stockClass.votes_per_share < lowestVotesPerShare
          ) {
            lowestVotesPerShare = stockClass.votes_per_share;
            // update path
            path = updatedPath;
          }
          // If class is preferred and has "children"
          if (
            stockClass?.class_type === "PREFERRED" &&
            stockClass?.conversion_rights &&
            stockClass?.conversion_rights.length > 0
          ) {
            for (const conversionRight of stockClass.conversion_rights) {
              if (
                conversionRight.converts_to_stock_class_id &&
                !visited.has(conversionRight.converts_to_stock_class_id)
              ) {
                const nextStockClass =
                  conversionRight.converts_to_stock_class_id
                    ? this.stockClasses.find(
                        (cls) =>
                          cls.id === conversionRight.converts_to_stock_class_id
                      )
                    : null;
                if (nextStockClass) {
                  queue.push({
                    stockClass: nextStockClass,
                    currentPath: updatedPath,
                  });
                }
              }
            }
          }
        }
      }
    } // end while
    if (lowestVotesPerShare !== Infinity) {
      //path length will always be 2 or more
      const ratio = this.getFinalRatio(path);
      return { ratio, lowestVotesPerShare, path };
    } else {
      Logger.error("Error: no conversion class");
      return { ratio: 1, lowestVotesPerShare, path };
    }
  }
  public apply(stockClass: StockClass): void {
    this.stockClasses.push(stockClass);
  }

  private getFinalRatio(path: StockClass[]): number {
    const ratios = [];
    let info = "Converted from";
    for (const stockClass of path) {
      info += ` ${stockClass.name} ${
        path.indexOf(stockClass) < path.length - 1 ? ">" : ""
      }`;
      if (stockClass.class_type === "COMMON") {
        const index = path.indexOf(stockClass);
        const preferredClass = path[index - 1];
        const conversionRight = preferredClass.conversion_rights?.find(
          (cls) => cls.converts_to_stock_class_id === stockClass.id
        );
        const ratioObject = conversionRight?.conversion_mechanism?.ratio;
        const ratio =
          ratioObject !== undefined
            ? Calculations.convertRatioToDecimalNumber(ratioObject)
            : 1;
        ratios.push(ratio);
      }
    }

    const finalRatio: number = ratios.reduce(
      (accumulator, currentValue) => accumulator * currentValue
    );
    Logger.info(`${info} at ${finalRatio}`);
    return finalRatio;
  }
}

const Calculations = {
  convertRatioToDecimalNumber,
  OutstandingStockSharesCalculator,
  OutstandingStockPlanCalculator,
  OptionsRemainingCalculator,
  ConversionRatioCalculator,
  WarrantSharesCalculator,
};

export default Calculations;
