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
        <span className="text-xs font-semibold tabular-nums" style={{ color }}>{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
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
  const metrics = [
    { label: 'حجوزات مؤكدة', value: s?.confirmedBookings ?? 0, color: '#10B981' },
    { label: 'حجوزات معلقة',  value: s?.pendingBookings ?? 0,   color: '#F59E0B' },
    { label: 'حجوزات ملغاة',  value: s?.cancelledBookings ?? 0, color: '#EF4444' },
    { label: 'مكتملة',        value: s?.completedBookings ?? 0, color: '#3B82F6' },
  ];

  const planDist = [
    { label: 'خطة مجانية',  value: s?.planDistribution?.free ?? 0,   color: '#6B7280' },
    { label: 'خطة برايمر',  value: s?.planDistribution?.primer ?? 0, color: '#4F46E5' },
    { label: 'خطة برو',     value: s?.planDistribution?.pro ?? 0,    color: '#F59E0B' },
  ];
  const totalOwners = planDist.reduce((sum, p) => sum + p.value, 0) || 1;

  return (
    <GlassCard className="h-full space-y-6">
      <h3 className="text-base font-semibold text-[--text-primary]">صحة المنصة</h3>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary] mb-3">
          توزيع الحجوزات
        </p>
        <div className="space-y-3">
          {metrics.map((m) => (
            <HealthBar key={m.label} label={m.label} value={m.value} max={total} color={m.color} />
          ))}
        </div>
      </div>

      <div className="border-t border-white/8 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary] mb-3">
          توزيع خطط المالكين
        </p>
        <div className="space-y-3">
          {planDist.map((p) => (
            <HealthBar key={p.label} label={p.label} value={p.value} max={totalOwners} color={p.color} />
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="border-t border-white/8 pt-4 grid grid-cols-2 gap-3">
        {[
          { label: 'معدل التأكيد', value: s ? `${((s.confirmedBookings / (total || 1)) * 100).toFixed(0)}%` : '—', color: '#10B981' },
          { label: 'معدل الإلغاء', value: s ? `${(s.cancellationRate ?? 0).toFixed(1)}%` : '—', color: '#EF4444' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card-subtle p-3 rounded-lg text-center">
            <p className="text-lg font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-[--text-tertiary] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
