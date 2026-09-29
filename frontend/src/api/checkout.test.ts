import { createOrder, tokenizeCardNumber } from './checkout';

describe('checkout API helpers', () => {
  it('tokenizeCardNumber never returns the full PAN', () => {
    const { paymentToken, cardLast4 } = tokenizeCardNumber(
      '4242 4242 4242 4242',
    );
    expect(cardLast4).toBe('4242');
    expect(paymentToken).toMatch(/^tok_4242_16_/);
    expect(paymentToken).not.toContain('4242424242424242');
  });

  it('createOrder rejects an empty item list before calling the API', async () => {
    await expect(
      createOrder({
        items: [],
        shipping: {
          fullName: 'Ada',
          line1: '1 Street',
          city: 'London',
          state: 'LDN',
          postalCode: 'SW1A1AA',
          country: 'US',
        },
        payment: {
          method: 'card',
          paymentToken: 'tok_test_1234',
          cardLast4: '4242',
        },
      }),
    ).rejects.toThrow(/cart is empty/i);
  });
});
