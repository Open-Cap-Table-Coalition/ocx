import {
  Model as WorkbookModel,
  StakeholderModel as WorkbookStakeholderModel,
} from "src/workbook/interfaces";

class Model implements WorkbookModel {
  public issuerName = "";
  private stakeholders_: WorkbookStakeholderModel[] = [];

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
  }

  public get stakeholders() {
    return this.stakeholders_;
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
}

export default Model;
