import { Borders, Fill, Font } from "exceljs";

class Styles {
  public static get headerFill(): Fill {
    return {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2a39c4" },
    };
  }

  public static get headerFont(): Partial<Font> {
    return {
      name: "Calibri",
      bold: true,
      color: { argb: "ffffff" },
      size: 10,
    };
  }

  public static get headerBorder(): Partial<Borders> {
    return {
      top: { style: "thin" },
      bottom: { style: "double" },
    };
  }

  public static get subheaderFill(): Fill {
    return {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ddebf7" },
    };
  }

  public static get subheaderFont(): Partial<Font> {
    return {
      name: "Calibri",
      bold: true,
      color: { argb: "000000" },
      size: 10,
    };
  }

  public static get subheaderBorder(): Partial<Borders> {
    return {
      bottom: { style: "thin" },
    };
  }
}

export default Styles;
