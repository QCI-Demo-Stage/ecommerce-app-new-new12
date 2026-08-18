import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Card', () => {
  it('renders title, body, and footer', () => {
    render(
      <Card title="Trail Runner" subtitle="Footwear" footer={<button type="button">Add</button>}>
        Lightweight daily trainer
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Trail Runner' })).toBeInTheDocument();
    expect(screen.getByText('Footwear')).toBeInTheDocument();
    expect(screen.getByText('Lightweight daily trainer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('supports keyboard activation when interactive', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <Card title="Selectable" interactive onClick={onClick}>
        Press enter
      </Card>,
    );
    const card = screen.getByRole('button', { name: /Selectable/i });
    card.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });
});
