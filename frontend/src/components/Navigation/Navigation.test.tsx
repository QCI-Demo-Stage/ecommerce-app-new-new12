import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from './Navigation';

const items = [
  { id: 'home', label: 'Home', href: '/', current: true },
  { id: 'cart', label: 'Cart', href: '/cart' },
];

describe('Navigation', () => {
  it('exposes a labeled navigation landmark', () => {
    render(<Navigation brand="Shop" items={items} />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/');
  });

  it('marks the current page with aria-current', () => {
    render(<Navigation brand="Shop" items={items} />);
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
    render(<Navigation brand="Shop" items={items} />);
    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
