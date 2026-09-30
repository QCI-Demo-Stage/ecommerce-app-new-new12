import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Navigation } from './Navigation';

const items = [
  { id: 'home', label: 'Home', href: '/', current: true },
  { id: 'cart', label: 'Cart', href: '/cart' },
];

function renderNav(
  ui: React.ReactElement,
  initialEntries: string[] = ['/'],
) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

describe('Navigation', () => {
  it('exposes a labeled navigation landmark', () => {
    renderNav(<Navigation brand="Shop" items={items} />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/');
  });

  it('marks the current page with aria-current', () => {
    renderNav(<Navigation brand="Shop" items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Cart' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('toggles the mobile menu with aria-expanded', async () => {
    const user = userEvent.setup();
    renderNav(<Navigation brand="Shop" items={items} />);
    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
