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
      <div className="p-5 flex items-center justify-between border-b border-white/8">
        <h3 className="text-base font-semibold text-[--text-primary]">أفضل الملاعب أداءً</h3>
        <Link href="/dashboard/facilities" className="text-xs text-brand-primary hover:text-indigo-300 transition-colors">
          عرض الكل ←
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
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
                <td colSpan={6} className="text-center py-8 text-[--text-tertiary]">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              facilities.map((f: any, i: number) => (
                <tr key={f._id}>
                  <td className="text-[--text-tertiary] text-xs w-8">{i + 1}</td>
                  <td>
                    <div>
                      <p className="text-sm font-medium text-[--text-primary]">{f.name}</p>
                      <p className="text-xs text-[--text-tertiary]">{f.address}</p>
                    </div>
                  </td>
                  <td className="text-sm">{f.owner?.name ?? '—'}</td>
                  <td>
                    <span className="tabular-nums font-semibold text-[--text-primary]">{f.totalBookings ?? 0}</span>
                  </td>
                  <td>
                    <span className="tabular-nums text-emerald-400 font-semibold text-sm">
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
