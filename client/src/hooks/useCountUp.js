import { useEffect, useState } from 'react';

const easeOutCubic = (t) => 1 - ((1 - t) ** 3);

const useCountUp = (target, options = {}) => {
  const { duration = 1800, delay = 0 } = options;
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frameId;
    let timeoutId;

    timeoutId = window.setTimeout(() => {
      const start = performance.now();

      const update = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = easeOutCubic(progress);
        setValue(Math.floor(eased * target));

        if (progress < 1) {
          frameId = window.requestAnimationFrame(update);
        }
      };

      frameId = window.requestAnimationFrame(update);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [target, duration, delay]);

  return value;
};

export default useCountUp;
