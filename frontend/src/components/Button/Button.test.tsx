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

  it('supports variants and disabled state', () => {
    render(
      <Button variant="danger" disabled>
        Delete
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('exposes loading/busy accessibility state', () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
  });

  it('invokes onClick when enabled', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Checkout</Button>);
    await user.click(screen.getByRole('button', { name: 'Checkout' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
