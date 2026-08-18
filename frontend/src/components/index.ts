export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Navigation } from './Navigation';
export type { NavigationProps, NavItem } from './Navigation';

export { Layout } from './Layout';
export type { LayoutProps } from './Layout';

// Catalog / detail components are imported from their feature paths
// (not the barrel) so route chunks stay code-split for 3G budgets.
export { LazyImage } from './LazyImage';
export type { LazyImageProps } from './LazyImage';

export { ProductCard } from './ProductCard';
export type { ProductCardProps } from './ProductCard';

export { CatalogGrid } from './CatalogGrid';
export type { CatalogGridProps } from './CatalogGrid';
