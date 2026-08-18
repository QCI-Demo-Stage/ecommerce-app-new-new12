import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('associates label with the control', () => {
    render(<Input label="Email" placeholder="you@example.com" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
  });

  it('announces errors via role=alert and aria-invalid', () => {
    render(<Input label="Password" error="Password is required" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Password is required');
  });

  it('wires hint through aria-describedby', () => {
    render(<Input label="Phone" hint="Include country code" />);
    const input = screen.getByLabelText('Phone');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      'Include country code',
    );
  });

  it('marks required fields for assistive tech', () => {
    render(<Input label="Name" required />);
    expect(screen.getByLabelText(/Name/)).toHaveAttribute('aria-required', 'true');
  });

  it('accepts typed input', async () => {
    const user = userEvent.setup();
    render(<Input label="Search" />);
    const input = screen.getByLabelText('Search');
    await user.type(input, 'shoes');
    expect(input).toHaveValue('shoes');
  });
});
