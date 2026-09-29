import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { clearTokens, setTokens } from './tokenStorage';

function renderProtected(initialPath = '/account') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/account"
          element={
            <PrivateRoute>
              <h1>Protected profile</h1>
            </PrivateRoute>
          }
        />
        <Route path="/products" element={<div>Catalog</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PrivateRoute', () => {
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

  it('renders children when a JWT is present', () => {
    setTokens('test-access-token');
    renderProtected();
    expect(
      screen.getByRole('heading', { name: 'Protected profile' }),
    ).toBeInTheDocument();
  });

  it('shows unauthenticated fallback when JWT is missing', () => {
    renderProtected();
    expect(
      screen.getByRole('heading', { name: /sign in required/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('signs in via the fallback form and reveals the protected page', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Login successful',
        user: {
          id: 'user-1',
          email: 'ada@example.com',
          firstName: 'Ada',
          lastName: 'Lovelace',
          role: 'customer',
        },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        expiresIn: '15m',
      }),
    });

    renderProtected();

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Protected profile' }),
      ).toBeInTheDocument();
    });

    expect(sessionStorage.getItem('ecom_access_token')).toBe('new-access-token');
  });

  it('surfaces API errors on failed sign-in', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'unauthorized',
        message: 'Invalid email or password',
      }),
    });

    renderProtected();

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /invalid email or password/i,
    );
  });
});
