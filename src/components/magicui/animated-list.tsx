import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({ children, className }) => (
  <div className={cn('landing-animated-list space-y-2', className)}>{children}</div>
);
