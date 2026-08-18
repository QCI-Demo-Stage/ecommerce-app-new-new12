import { Button, Card, Input, Layout, Navigation } from './components';

const navItems = [
  { id: 'home', label: 'Home', href: '#', current: true },
  { id: 'catalog', label: 'Catalog', href: '#catalog' },
  { id: 'cart', label: 'Cart', href: '#cart' },
  { id: 'account', label: 'Account', href: '#account' },
];

/**
 * Lightweight demo shell showcasing the shared layout + component library.
 */
export function App() {
  return (
    <Layout
      header={
        <Navigation
          brandLabel="ShopNew"
          items={navItems}
          actions={<Button size="sm">Sign in</Button>}
        />
      }
      aside={
        <Card title="Filters" padding="sm">
          Use tablet or desktop widths to see the aside column.
        </Card>
      }
      footer={<span>© 2026 ShopNew — component library demo</span>}
      showBreakpointBadge
    >
      <Card
        title="Welcome to ShopNew"
        subtitle="Shared UI foundation"
        elevated
        footer={<Button>Browse catalog</Button>}
      >
        <p style={{ marginTop: 0 }}>
          This page uses the responsive Layout with mobile-first design tokens,
          safe-area insets, and core components (Button, Input, Card, Navigation).
        </p>
        <Input label="Search products" placeholder="Running shoes" hint="Try a brand or category" />
      </Card>
    </Layout>
  );
}
