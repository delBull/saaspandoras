import { useLayoutEffect, useState, useCallback } from 'react';

interface UseFitTextOptions {
  maxFontSize?: number;
  minFontSize?: number;
}

export function useFitText<T extends HTMLElement>(options: UseFitTextOptions = {}) {
  const { maxFontSize = 100, minFontSize = 10 } = options;
  const [fontSize, setFontSize] = useState(`${(maxFontSize + minFontSize) / 2}px`);
  const ref = useCallback((node: T | null) => {
    if (!node) return;

    const parent = node.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver(() => {
      let low = minFontSize;
      let high = maxFontSize;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        node.style.fontSize = `${mid}px`;

        if (node.scrollWidth > parent.clientWidth) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }
      setFontSize(`${high}px`);
    });

    resizeObserver.observe(parent);
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, [maxFontSize, minFontSize]);

  return { fontSize, ref };
}