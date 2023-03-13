import Big from "big.js";

function convertRatioToDecimalNumber(ratio: {
  numerator: string;
  denominator: string;
}) {
  const quotient = Big(ratio.numerator).div(ratio.denominator);
  return quotient;
}

export default {
  convertRatioToDecimalNumber,
};
