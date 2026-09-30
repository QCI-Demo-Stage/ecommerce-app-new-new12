import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { CartProvider, buildCartState, type CartItem } from '../cart';
import { CartPage } from './CartPage';

const line: CartItem = {
  productId: 'prod-1',
  name: 'Classic Widget',
  sku: 'WDG-001',
  priceCents: 2000,
  currency: 'USD',
  imageUrl: '/images/products/classic-widget.svg',
  quantity: 2,
};

function mockIntersectionObserver() {
  class MockIntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
    takeRecords = () => [];
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}

function renderCart(items: CartItem[] = [line]) {
  mockIntersectionObserver();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <CartProvider persist={false} initialState={buildCartState(items)}>
      <MemoryRouter>{children}</MemoryRouter>
    </CartProvider>
  );
  return render(<CartPage />, { wrapper: Wrapper });
}

describe('CartPage', () => {
  it('shows empty state when the cart has no items', () => {
    renderCart([]);
    expect(screen.getByRole('heading', { name: 'Your cart' })).toBeInTheDocument();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /continue shopping/i }),
    ).toHaveAttribute('href', '/products');
  });

  it('renders line items and updates totals when quantity changes', async () => {
    const user = userEvent.setup();
    renderCart();

    expect(screen.getByText(/2 items/i)).toBeInTheDocument();
    const qty = screen.getByRole('spinbutton', {
      name: /quantity for classic widget/i,
    });
    expect(qty).toHaveValue(2);

    await user.click(qty);
    await user.keyboard('{Control>}a{/Control}{4}');

    expect(await screen.findByText(/4 items/i)).toBeInTheDocument();
  });

  it('confirms before removing a line item', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(
      screen.getByRole('button', { name: /remove classic widget from cart/i }),
    );

    const dialog = screen.getByRole('alertdialog', { name: /remove item/i });
    expect(within(dialog).getByText(/classic widget/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});
