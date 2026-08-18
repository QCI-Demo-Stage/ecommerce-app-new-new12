import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { LazyImage } from './LazyImage';

describe('LazyImage', () => {
  const observe = jest.fn();
  const disconnect = jest.fn();
  let intersectionCallback: IntersectionObserverCallback | null = null;

  beforeEach(() => {
    observe.mockClear();
    disconnect.mockClear();
    intersectionCallback = null;

    class MockIntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin = '';
      readonly thresholds: ReadonlyArray<number> = [];

      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }

      observe = observe;
      unobserve = jest.fn();
      disconnect = disconnect;
      takeRecords = () => [];
    }

    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver,
    });
  });

  it('does not set src until the image intersects the viewport', () => {
    render(
      <LazyImage src="/images/products/classic-widget.svg" alt="Classic Widget" />,
    );

    const img = screen.getByAltText('Classic Widget');
    expect(img).not.toHaveAttribute('src');
    expect(observe).toHaveBeenCalled();
  });

  it('loads the image when IntersectionObserver reports visibility', async () => {
    render(
      <LazyImage src="/images/products/classic-widget.svg" alt="Classic Widget" />,
    );

    const img = screen.getByAltText('Classic Widget');

    act(() => {
      intersectionCallback?.(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target: img,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(img).toHaveAttribute('src', '/images/products/classic-widget.svg');
    });
    expect(disconnect).toHaveBeenCalled();
  });
});
