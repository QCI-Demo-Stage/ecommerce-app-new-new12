/**
 * Formats integer cents into a localized currency string.
 */
export function formatPrice(priceCents: number, currency = 'USD'): string {
  const safeCents = Number.isFinite(priceCents) ? priceCents : 0;
  const amount = safeCents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `$${(amount).toFixed(2)}`;
  }
}
