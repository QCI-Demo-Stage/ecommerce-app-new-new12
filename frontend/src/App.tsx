import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Navigation } from './components/Navigation';
import { PrivateRoute } from './auth/PrivateRoute';

const CatalogPage = lazy(() =>
  import('./pages/CatalogPage').then((m) => ({ default: m.CatalogPage })),
);
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((m) => ({
    default: m.ProductDetailPage,
  })),
);
const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const OrderHistoryPage = lazy(() =>
  import('./pages/OrderHistoryPage').then((m) => ({
    default: m.OrderHistoryPage,
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
            <Route
              path="/checkout"
              element={
                <PrivateRoute>
                  <CheckoutPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/account"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/account/orders"
              element={
                <PrivateRoute>
                  <OrderHistoryPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}
