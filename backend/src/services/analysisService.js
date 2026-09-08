// Two decimal places for tidy money, e.g. 4.564 -> 4.56.
function round(value) {
  return Math.round(value * 100) / 100;
}

// THE MATH TRUTH. This is the only place money is calculated.
// The AI never does this. Example: Milk sells at Rs 50, costs Rs 48,
// so a 20% discount (Rs 10 off) makes the new profit 40 - 48 = -Rs 8.
export function analyzeOffer({ sellingPrice, costPrice, discountType, discountValue }) {
  // --- Step 1: the numbers BEFORE the offer --------------------------

  // What the customer normally pays.
  const originalPrice = round(sellingPrice);

  // How much the shop keeps on one sale.
  const originalProfit = round(sellingPrice - costPrice);

  // Profit as a percentage of the price.
  const originalMarginPercent = round(sellingPrice > 0 ? (originalProfit / sellingPrice) * 100 : 0);

  // --- Step 2: the numbers AFTER the offer ---------------------------

  // How much money is taken off (percent of price, or fixed rupees).
  const discountAmount = round(
    discountType === 'percentage'
      ? (sellingPrice * discountValue) / 100
      : discountValue
  );

  // The price the customer actually pays.
  const finalPrice = round(sellingPrice - discountAmount);

  // What profit the shop keeps after the discount.
  const newProfit = round(finalPrice - costPrice);

  // How much of the original profit the offer eats up.
  const profitReduction = round(originalProfit - newProfit);

  // The same reduction as a percentage.
  const profitReductionPercent =
    Math.abs(originalProfit) < 0.005
      ? profitReduction === 0 ? 0 : 100
      : round((profitReduction / originalProfit) * 100);

  // The new margin percentage.
  const newMarginPercent = round(finalPrice > 0 ? (newProfit / finalPrice) * 100 : 0);

  // --- Step 3: decide the verdict ------------------------------------

  // Start by assuming the offer is fine, then tighten the rules.
  let status = 'GOOD';
  if (newProfit < 0) {
    // The shop loses money on every sale.
    status = 'LOSS';
  } else if (newProfit === 0 || profitReductionPercent >= 50) {
    // Zero profit, or half or more of the profit is gone.
    status = 'RISKY';
  }

  // --- Step 4: reference numbers for the AI --------------------------

  // The biggest discount that avoids a loss.
  const safeMaxDiscountAmount = round(Math.max(originalProfit, 0));
  const safeMaxDiscountPercent = round(
    sellingPrice > 0 ? (safeMaxDiscountAmount / sellingPrice) * 100 : 0
  );

  // Send every number back in one tidy package.
  return {
    originalPrice,
    originalProfit,
    originalMarginPercent,
    discountAmount,
    finalPrice,
    newProfit,
    profitReduction,
    profitReductionPercent,
    newMarginPercent,
    status,
    safeMaxDiscountAmount,
    safeMaxDiscountPercent,
  };
}