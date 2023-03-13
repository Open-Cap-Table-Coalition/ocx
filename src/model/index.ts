import {
  Model as WorkbookModel,
  StakeholderModel,
  StockClassModel,
} from "src/workbook/interfaces";

import Calculations from "./calculations";

class Model implements WorkbookModel {
  public issuerName = "";
  private stakeholders_: StakeholderModel[] = [];
  private stockClasses_: StockClassModel[] = [];

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
  }

  public get stakeholders() {
    return this.stakeholders_;
  }

  public get stockClasses() {
    return this.stockClasses_;
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
      display_name: value?.name?.legal_name || " - ",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private STOCK_CLASS(value: any) {
    const conversion_ratio = this.getStockClassConversionRatio(
      value?.conversion_rights
    );

    this.stockClasses_.push({
      id: value?.id,
      display_name: value?.name,
      is_preferred: value?.class_type !== "COMMON",
      conversion_ratio,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getStockClassConversionRatio(value: any): number {
    const mechanism = Array.of(value).flat()[0]?.conversion_mechanism;
    if (mechanism?.ratio === null || mechanism?.type !== "RATIO_CONVERSION") {
      return 1;
    }

    // TODO: The toNumber call here is necessary because we have `number` on the
    // interface between the model and the workbook. However, we should probably
    // look at putting the `Big` types directly on the interface to avoid
    // precision loss.
    return Calculations.convertRatioToDecimalNumber(mechanism.ratio).toNumber();
  }
}

export default Model;
