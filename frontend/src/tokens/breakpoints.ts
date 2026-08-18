/**
 * Mobile-first breakpoint constants (min-width).
 * Base styles target mobile; larger screens progressively enhance.
 */
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type BreakpointName = keyof typeof breakpoints;

/** CSS media-query helpers (mobile-first min-width). */
export const mediaQueries = {
  mobile: `(min-width: ${breakpoints.mobile}px)`,
  tablet: `(min-width: ${breakpoints.tablet}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px)`,
} as const;

/** Max-width queries useful for Storybook / visual regression viewports. */
export const maxWidthQueries = {
  mobile: `(max-width: ${breakpoints.tablet - 1}px)`,
  tablet: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px)`,
} as const;

/** Storybook / Chromatic viewport presets aligned to design tokens. */
export const viewportPresets = {
  mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
  tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
  desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
} as const;
