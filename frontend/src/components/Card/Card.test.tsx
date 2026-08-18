import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders title, body, and footer', () => {
    render(
      <Card title="Trail Runner" subtitle="Lightweight" footer={<span>Shop now</span>}>
        Ideal for daily miles.
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Trail Runner' })).toBeInTheDocument();
    expect(screen.getByText('Lightweight')).toBeInTheDocument();
    expect(screen.getByText('Ideal for daily miles.')).toBeInTheDocument();
    expect(screen.getByText('Shop now')).toBeInTheDocument();
  });

  it('supports interactive keyboard focus semantics', () => {
    render(
      <Card title="Focusable card" interactive>
        Details
      </Card>,
    );

    const card = screen.getByRole('button', { name: /Focusable card/i });
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('defaults to an article landmark', () => {
    render(<Card title="Article card">Body</Card>);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
