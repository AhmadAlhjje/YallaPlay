import Link from 'next/link';
import { analyticsApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/lib/utils';

async function fetchTopFacilities() {
  try {
    const res = await analyticsApi.getTopFacilities(8);
    return res.data.data ?? [];
  } catch {
    return [];
  }
}

export async function TopFacilitiesTable() {
  const facilities = await fetchTopFacilities();

  return (
    <GlassCard padding={false}>
      <div className="p-5 flex items-center justify-between border-b border-white/[0.07]">
        <h3 className="text-sm font-bold text-[--text-primary]">أفضل الملاعب أداءً</h3>
        <Link
          href="/dashboard/facilities"
          className="text-xs text-brand-primary hover:text-emerald-300 transition-colors"
        >
          عرض الكل ←
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>الملعب</th>
              <th>المالك</th>
              <th>الحجوزات</th>
              <th>الإيرادات</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {facilities.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[--text-tertiary]">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              facilities.map((f: any, i: number) => (
                <tr key={f._id}>
                  <td>
                    <span className="text-xs font-bold text-[--text-tertiary]">{i + 1}</span>
                  </td>
                  <td>
                    <p className="text-sm font-semibold text-[--text-primary]">{f.name}</p>
                    <p className="text-xs text-[--text-tertiary] truncate max-w-[140px]">{f.address}</p>
                  </td>
                  <td className="text-sm text-[--text-secondary]">{f.owner?.name ?? '—'}</td>
                  <td>
                    <span className="tabular-nums font-bold text-[--text-primary]">{f.totalBookings ?? 0}</span>
                  </td>
                  <td>
                    <span className="tabular-nums text-emerald-400 font-bold text-sm">
                      {formatCurrency(f.totalRevenue ?? 0, 'SYP')}
                    </span>
                  </td>
                  <td>
                    <span className={f.isActive ? 'badge-success' : 'badge-error'}>
                      {f.isActive ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
