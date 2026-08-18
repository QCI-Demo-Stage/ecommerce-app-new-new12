import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children and defaults to type=button', () => {
    render(<Button>Add to cart</Button>);
    const button = screen.getByRole('button', { name: 'Add to cart' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('exposes aria-disabled when disabled', () => {
    render(<Button disabled>Checkout</Button>);
    const button = screen.getByRole('button', { name: 'Checkout' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('invokes onClick for enabled buttons', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Buy</Button>);
    await user.click(screen.getByRole('button', { name: 'Buy' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports an explicit accessible name', () => {
    render(
      <Button aria-label="Close dialog">
        <span aria-hidden="true">×</span>
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });
});
