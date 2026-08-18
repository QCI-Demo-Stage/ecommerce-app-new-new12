import type { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import '../src/tokens/tokens.css';
import '../src/styles/global.css';
import { BREAKPOINTS } from '../src/tokens/breakpoints';

/**
 * Custom viewports aligned with design-token breakpoints for visual regression.
 * Mobile-first: base styles apply below tablet; tablet/desktop override upward.
 */
export const CUSTOM_VIEWPORTS = {
  mobile: {
    name: 'Mobile',
    styles: {
      width: `${BREAKPOINTS.mobile.max}px`,
      height: '800px',
    },
    type: 'mobile' as const,
  },
  tablet: {
    name: 'Tablet',
    styles: {
      width: `${BREAKPOINTS.tablet.min}px`,
      height: '900px',
    },
    type: 'tablet' as const,
  },
  desktop: {
    name: 'Desktop',
    styles: {
      width: `${BREAKPOINTS.desktop.min}px`,
      height: '1000px',
    },
    type: 'desktop' as const,
  },
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        ...CUSTOM_VIEWPORTS,
        ...INITIAL_VIEWPORTS,
      },
      defaultViewport: 'mobile',
    },
    a11y: {
      test: 'todo',
    },
    layout: 'fullscreen',
  },
};

export default preview;
