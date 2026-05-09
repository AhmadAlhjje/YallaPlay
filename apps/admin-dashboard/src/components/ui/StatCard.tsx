'use client';

import { cn, formatNumber } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  trend?: { value: number; label: string };
  accent?: 'brand' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const ACCENT_STYLES = {
  brand:   { border: 'border-brand-primary/30', glow: 'rgba(79,70,229,0.15)',  text: 'text-indigo-400' },
  success: { border: 'border-emerald-500/30',   glow: 'rgba(16,185,129,0.15)', text: 'text-emerald-400' },
  warning: { border: 'border-amber-500/30',     glow: 'rgba(245,158,11,0.15)', text: 'text-amber-400' },
  error:   { border: 'border-red-500/30',       glow: 'rgba(239,68,68,0.15)',  text: 'text-red-400' },
  info:    { border: 'border-blue-500/30',       glow: 'rgba(59,130,246,0.15)', text: 'text-blue-400' },
};

export function StatCard({ label, value, sub, icon, trend, accent = 'brand', className }: StatCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      className={cn(
        'glass-card p-5 relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5',
        styles.border,
        className,
      )}
      style={{ borderWidth: '1px' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-40"
        style={{ background: `radial-gradient(ellipse at top left, ${styles.glow}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[--text-tertiary] uppercase tracking-wider mb-2">{label}</p>
          <p className={cn('text-3xl font-bold tabular-nums', styles.text)}>
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {sub && <p className="text-xs text-[--text-tertiary] mt-1">{sub}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-[--text-tertiary]">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ml-3"
          style={{ background: styles.glow }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
