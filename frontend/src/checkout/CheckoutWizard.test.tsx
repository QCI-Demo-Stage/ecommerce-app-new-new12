import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { setTokens, clearTokens } from '../auth/tokenStorage';
import {
  CheckoutWizard,
  CHECKOUT_PERF_BUDGET_MS,
} from '../checkout/CheckoutWizard';
import type { CheckoutItem } from '../checkout/types';

const line: CheckoutItem = {
  productId: 'prod-1',
  name: 'Classic Widget',
  sku: 'WDG-001',
  priceCents: 2500,
  currency: 'USD',
  quantity: 1,
};

function renderWizard(items: CheckoutItem[] = [line]) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
  );
  return render(<CheckoutWizard items={items} currency="USD" />, {
    wrapper: Wrapper,
  });
}

async function fillShipping(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace');
  await user.type(screen.getByLabelText(/address line 1/i), '123 Analytical Way');
  await user.type(screen.getByLabelText(/^city/i), 'London');
  await user.type(screen.getByLabelText(/state/i), 'LDN');
  await user.type(screen.getByLabelText(/postal code/i), 'SW1A1AA');
  const country = screen.getByLabelText(/^country/i);
  await user.clear(country);
  await user.type(country, 'US');
  await user.click(
    screen.getByRole('button', { name: /continue to payment/i }),
  );
}

async function fillPayment(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/name on card/i), 'Ada Lovelace');
  await user.type(screen.getByLabelText(/card number/i), '4242424242424242');
  await user.type(screen.getByLabelText(/expiry/i), '12/30');
  await user.type(screen.getByLabelText(/^cvc/i), '123');
  await user.click(
    screen.getByRole('button', { name: /continue to review/i }),
  );
}

describe('CheckoutWizard', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearTokens();
    setTokens('test-access-token');
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearTokens();
    jest.clearAllMocks();
  });

  it('shows empty state when there are no items', () => {
    renderWizard([]);
    expect(screen.getByText(/nothing to check out/i)).toBeInTheDocument();
  });

  it('validates shipping before advancing', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(
      screen.getByRole('button', { name: /continue to payment/i }),
    );

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /shipping address/i })).toBeInTheDocument();
  });

  it('places an order under the 2s budget and shows confirmation', async () => {
    const user = userEvent.setup();
    const orderId = 'order-abc-123';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Order placed successfully',
        order: {
          id: orderId,
          status: 'paid',
          totalCents: 2500,
          currency: 'USD',
          itemCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: [
            {
              productId: line.productId,
              name: line.name,
              sku: line.sku,
              priceCents: line.priceCents,
              quantity: line.quantity,
            },
          ],
          shipping: {
            fullName: 'Ada Lovelace',
            line1: '123 Analytical Way',
            city: 'London',
            state: 'LDN',
            postalCode: 'SW1A1AA',
            country: 'US',
          },
          payment: { method: 'card', cardLast4: '4242' },
        },
        meta: { processingMs: 12 },
      }),
    });

    renderWizard();
    await fillShipping(user);
    expect(
      await screen.findByRole('heading', { name: /^payment$/i }),
    ).toBeInTheDocument();

    await fillPayment(user);
    expect(
      await screen.findByRole('heading', { name: /review order/i }),
    ).toBeInTheDocument();

    const started = performance.now();
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /order confirmed/i }),
      ).toBeInTheDocument();
    });
    const elapsed = performance.now() - started;
    expect(elapsed).toBeLessThan(CHECKOUT_PERF_BUDGET_MS);

    expect(screen.getByText(orderId)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/orders',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token',
        }),
      }),
    );

    const [, init] = (global.fetch as jest.Mock).mock.calls.find(
      (call: unknown[]) => call[0] === '/api/orders',
    ) as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      payment: { paymentToken: string; cardLast4?: string };
    };
    expect(body.payment.cardLast4).toBe('4242');
    expect(body.payment.paymentToken).toMatch(/^tok_/);
    // Full PAN must never be submitted
    expect(JSON.stringify(body)).not.toContain('4242424242424242');
  });

  it('surfaces API errors on the review step', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'internal_error',
        message: 'An unexpected error occurred',
      }),
    });

    renderWizard();
    await fillShipping(user);
    await fillPayment(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(
      await screen.findByText(/an unexpected error occurred/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /review order/i }),
    ).toBeInTheDocument();
  });
});
