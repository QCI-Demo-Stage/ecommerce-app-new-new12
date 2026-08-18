import type { Meta, StoryObj } from '@storybook/react-vite';
import { Navigation } from './Navigation';

const meta = {
  title: 'Components/Navigation',
  component: Navigation,
  tags: ['autodocs'],
  args: {
    brand: 'Ecommerce App New',
    items: [
      { id: 'catalog', label: 'Catalog', href: '#catalog', current: true },
      { id: 'cart', label: 'Cart', href: '#cart' },
      { id: 'account', label: 'Account', href: '#account' },
    ],
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Navigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile' },
    chromatic: { viewports: [375] },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    chromatic: { viewports: [768] },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    chromatic: { viewports: [1280] },
  },
};
