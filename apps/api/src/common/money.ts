export function computePricingCents(
  basePriceCents: number,
  feePercent: number,
  feeFixedCents: number,
): { customerTotalCents: number; platformFeeCents: number } {
  const percentPart = Math.round((basePriceCents * feePercent) / 100);
  const platformFeeCents = percentPart + feeFixedCents;
  return {
    customerTotalCents: basePriceCents + platformFeeCents,
    platformFeeCents,
  };
}
