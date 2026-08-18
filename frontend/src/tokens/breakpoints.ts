/**
 * Mobile-first breakpoint constants for the Ecommerce App New UI.
 *
 * Base styles target mobile. Use min-width media queries at tablet/desktop.
 */
export const BREAKPOINTS = {
  /** Phones — default (mobile-first) viewport */
  mobile: {
    min: 0,
    max: 767,
  },
  /** Tablets — min-width 768px */
  tablet: {
    min: 768,
    max: 1023,
  },
  /** Desktops — min-width 1024px */
  desktop: {
    min: 1024,
    max: Number.POSITIVE_INFINITY,
  },
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

/** CSS media-query helpers (mobile-first min-width). */
export const mediaQueries = {
  mobileOnly: `(max-width: ${BREAKPOINTS.mobile.max}px)`,
  tabletUp: `(min-width: ${BREAKPOINTS.tablet.min}px)`,
  tabletOnly: `(min-width: ${BREAKPOINTS.tablet.min}px) and (max-width: ${BREAKPOINTS.tablet.max}px)`,
  desktopUp: `(min-width: ${BREAKPOINTS.desktop.min}px)`,
} as const;

/** Grid column counts per breakpoint. */
export const GRID_COLUMNS = {
  mobile: 4,
  tablet: 8,
  desktop: 12,
} as const;

/** Content max-widths (px) per breakpoint. */
export const CONTENT_MAX_WIDTH = {
  mobile: '100%',
  tablet: '960px',
  desktop: '1200px',
} as const;
