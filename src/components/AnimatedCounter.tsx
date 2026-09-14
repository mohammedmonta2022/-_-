import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number; // in seconds
  className?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 0,
  to,
  duration = 1.6,
  className = '',
  suffix = '',
}) => {
  const [current, setCurrent] = useState(from);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1);

      // Ease out expo curve for smooth, premium decelerating count
      const easeOut = 1 - Math.pow(2, -10 * progress);
      const value = Math.round(from + (to - from) * easeOut);
      setCurrent(value);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrent(to);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [from, to, duration]);

  return (
    <span className={`tabular-nums font-mono ${className}`}>
      {current.toLocaleString('ar-EG')}
      {suffix && <span className="mr-1 text-sm font-sans">{suffix}</span>}
    </span>
  );
};
