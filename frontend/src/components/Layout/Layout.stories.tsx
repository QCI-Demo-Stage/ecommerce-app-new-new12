import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { Layout } from './Layout';
import { Navigation } from '../Navigation';
import { Card } from '../Card';
import { Button } from '../Button';
import { BREAKPOINTS } from '../../tokens/breakpoints';

const navItems = [
  { id: 'home', label: 'Home', href: '#', current: true },
  { id: 'catalog', label: 'Catalog', href: '#catalog' },
  { id: 'cart', label: 'Cart', href: '#cart' },
];

function DemoContent() {
  return (
    <>
      <Card title="Featured product" subtitle="Catalog" elevated>
        Mobile-first layout with token-driven gutters and grid columns.
      </Card>
      <Card title="Secondary tile" padding="sm">
        Content spans the full responsive grid by default.
      </Card>
    </>
  );
}

const meta: Meta<typeof Layout> = {
  title: 'Layout/BaseLayout',
  component: Layout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    /**
     * Chromatic / visual regression: snapshot each named viewport story.
     * Viewports align with BREAKPOINTS mobile / tablet / desktop.
     */
    chromatic: {
      disableSnapshot: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Layout>;

const sharedArgs = {
  header: (
    <Navigation
      brandLabel="ShopNew"
      items={navItems}
      actions={<Button size="sm">Cart</Button>}
    />
  ),
  footer: <span>© 2026 ShopNew · Safe-area aware layout</span>,
  showBreakpointBadge: true,
  children: <DemoContent />,
};

/**
 * Visual regression — Mobile (default / &lt; 768px)
 */
export const MobileBreakpoint: Story = {
  name: `Mobile (≤${BREAKPOINTS.mobile.max}px)`,
  args: sharedArgs,
  parameters: {
    viewport: { defaultViewport: 'mobile' },
    chromatic: { viewports: [BREAKPOINTS.mobile.max] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('main')).toBeInTheDocument();
    await expect(canvas.getByTestId('breakpoint-badge')).toBeInTheDocument();
  },
};

/**
 * Visual regression — Tablet (≥ 768px)
 */
export const TabletBreakpoint: Story = {
  name: `Tablet (≥${BREAKPOINTS.tablet.min}px)`,
  args: {
    ...sharedArgs,
    aside: (
      <Card title="Filters" padding="sm">
        Category · Price · Rating
      </Card>
    ),
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    chromatic: { viewports: [BREAKPOINTS.tablet.min] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('complementary')).toBeInTheDocument();
  },
};

/**
 * Visual regression — Desktop (≥ 1024px)
 */
export const DesktopBreakpoint: Story = {
  name: `Desktop (≥${BREAKPOINTS.desktop.min}px)`,
  args: {
    ...sharedArgs,
    aside: (
      <Card title="Filters" padding="sm">
        Category · Price · Rating
      </Card>
    ),
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    chromatic: { viewports: [BREAKPOINTS.desktop.min] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('banner')).toBeInTheDocument();
    await expect(canvas.getByRole('contentinfo')).toBeInTheDocument();
  },
};

export const WithoutAside: Story = {
  args: sharedArgs,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
