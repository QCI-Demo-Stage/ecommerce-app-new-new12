import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OrderHistoryPage } from './OrderHistoryPage';
import { setTokens, clearTokens } from '../auth/tokenStorage';
import type { Order } from '../api/orders';

function makeOrder(index: number): Order {
  return {
    id: `order-${index}-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
    status: index % 2 === 0 ? 'paid' : 'shipped',
    totalCents: 1000 * (index + 1),
    currency: 'USD',
    itemCount: index + 1,
    createdAt: `2026-0${(index % 9) + 1}-15T12:00:00.000Z`,
    updatedAt: `2026-0${(index % 9) + 1}-15T12:00:00.000Z`,
  };
}

function renderOrders() {
  return render(
    <MemoryRouter>
      <OrderHistoryPage />
    </MemoryRouter>,
  );
}

describe('OrderHistoryPage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearTokens();
    setTokens('test-access-token');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearTokens();
    jest.clearAllMocks();
  });

  it('renders a paginated list of past orders', async () => {
    const page1 = Array.from({ length: 5 }, (_, i) => makeOrder(i));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: page1,
        page: 1,
        pageSize: 5,
        total: 7,
        totalPages: 2,
      }),
    });

    renderOrders();

    await waitFor(() => {
      expect(screen.getByRole('list', { name: /past orders/i })).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/orders?page=1&pageSize=5',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token',
        }),
      }),
    );
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('loads the next page when Next is clicked', async () => {
    const user = userEvent.setup();
    const page1 = Array.from({ length: 5 }, (_, i) => makeOrder(i));
    const page2 = [makeOrder(5), makeOrder(6)];

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: page1,
          page: 1,
          pageSize: 5,
          total: 7,
          totalPages: 2,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: page2,
          page: 2,
          pageSize: 5,
          total: 7,
          totalPages: 2,
        }),
      });

    renderOrders();
    await screen.findByText(/page 1 of 2/i);

    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/orders?page=2&pageSize=5',
      expect.any(Object),
    );
  });

  it('shows empty state when there are no orders', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        page: 1,
        pageSize: 5,
        total: 0,
        totalPages: 1,
      }),
    });

    renderOrders();

    expect(await screen.findByText(/no orders yet/i)).toBeInTheDocument();
  });

  it('shows an API error state with retry', async () => {
    const user = userEvent.setup();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: 'api_error',
          message: 'Orders service unavailable',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [makeOrder(0)],
          page: 1,
          pageSize: 5,
          total: 1,
          totalPages: 1,
        }),
      });

    renderOrders();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not load orders/i,
    );

    await user.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByRole('list', { name: /past orders/i })).toBeInTheDocument();
    });
  });
});
