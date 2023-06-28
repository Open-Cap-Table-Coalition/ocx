import { Borders, Fill, Font, Style } from "exceljs";

class Styles {
  public static get header(): Partial<Style> {
    return {
      fill: Styles.headerFill,
      font: Styles.headerFont,
      border: Styles.headerBorder,
    };
  }

  public static get header__date(): Partial<Style> {
    return {
      ...Styles.header,
      alignment: { vertical: "bottom", horizontal: "right" },
      numFmt: '"As of "yyyy.mm.dd',
    };
  }

  public static get header__title(): Partial<Style> {
    return {
      ...Styles.header,
      alignment: { vertical: "middle", horizontal: "left" },
    };
  }

  public static get subheader(): Partial<Style> {
    return {
      fill: Styles.subheaderFill,
      font: Styles.subheaderFont,
      border: Styles.subheaderBorder,
      alignment: { vertical: "bottom", horizontal: "center", wrapText: true },
    };
  }

  public static get footer(): Partial<Style> {
    return {
      fill: Styles.subheaderFill,
      font: Styles.subheaderFont,
      border: Styles.headerBorder,
      numFmt: Styles.default.numFmt,
    };
  }

  public static get text(): Partial<Style> {
    return {
      fill: { type: "pattern", pattern: "none" },
      font: {
        name: "Calibri",
        bold: false,
        color: { argb: "000000" },
        size: 10,
      },
      border: {},
      alignment: {},
    };
  }

  public static get default(): Partial<Style> {
    return {
      ...Styles.text,
      numFmt: '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)',
    };
  }

  public static get default__percentage(): Partial<Style> {
    return {
      ...Styles.default,
      numFmt: "0.00%;[Red]-0.00%;-;@",
    };
  }

  public static get footer__percentage(): Partial<Style> {
    return {
      ...Styles.footer,
      numFmt: "0.00%",
    };
  }

  public static withLeftHandBorder(style: Partial<Style>) {
    const result = style;
    result.border ||= {};
    result.border.left ||= {};
    result.border.left.style = "thin";
    return result;
  }

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
