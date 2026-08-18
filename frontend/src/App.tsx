import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Navigation } from './components/Navigation';

const CatalogPage = lazy(() =>
  import('./pages/CatalogPage').then((m) => ({ default: m.CatalogPage })),
);
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((m) => ({
    default: m.ProductDetailPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

const navItems = [
  { id: 'catalog', label: 'Catalog', href: '/products' },
  { id: 'cart', label: 'Cart', href: '/cart' },
  { id: 'account', label: 'Account', href: '/account' },
];

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Layout
        header={
          <Navigation
            brand="Ecommerce App New"
            brandHref="/products"
            items={navItems}
          />
        }
        footer={<p>© {new Date().getFullYear()} Ecommerce App New</p>}
      >
        <Suspense
          fallback={
            <div role="status" aria-live="polite">
              Loading…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<CatalogPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}
