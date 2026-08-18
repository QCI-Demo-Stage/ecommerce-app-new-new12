import type { Preview } from '@storybook/react-vite';
import { viewportPresets } from '../src/tokens';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'todo' },
    viewport: {
      viewports: {
        mobile: viewportPresets.mobile,
        tablet: viewportPresets.tablet,
        desktop: viewportPresets.desktop,
      },
      defaultViewport: 'mobile',
    },
    // Chromatic / Storybook visual regression: capture each breakpoint
    chromatic: {
      viewports: [375, 768, 1280],
      delay: 100,
    },
  },
};

export default preview;
