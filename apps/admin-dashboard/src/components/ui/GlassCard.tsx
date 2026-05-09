'use client';

import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'strong';
  padding?: boolean;
}

export function GlassCard({ children, className, variant = 'default', padding = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        variant === 'default' ? 'glass-card' :
        variant === 'subtle'  ? 'glass-card-subtle' :
                                'glass-card-strong',
        padding && 'p-5',
        'animate-fade-in',
        className,
      )}
    >
      {children}
    </div>
  );
}
