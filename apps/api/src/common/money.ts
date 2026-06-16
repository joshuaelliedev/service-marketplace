export type PricingBreakdown = {
  basePriceCents: number;
  companyFeeCents: number;
  vatFeeCents: number;
  serviceFeeCents: number;
  customerTotalCents: number;
};

/** Service fee = company% + VAT% of base listing price only. */
export function computePricingCents(
  basePriceCents: number,
  companyFeePercent: number,
  vatFeePercent: number,
): PricingBreakdown {
  const companyFeeCents = Math.round((basePriceCents * companyFeePercent) / 100);
  const vatFeeCents = Math.round((basePriceCents * vatFeePercent) / 100);
  const serviceFeeCents = companyFeeCents + vatFeeCents;
  return {
    basePriceCents,
    companyFeeCents,
    vatFeeCents,
    serviceFeeCents,
    customerTotalCents: basePriceCents + serviceFeeCents,
  };
}
