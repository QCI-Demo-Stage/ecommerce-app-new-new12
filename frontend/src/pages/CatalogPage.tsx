import { CatalogGrid } from '../components/CatalogGrid';

/** Product listing page at /products (and /). */
export function CatalogPage() {
  return <CatalogGrid pageSize={12} />;
}
