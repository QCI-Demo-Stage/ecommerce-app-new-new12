import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import styles from './LazyImage.module.css';

export interface LazyImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  /** Image source loaded when the element intersects the viewport */
  src: string;
  /** Required accessible alternative text */
  alt: string;
  /** Root margin for IntersectionObserver (default: 200px) */
  rootMargin?: string;
}

/**
 * Lazy-loads an image via IntersectionObserver when it enters (near) the viewport.
 * Falls back to native lazy loading when IntersectionObserver is unavailable.
 */
export function LazyImage({
  src,
  alt,
  className,
  rootMargin = '200px 0px',
  ...rest
}: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = imgRef.current;
    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <img
      ref={imgRef}
      className={[styles.image, loaded ? styles.loaded : undefined, className]
        .filter(Boolean)
        .join(' ')}
      src={visible ? src : undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      {...rest}
    />
  );
}
