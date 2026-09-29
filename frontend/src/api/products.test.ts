import { fetchProductById, fetchProducts } from './products';
import { ApiError } from './client';

describe('products API service', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('requests paginated products with query params', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        page: 2,
        pageSize: 6,
        total: 0,
        totalPages: 1,
      }),
    }) as unknown as typeof fetch;

    await fetchProducts({ page: 2, pageSize: 6, category: 'widgets', q: 'pro' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/products?page=2&pageSize=6&category=widgets&q=pro',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('fetches a single product by id', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'abc-123', name: 'Test' }),
    }) as unknown as typeof fetch;

    await fetchProductById('abc-123');
    expect(global.fetch).toHaveBeenCalledWith(
      '/products/abc-123',
      expect.any(Object),
    );
  });

  it('rejects unsafe product ids', async () => {
    await expect(fetchProductById('../etc/passwd')).rejects.toThrow(
      /invalid product id/i,
    );
  });

  it('maps failed responses to ApiError', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'internal_error', message: 'Boom' }),
    }) as unknown as typeof fetch;

    await expect(fetchProducts()).rejects.toBeInstanceOf(ApiError);
  });
});
