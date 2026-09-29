/**
 * Design token values for colors, spacing, typography, and layout grid.
 * Mirrored as CSS custom properties in tokens.css for runtime styling.
 */
export const colors = {
  brand: {
    primary: '#0b5f4a',
    primaryHover: '#084c3b',
    primaryActive: '#063c2f',
    accent: '#c45c26',
    accentHover: '#a34b1e',
  },
  neutral: {
    0: '#ffffff',
    50: '#f6f7f6',
    100: '#e8ebe9',
    200: '#cfd6d2',
    300: '#a8b3ad',
    500: '#6b766f',
    700: '#3d4641',
    900: '#1a211e',
  },
  semantic: {
    danger: '#b42318',
    dangerBg: '#fef3f2',
    success: '#027a48',
    focus: '#2e90fa',
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const;

export const typography = {
  fontFamily: {
    sans: '"Source Sans 3", "Segoe UI", sans-serif',
    display: '"Fraunces", Georgia, serif',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.65,
  },
} as const;

export const radii = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
} as const;

export const grid = {
  columns: {
    mobile: 4,
    tablet: 8,
    desktop: 12,
  },
  gutter: {
    mobile: spacing[4],
    tablet: spacing[5],
    desktop: spacing[6],
  },
  maxWidth: '72rem',
} as const;

export const safeArea = {
  top: 'env(safe-area-inset-top, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
} as const;
