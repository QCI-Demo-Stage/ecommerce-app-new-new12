import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { setTokens, clearTokens } from '../auth/tokenStorage';
import type { PublicUser } from '../api/user';

const mockUser: PublicUser = {
  id: 'user-1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  role: 'customer',
};

function renderProfile() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe('ProfilePage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearTokens();
    setTokens('test-access-token');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearTokens();
    jest.clearAllMocks();
  });

  it('loads profile fields from GET /api/me', async () => {
    renderProfile();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Ada')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token',
        }),
      }),
    );
    expect(screen.getByDisplayValue('Lovelace')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ada@example.com')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Account' })).toBeInTheDocument();
  });

  it('validates required fields before saving', async () => {
    const user = userEvent.setup();
    renderProfile();
    await screen.findByDisplayValue('Ada');

    await user.clear(screen.getByLabelText(/first name/i));
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /first name is required/i,
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('saves profile via PATCH /api/me', async () => {
    const user = userEvent.setup();
    const updated = {
      ...mockUser,
      firstName: 'Augusta',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Profile updated', user: updated }),
      });

    renderProfile();
    await screen.findByDisplayValue('Ada');

    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Augusta');
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/profile saved/i);
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/me',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          firstName: 'Augusta',
          lastName: 'Lovelace',
          email: 'ada@example.com',
        }),
      }),
    );
  });

  it('shows an API error state when profile load fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'internal_error',
        message: 'An unexpected error occurred',
      }),
    });

    renderProfile();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not load profile/i,
    );
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });
});
