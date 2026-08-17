export type CurrencyCode = 'USD' | 'EUR';

export interface Money {
  amountCents: number;
  currency: CurrencyCode;
}

export function formatMoney(money: Money): string {
  const dollars = money.amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency,
  }).format(dollars);
}

export function sumMoney(values: Money[]): Money {
  if (values.length === 0) {
    return { amountCents: 0, currency: 'USD' };
  }

  const currency = values[0]?.currency ?? 'USD';
  const amountCents = values.reduce((sum, value) => {
    if (value.currency !== currency) {
      throw new Error('Currency mismatch');
    }
    return sum + value.amountCents;
  }, 0);

  return { amountCents, currency };
}
