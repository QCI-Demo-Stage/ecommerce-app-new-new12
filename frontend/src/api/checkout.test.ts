import { tokenizeCardNumber } from './checkout';

describe('checkout API helpers', () => {
  it('tokenizes card numbers without retaining the full PAN', () => {
    const { paymentToken, cardLast4 } = tokenizeCardNumber('4242 4242 4242 4242');
    expect(cardLast4).toBe('4242');
    expect(paymentToken).toMatch(/^tok_4242_/);
    expect(paymentToken).not.toContain('4242424242424242');
  });
});
