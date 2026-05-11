import { adminApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatRelative, formatTime12h } from '@/lib/utils';

const STATUS_BADGE: Record<string, string> = {
  pending:   'badge-warning',
  confirmed: 'badge-success',
  completed: 'badge-info',
  cancelled: 'badge-error',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'معلّق', confirmed: 'مؤكّد', completed: 'مكتمل', cancelled: 'ملغي',
};

async function fetchRecent() {
  try {
    const res = await adminApi.listBookings({ page: 1, limit: 8 });
    return res.data.data.bookings ?? [];
  } catch {
    return [];
  }
}

export async function RecentBookings() {
  const bookings = await fetchRecent();

  return (
    <GlassCard padding={false}>
      <div className="p-5 border-b border-white/8 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[--text-primary]">آخر الحجوزات</h3>
        <a href="/dashboard/bookings" className="text-xs text-brand-primary hover:text-indigo-300 transition-colors">
          عرض الكل ←
        </a>
      </div>

      <div className="divide-y divide-white/5">
        {bookings.length === 0 ? (
          <p className="text-center py-8 text-[--text-tertiary] text-sm">لا توجد حجوزات</p>
        ) : (
          bookings.map((b: any) => (
            <div key={b._id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                {(b.user?.name ?? 'م')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[--text-primary] truncate">
                  {b.user?.name ?? '—'}
                </p>
                <p className="text-xs text-[--text-tertiary] truncate">
                  {b.facility?.name ?? '—'} · {b.date} · {formatTime12h(b.startTime)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={STATUS_BADGE[b.status] ?? 'badge-ghost'}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
                <span className="text-xs text-[--text-tertiary]">
                  {b.createdAt ? formatRelative(b.createdAt) : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
