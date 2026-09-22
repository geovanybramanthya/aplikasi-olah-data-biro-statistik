import React, { useId, useLayoutEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBeamProps {
  containerRef: React.RefObject<HTMLElement | null>;
  fromRef: React.RefObject<HTMLElement | null>;
  toRef: React.RefObject<HTMLElement | null>;
  className?: string;
  curvature?: number;
  duration?: number;
  delay?: number;
  reverse?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const getCenterPoint = (element: HTMLElement, container: DOMRect): Point => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - container.left + rect.width / 2,
    y: rect.top - container.top + rect.height / 2,
  };
};

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  containerRef,
  fromRef,
  toRef,
  className,
  curvature = 0,
  duration = 3,
  delay = 0,
  reverse = false,
}) => {
  const [path, setPath] = useState('');
  const gradientId = useId().replace(/:/g, '');

  useLayoutEffect(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return undefined;

    const updatePath = () => {
      const containerRect = container.getBoundingClientRect();
      const start = getCenterPoint(from, containerRect);
      const end = getCenterPoint(to, containerRect);
      const controlX = (start.x + end.x) / 2;
      const curve = (end.y - start.y) * 0.14 + curvature;
      setPath(`M ${start.x} ${start.y} C ${controlX} ${start.y + curve}, ${controlX} ${end.y - curve}, ${end.x} ${end.y}`);
    };

    updatePath();
    const observer = new ResizeObserver(updatePath);
    observer.observe(container);
    observer.observe(from);
    observer.observe(to);
    window.addEventListener('resize', updatePath);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePath);
    };
  }, [containerRef, fromRef, toRef, curvature]);

  if (!path) return null;

  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible', className)}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="48%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.28)" />
        </linearGradient>
      </defs>
      <path d={path} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      <path
        d={path}
        className="landing-beam"
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        strokeWidth="1.5"
        style={{
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      />
    </svg>
  );
};
