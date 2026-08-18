/**
 * Spacing design tokens (rem-based, 4px base unit).
 */
export const spacing = {
  0: 'var(--space-0)',
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  8: 'var(--space-8)',
  10: 'var(--space-10)',
  12: 'var(--space-12)',
  16: 'var(--space-16)',
} as const;

/** Layout gutter / section spacing aliases. */
export const layoutSpacing = {
  pageGutterMobile: 'var(--layout-gutter-mobile)',
  pageGutterTablet: 'var(--layout-gutter-tablet)',
  pageGutterDesktop: 'var(--layout-gutter-desktop)',
  sectionGap: 'var(--layout-section-gap)',
  gridGap: 'var(--layout-grid-gap)',
} as const;

export type SpacingToken = keyof typeof spacing;
