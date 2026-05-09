'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { analyticsApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn, formatCurrency } from '@/lib/utils';

type Granularity = 'daily' | 'weekly' | 'monthly';

const TABS: { key: Granularity; label: string }[] = [
  { key: 'daily',   label: 'يومي' },
  { key: 'weekly',  label: 'أسبوعي' },
  { key: 'monthly', label: 'شهري' },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card-strong px-3 py-2 text-sm">
      <p className="text-[--text-tertiary] text-xs mb-1">{label}</p>
      <p className="font-bold text-emerald-400">{formatCurrency(payload[0]?.value ?? 0, 'SYP')}</p>
      {payload[1] && (
        <p className="text-[--text-secondary] text-xs">{payload[1]?.value} حجز</p>
      )}
    </div>
  );
}

export function RevenueChart() {
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi.getPlatformRevenue(granularity)
      .then((res) => setData(res.data.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [granularity]);

  const totalRevenue = data.reduce((sum, d) => sum + (d.revenue ?? 0), 0);

  return (
    <GlassCard padding={false} className="h-full">
      <div className="p-5 flex items-start justify-between border-b border-white/8">
        <div>
          <h3 className="text-base font-semibold text-[--text-primary]">الإيرادات</h3>
          <p className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
            {formatCurrency(totalRevenue, 'SYP')}
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setGranularity(tab.key)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all duration-150',
                granularity === tab.key
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-[--text-tertiary] hover:text-[--text-secondary]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 h-64">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[--text-tertiary] text-sm">
            لا توجد بيانات متاحة
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#10B981', stroke: '#0A0E1A', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
}
