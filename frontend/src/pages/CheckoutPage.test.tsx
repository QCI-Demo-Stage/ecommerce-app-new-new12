import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from './CheckoutPage';
import {
  CartProvider,
  buildCartState,
  type CartItem,
} from '../cart';

const sampleCartItem: CartItem = {
  productId: 'prod-1',
  name: 'Classic Widget',
  sku: 'WDG-001',
  priceCents: 2499,
  currency: 'USD',
  imageUrl: '/images/products/classic-widget.svg',
  quantity: 2,
};

function renderCheckout(items: CartItem[] = []) {
  return render(
    <CartProvider persist={false} initialState={buildCartState(items)}>
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    </CartProvider>,
  );
}

describe('CheckoutPage', () => {
  it('shows empty state when the cart has no items', () => {
    renderCheckout([]);
    expect(
      screen.getByRole('heading', { name: 'Checkout' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /continue shopping/i }),
    ).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: /view cart/i })).toHaveAttribute(
      'href',
      '/cart',
    );
  });

  it('renders the checkout wizard from live cart lines', () => {
    renderCheckout([sampleCartItem]);
    expect(
      screen.getByRole('heading', { name: 'Checkout' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/complete shipping and payment/i),
    ).toBeInTheDocument();
    // Wizard starts on shipping step
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });
});
