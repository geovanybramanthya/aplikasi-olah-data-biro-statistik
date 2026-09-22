import React from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

interface BentoCardProps {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  background: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className }) => (
  <div className={cn('grid grid-flow-dense grid-cols-1 gap-4 lg:grid-cols-3', className)}>{children}</div>
);

export const BentoCard: React.FC<BentoCardProps> = ({
  id,
  icon,
  name,
  description,
  background,
  className,
}) => (
  <article
    id={id}
    className={cn(
      'group relative min-h-[25rem] overflow-hidden border border-white/10 bg-neutral-950 p-6 md:p-8',
      className,
    )}
    aria-labelledby={`${id}-title`}
  >
    <div className="relative z-10 max-w-[18rem]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
        {icon}
      </div>
      <h3 id={`${id}-title`} className="mt-5 text-2xl font-medium tracking-[-0.04em] text-white">
        {name}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-white/65">{description}</p>
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-52" aria-hidden="true">
      {background}
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-950/90 to-transparent" />
  </article>
);
