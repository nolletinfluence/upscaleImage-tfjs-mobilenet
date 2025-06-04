import { useEffect, useRef, useState, RefObject } from 'react';

interface IntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver<T extends Element>(
  elementRef: RefObject<T>,
  {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
  }: IntersectionObserverOptions = {}
): {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
} {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  
  const frozen = useRef(false);
  const isIntersecting = entry?.isIntersecting ?? false;

  useEffect(() => {
    const element = elementRef?.current;
    
    if (!element || (freezeOnceVisible && frozen.current)) return;
    
    if (freezeOnceVisible && isIntersecting) {
      frozen.current = true;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
      },
      { threshold, root, rootMargin }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [
    elementRef,
    threshold,
    root,
    rootMargin,
    freezeOnceVisible,
    isIntersecting,
  ]);

  return { isIntersecting, entry };
}