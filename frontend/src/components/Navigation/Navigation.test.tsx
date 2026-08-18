import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigation } from './Navigation';

const items = [
  { id: 'home', label: 'Home', href: '/', current: true },
  { id: 'catalog', label: 'Catalog', href: '/catalog' },
  { id: 'cart', label: 'Cart', href: '/cart' },
];

describe('Navigation', () => {
  it('renders brand and navigation links with current page', () => {
    render(<Navigation brandLabel="ShopNew" items={items} />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ShopNew' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Catalog' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('toggles the mobile menu with accessible expanded state', async () => {
    const user = userEvent.setup();
    render(<Navigation items={items} />);

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('renders optional actions slot', () => {
    render(
      <Navigation items={items} actions={<button type="button">Sign in</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});
