import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Card } from '../Card';
import { Input } from '../Input';
import { Navigation } from '../Navigation';
import { Layout } from './Layout';

const header = (
  <Navigation
    brand="Ecommerce App New"
    items={[
      { id: 'catalog', label: 'Catalog', href: '#catalog', current: true },
      { id: 'cart', label: 'Cart', href: '#cart' },
      { id: 'account', label: 'Account', href: '#account' },
    ]}
  />
);

const footer = <p>Safe-area aware footer · © Ecommerce App New</p>;

const content = (
  <>
    <Card
      title="Featured"
      subtitle="Responsive grid column span"
      footer={<Button>Shop now</Button>}
    >
      Layout uses a mobile-first CSS grid that expands from 4 to 8 to 12 columns.
    </Card>
    <Card title="Newsletter">
      <Input label="Email" placeholder="you@example.com" hint="One update per week" />
    </Card>
  </>
);

const meta = {
  title: 'Layout/BaseLayout',
  component: Layout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // Visual regression: capture mobile, tablet, and desktop
    chromatic: {
      viewports: [375, 768, 1280],
      delay: 150,
    },
  },
  args: {
    header,
    footer,
    children: content,
  },
} satisfies Meta<typeof Layout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Visual regression target — mobile (375px) */
export const MobileBreakpoint: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile' },
    chromatic: { viewports: [375] },
  },
};

/** Visual regression target — tablet (768px) */
export const TabletBreakpoint: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    chromatic: { viewports: [768] },
  },
};

/** Visual regression target — desktop (1280px) */
export const DesktopBreakpoint: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    chromatic: { viewports: [1280] },
  },
};
