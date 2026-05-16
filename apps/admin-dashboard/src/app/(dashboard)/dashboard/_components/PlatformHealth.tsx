import { analyticsApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';

async function fetchSummary() {
  try {
    const res = await analyticsApi.getPlatformSummary();
    return res.data.data;
  } catch {
    return null;
  }
}

function HealthBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-[--text-secondary]">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{value.toLocaleString('ar-SA')}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export async function PlatformHealth() {
  const s = await fetchSummary();

  const total = s?.totalBookings ?? 1;
  const bookingMetrics = [
    { label: 'حجوزات مؤكدة',  value: s?.confirmedBookings ?? 0, color: '#10B981' },
    { label: 'حجوزات معلقة',  value: s?.pendingBookings ?? 0,   color: '#F59E0B' },
    { label: 'حجوزات مكتملة', value: s?.completedBookings ?? 0, color: '#3B82F6' },
    { label: 'حجوزات ملغاة',  value: s?.cancelledBookings ?? 0, color: '#EF4444' },
  ];

  const planDist = [
    { label: 'خطة مجانية', value: s?.planDistribution?.free ?? 0,   color: '#6B7280' },
    { label: 'خطة برايمر', value: s?.planDistribution?.primer ?? 0, color: '#4F46E5' },
    { label: 'خطة برو',    value: s?.planDistribution?.pro ?? 0,    color: '#F59E0B' },
  ];
  const totalOwners = planDist.reduce((sum, p) => sum + p.value, 0) || 1;

  return (
    <GlassCard className="h-full space-y-5">
      <h3 className="text-sm font-bold text-[--text-primary]">صحة المنصة</h3>

      <div>
        <p className="text-xs font-semibold text-[--text-tertiary] mb-3 uppercase tracking-wider">
          توزيع الحجوزات
        </p>
        <div className="space-y-3">
          {bookingMetrics.map((m) => (
            <HealthBar key={m.label} label={m.label} value={m.value} max={total} color={m.color} />
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.07] pt-4">
        <p className="text-xs font-semibold text-[--text-tertiary] mb-3 uppercase tracking-wider">
          خطط المالكين
        </p>
        <div className="space-y-3">
          {planDist.map((p) => (
            <HealthBar key={p.label} label={p.label} value={p.value} max={totalOwners} color={p.color} />
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.07] pt-4 grid grid-cols-2 gap-3">
        {[
          {
            label: 'معدل التأكيد',
            value: s ? `${((s.confirmedBookings / (total || 1)) * 100).toFixed(0)}%` : '—',
            color: '#10B981',
          },
          {
            label: 'معدل الإلغاء',
            value: s ? `${(s.cancellationRate ?? 0).toFixed(1)}%` : '—',
            color: '#EF4444',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg p-3 text-center border border-white/[0.07]"
            style={{ background: 'rgba(255,255,255,0.025)' }}
          >
            <p className="text-xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-[--text-tertiary] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
