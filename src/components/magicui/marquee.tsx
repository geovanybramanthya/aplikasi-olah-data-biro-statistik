import React from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  pauseOnHover?: boolean;
}

export const Marquee: React.FC<MarqueeProps> = ({ children, className, pauseOnHover = false }) => (
  <div className={cn('landing-marquee overflow-hidden', pauseOnHover && 'group-hover:[&_.landing-marquee-track]:[animation-play-state:paused]', className)}>
    <div className="landing-marquee-track flex w-max gap-3 pr-3">
      {children}
      {children}
    </div>
  </div>
);
