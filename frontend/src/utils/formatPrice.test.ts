import { formatPrice } from './formatPrice';

describe('formatPrice', () => {
  it('formats integer cents as USD currency', () => {
    expect(formatPrice(1999, 'USD')).toMatch(/19\.99/);
  });

  it('handles zero and invalid values safely', () => {
    expect(formatPrice(0, 'USD')).toMatch(/0\.00/);
    expect(formatPrice(Number.NaN, 'USD')).toMatch(/0\.00/);
  });
});
