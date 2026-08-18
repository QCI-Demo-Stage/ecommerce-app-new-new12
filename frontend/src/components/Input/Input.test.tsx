import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('associates label with the control', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('links hint text via aria-describedby', () => {
    render(<Input label="Password" hint="At least 8 characters" />);
    const input = screen.getByLabelText('Password');
    const hint = screen.getByText('At least 8 characters');
    expect(input).toHaveAttribute('aria-describedby', hint.id);
  });

  it('announces validation errors accessibly', () => {
    render(<Input label="Email" error="Enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
  });

  it('marks required fields for assistive tech', () => {
    render(<Input label="Name" required />);
    const input = screen.getByLabelText(/Name/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('accepts typed values', async () => {
    const user = userEvent.setup();
    render(<Input label="Search" />);
    const input = screen.getByLabelText('Search');
    await user.type(input, 'shoes');
    expect(input).toHaveValue('shoes');
  });
});
