import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CatalogGrid } from './CatalogGrid';
import type { ProductListResponse } from '../../api/products';

const mockProducts: ProductListResponse = {
  items: [
    {
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
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      sku: 'WDG-002',
      name: 'Pro Widget',
      description: 'Heavy-duty widget with extended warranty.',
      priceCents: 4999,
      currency: 'USD',
      category: 'widgets',
      imageUrl: '/images/products/pro-widget.svg',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  page: 1,
  pageSize: 12,
  total: 2,
  totalPages: 1,
};

describe('CatalogGrid', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProducts,
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('fetches products and renders accessible product cards', async () => {
    render(
      <MemoryRouter>
        <CatalogGrid />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(/loading products/i);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /product catalog/i }),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/products?'),
      expect.any(Object),
    );

    const widgetLink = await screen.findByRole('link', {
      name: /view details for classic widget/i,
    });
    expect(widgetLink).toHaveAttribute(
      'href',
      '/products/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    );

    const image = screen.getByAltText(/classic widget — widgets/i);
    expect(image).toBeInTheDocument();
  });

  it('shows an error state with retry when the API fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'internal_error', message: 'Server down' }),
    }) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CatalogGrid />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/server down/i);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProducts,
    });

    await user.click(screen.getByRole('button', { name: /retry loading products/i }));

    expect(
      await screen.findByRole('heading', { name: /product catalog/i }),
    ).toBeInTheDocument();
  });
});
