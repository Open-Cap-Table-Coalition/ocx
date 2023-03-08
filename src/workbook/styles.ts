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
}

export default Styles;
