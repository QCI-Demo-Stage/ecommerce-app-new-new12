import type { Meta, StoryObj } from '@storybook/react';
import { Navigation } from './Navigation';
import { Button } from '../Button';

const defaultItems = [
  { id: 'home', label: 'Home', href: '#', current: true },
  { id: 'catalog', label: 'Catalog', href: '#catalog' },
  { id: 'deals', label: 'Deals', href: '#deals' },
  { id: 'account', label: 'Account', href: '#account' },
];

const meta: Meta<typeof Navigation> = {
  title: 'Components/Navigation',
  component: Navigation,
  tags: ['autodocs'],
  args: {
    brandLabel: 'ShopNew',
    items: defaultItems,
    actions: <Button size="sm">Sign in</Button>,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '0.75rem 1rem',
          background: 'var(--color-surface-raised)',
          borderBottom: '1px solid var(--color-border-default)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Navigation>;

export const Default: Story = {};

export const MobileMenu: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile' },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
