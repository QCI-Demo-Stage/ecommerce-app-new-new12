import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProductDetailPage } from './ProductDetailPage';
import type { Product } from '../api/products';
import {
  CART_STORAGE_KEY,
  CartProvider,
  createEmptyCart,
} from '../cart';

const mockProduct: Product = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  sku: 'WDG-001',
  name: 'Classic Widget',
  description: 'Everyday widget for home and office.',
  priceCents: 1999,
  currency: 'USD',
  category: 'widgets',
  imageUrl: '/images/products/classic-widget.svg',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderDetail(id = mockProduct.id) {
  return render(
    <CartProvider persist initialState={createEmptyCart()}>
      <MemoryRouter initialEntries={[`/products/${id}`]}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products" element={<div>Catalog</div>} />
        </Routes>
      </MemoryRouter>
    </CartProvider>,
  );
}

describe('ProductDetailPage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    class MockIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: ReadonlyArray<number> = [];
      constructor(cb: IntersectionObserverCallback) {
        queueMicrotask(() =>
          cb(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          ),
        );
      }
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

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProduct,
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('loads product detail from the route param and exposes accessible labels', async () => {
    renderDetail();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Classic Widget' }),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/products/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      expect.any(Object),
    );

    expect(
      screen.getByRole('img', { name: /product photo of classic widget/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/everyday widget for home and office/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price \$19\.99/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add classic widget to cart/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('adds the product to Cart context and announces for screen readers', async () => {
    const user = userEvent.setup();
    renderDetail();

    await screen.findByRole('heading', { name: 'Classic Widget' });
    await user.click(
      screen.getByRole('button', { name: /add classic widget to cart/i }),
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      /classic widget added to cart/i,
    );

    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string) as {
      items: Array<{ productId: string; quantity: number }>;
    };
    expect(parsed.items[0].productId).toBe(mockProduct.id);
    expect(parsed.items[0].quantity).toBe(1);
  });

  it('shows not found when the API returns 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'not_found', message: 'Product not found' }),
    }) as unknown as typeof fetch;

    renderDetail('missing-id');

    expect(await screen.findByRole('alert')).toHaveTextContent(/product not found/i);
    expect(screen.getByRole('link', { name: /back to catalog/i })).toHaveAttribute(
      'href',
      '/products',
    );
  });
});
