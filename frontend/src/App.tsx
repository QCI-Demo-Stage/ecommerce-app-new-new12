import {
  Button,
  Card,
  Input,
  Layout,
  Navigation,
} from './components';

const navItems = [
  { id: 'catalog', label: 'Catalog', href: '#catalog', current: true },
  { id: 'cart', label: 'Cart', href: '#cart' },
  { id: 'account', label: 'Account', href: '#account' },
];

export default function App() {
  return (
    <Layout
      header={
        <Navigation brand="Ecommerce App New" items={navItems} />
      }
      footer={<p>© {new Date().getFullYear()} Ecommerce App New</p>}
    >
      <Card
        title="Welcome"
        subtitle="Shared UI foundation"
        footer={<Button type="button">Browse catalog</Button>}
      >
        <p>
          This shell demonstrates the component library and responsive base
          layout.
        </p>
        <Input label="Search products" placeholder="Search…" hint="Try a category or SKU" />
      </Card>
    </Layout>
  );
}
