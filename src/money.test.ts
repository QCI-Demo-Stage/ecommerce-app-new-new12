import { formatMoney, sumMoney, type Money } from './money';

describe('money', () => {
  it('formats cents as USD currency', () => {
    expect(formatMoney({ amountCents: 1999, currency: 'USD' })).toBe('$19.99');
    expect(formatMoney({ amountCents: 0, currency: 'USD' })).toBe('$0.00');
  });

  it('sums money of the same currency', () => {
    const values: Money[] = [
      { amountCents: 1000, currency: 'USD' },
      { amountCents: 250, currency: 'USD' },
    ];
    expect(sumMoney(values)).toEqual({ amountCents: 1250, currency: 'USD' });
  });

  it('returns zero for an empty list', () => {
    expect(sumMoney([])).toEqual({ amountCents: 0, currency: 'USD' });
  });

  it('throws when currencies differ', () => {
    expect(() =>
      sumMoney([
        { amountCents: 100, currency: 'USD' },
        { amountCents: 100, currency: 'EUR' },
      ]),
    ).toThrow('Currency mismatch');
  });
});
