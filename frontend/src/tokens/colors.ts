/**
 * Color design tokens for the Ecommerce UI library.
 * Values mirror CSS custom properties in tokens.css.
 */
export const colors = {
  brand: {
    primary: 'var(--color-brand-primary)',
    primaryHover: 'var(--color-brand-primary-hover)',
    secondary: 'var(--color-brand-secondary)',
    secondaryHover: 'var(--color-brand-secondary-hover)',
  },
  surface: {
    page: 'var(--color-surface-page)',
    raised: 'var(--color-surface-raised)',
    muted: 'var(--color-surface-muted)',
    inverse: 'var(--color-surface-inverse)',
  },
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    inverse: 'var(--color-text-inverse)',
    disabled: 'var(--color-text-disabled)',
    link: 'var(--color-text-link)',
  },
  border: {
    default: 'var(--color-border-default)',
    strong: 'var(--color-border-strong)',
    focus: 'var(--color-border-focus)',
  },
  feedback: {
    success: 'var(--color-feedback-success)',
    warning: 'var(--color-feedback-warning)',
    danger: 'var(--color-feedback-danger)',
    info: 'var(--color-feedback-info)',
  },
} as const;

export type ColorTokens = typeof colors;
