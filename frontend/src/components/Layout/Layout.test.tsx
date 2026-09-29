import { render, screen } from '@testing-library/react';
import { Layout } from './Layout';
import { breakpoints, mediaQueries } from '../../tokens';

describe('Layout', () => {
  it('wraps children in a main landmark with header and footer slots', () => {
    render(
      <Layout header={<div>Header</div>} footer={<div>Footer</div>}>
        <p>Page body</p>
      </Layout>,
    );
    expect(screen.getByTestId('layout-root')).toBeInTheDocument();
    expect(screen.getByTestId('layout-header')).toHaveTextContent('Header');
    expect(screen.getByRole('main')).toHaveTextContent('Page body');
    expect(screen.getByTestId('layout-footer')).toHaveTextContent('Footer');
  });

  it('exposes a stable main content id for skip links', () => {
    render(
      <Layout>
        <span>Content</span>
      </Layout>,
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });
});

describe('breakpoint system', () => {
  it('defines mobile-first breakpoint constants', () => {
    expect(breakpoints.mobile).toBe(0);
    expect(breakpoints.tablet).toBe(768);
    expect(breakpoints.desktop).toBe(1024);
  });

  it('builds min-width media queries from tokens', () => {
    expect(mediaQueries.tablet).toBe('(min-width: 768px)');
    expect(mediaQueries.desktop).toBe('(min-width: 1024px)');
  });
});
