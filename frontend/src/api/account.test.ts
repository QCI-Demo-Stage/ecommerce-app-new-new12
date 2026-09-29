import { fetchProfile, updateProfile, login } from './user';
import { fetchOrders } from './orders';
import { clearTokens, getAccessToken } from '../auth/tokenStorage';

describe('user & orders API clients', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearTokens();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearTokens();
    jest.clearAllMocks();
  });

  it('login stores JWTs from the auth response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Login successful',
        user: {
          id: '1',
          email: 'a@b.com',
          firstName: 'A',
          lastName: 'B',
          role: 'customer',
        },
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        tokenType: 'Bearer',
        expiresIn: '15m',
      }),
    });

    await login('a@b.com', 'password123');
    expect(getAccessToken()).toBe('access-1');
  });

  it('fetchProfile requires an access token', async () => {
    await expect(fetchProfile()).rejects.toMatchObject({
      status: 401,
      code: 'unauthorized',
    });
  });

  it('updateProfile sends PATCH with auth header', async () => {
    sessionStorage.setItem('ecom_access_token', 'tok');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Profile updated',
        user: {
          id: '1',
          email: 'a@b.com',
          firstName: 'Ann',
          lastName: 'Bee',
          role: 'customer',
        },
      }),
    });

    await updateProfile({ firstName: 'Ann', lastName: 'Bee', email: 'a@b.com' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/me',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('fetchOrders requests paginated order history', async () => {
    sessionStorage.setItem('ecom_access_token', 'tok');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        page: 2,
        pageSize: 10,
        total: 0,
        totalPages: 1,
      }),
    });

    await fetchOrders({ page: 2, pageSize: 10 });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/orders?page=2&pageSize=10',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
        }),
      }),
    );
  });
});
