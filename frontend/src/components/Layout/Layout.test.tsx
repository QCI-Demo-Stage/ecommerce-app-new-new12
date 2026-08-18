import { render, screen } from '@testing-library/react';
import { Layout } from './Layout';
import { BREAKPOINTS, GRID_COLUMNS, mediaQueries } from '../../tokens/breakpoints';

describe('Layout', () => {
  it('wraps children in a main landmark with content id', () => {
    render(
      <Layout header={<div>Header</div>} footer={<div>Footer</div>}>
        <p>Page content</p>
      </Layout>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Header');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Footer');
  });

  it('renders complementary aside when provided', () => {
    render(
      <Layout aside={<div>Filters</div>}>
        <p>Catalog</p>
      </Layout>,
    );

    expect(screen.getByRole('complementary', { name: 'Complementary' })).toHaveTextContent(
      'Filters',
    );
  });

  it('can show breakpoint badge for visual regression harnesses', () => {
    render(
      <Layout showBreakpointBadge footer={<span>© Shop</span>}>
        <p>Home</p>
      </Layout>,
    );

    expect(screen.getByTestId('breakpoint-badge')).toBeInTheDocument();
  });
});

describe('breakpoint system', () => {
  it('defines mobile-first breakpoint constants', () => {
    expect(BREAKPOINTS.mobile.min).toBe(0);
    expect(BREAKPOINTS.mobile.max).toBe(767);
    expect(BREAKPOINTS.tablet.min).toBe(768);
    expect(BREAKPOINTS.desktop.min).toBe(1024);
  });

  it('exposes media query helpers and grid columns', () => {
    expect(mediaQueries.tabletUp).toContain('768');
    expect(mediaQueries.desktopUp).toContain('1024');
    expect(GRID_COLUMNS).toEqual({ mobile: 4, tablet: 8, desktop: 12 });
  });
});
