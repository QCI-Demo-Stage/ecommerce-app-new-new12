import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from '../Button';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    title: 'Trail Runner Pro',
    subtitle: 'Men · Road',
    children: 'Responsive cushioning for long training blocks.',
    elevated: true,
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {};

export const WithFooter: Story = {
  args: {
    footer: (
      <>
        <Button size="sm">Add to cart</Button>
        <Button size="sm" variant="ghost">
          Details
        </Button>
      </>
    ),
  },
};

export const Interactive: Story = {
  args: {
    interactive: true,
    title: 'Browse jackets',
    children: 'Keyboard-focusable product category card.',
  },
};

export const Compact: Story = {
  args: {
    padding: 'sm',
    elevated: false,
    title: 'Order #1842',
    children: 'Shipped · Arriving Fri',
  },
};
