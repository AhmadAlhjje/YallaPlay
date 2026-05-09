import { analyticsApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency } from '@/lib/utils';

async function fetchSummary() {
  try {
    const res = await analyticsApi.getPlatformSummary();
    return res.data.data;
  } catch {
    return null;
  }
}

export async function PlatformKPIs() {
  const summary = await fetchSummary();

  const kpis = [
    {
      label: 'إجمالي الإيرادات',
      value: summary ? formatCurrency(summary.totalRevenue ?? 0, 'SYP') : '—',
      sub: `هذا الشهر: ${summary ? formatCurrency(summary.monthRevenue ?? 0, 'SYP') : '—'}`,
      icon: '💰',
      accent: 'success' as const,
      trend: summary?.revenueTrend ? { value: summary.revenueTrend, label: 'مقارنة بالشهر الماضي' } : undefined,
    },
    {
      label: 'الملاعب النشطة',
      value: summary?.activeFacilities ?? '—',
      sub: `إجمالي: ${summary?.totalFacilities ?? '—'}`,
      icon: '🏟️',
      accent: 'brand' as const,
    },
    {
      label: 'المستخدمون',
      value: summary?.totalUsers ?? '—',
      sub: `جدد هذا الشهر: +${summary?.newUsersThisMonth ?? '—'}`,
      icon: '👥',
      accent: 'info' as const,
    },
    {
      label: 'إجمالي الحجوزات',
      value: summary?.totalBookings ?? '—',
      sub: `نسبة الإلغاء: ${summary?.cancellationRate?.toFixed(1) ?? '—'}%`,
      icon: '📋',
      accent: 'warning' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <StatCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
