import { useEffect, useMemo, useRef, useState } from 'react';

const pickDelay = (min = 8000, max = 12000) => min + Math.floor(Math.random() * (max - min + 1));

const useLiveActivity = (seedItems = [], options = {}) => {
  const {
    maxItems = 12,
    intervalMin = 8000,
    intervalMax = 12000,
    autoStart = true
  } = options;

  const [items, setItems] = useState(() => seedItems.slice(0, maxItems));
  const [isAnimating, setIsAnimating] = useState(false);

  const queue = useMemo(() => seedItems, [seedItems]);
  const indexRef = useRef(items.length);
  const timerRef = useRef(0);
  const swapTimerRef = useRef(0);

  useEffect(() => {
    setItems(seedItems.slice(0, maxItems));
    indexRef.current = seedItems.slice(0, maxItems).length;
  }, [seedItems, maxItems]);

  useEffect(() => {
    if (!autoStart || queue.length <= 1) {
      return undefined;
    }

    const schedule = () => {
      timerRef.current = window.setTimeout(() => {
        setIsAnimating(true);

        swapTimerRef.current = window.setTimeout(() => {
          setItems((prev) => {
            const next = queue[indexRef.current % queue.length];
            indexRef.current += 1;
            return [next, ...prev].slice(0, maxItems);
          });
          setIsAnimating(false);
          schedule();
        }, 320);
      }, pickDelay(intervalMin, intervalMax));
    };

    schedule();

    return () => {
      window.clearTimeout(timerRef.current);
      window.clearTimeout(swapTimerRef.current);
    };
  }, [autoStart, intervalMax, intervalMin, maxItems, queue]);

  return {
    items,
    isAnimating,
    setItems
  };
};

export default useLiveActivity;
