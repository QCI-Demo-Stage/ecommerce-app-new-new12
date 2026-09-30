import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Remove item?"
        description="This cannot be undone."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renders an alertdialog and handles confirm / cancel', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmDialog
        open
        title="Remove item?"
        description="Remove Classic Widget from your cart?"
        confirmLabel="Remove"
        cancelLabel="Keep item"
        danger
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const dialog = screen.getByRole('alertdialog', { name: /remove item/i });
    expect(
      within(dialog).getByText(/classic widget/i),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Keep item' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
