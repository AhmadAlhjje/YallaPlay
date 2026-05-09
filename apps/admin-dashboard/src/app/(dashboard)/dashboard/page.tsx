import { Suspense } from 'react';
import { PlatformKPIs } from './_components/PlatformKPIs';
import { RevenueChart } from './_components/RevenueChart';
import { TopFacilitiesTable } from './_components/TopFacilitiesTable';
import { RecentBookings } from './_components/RecentBookings';
import { PlatformHealth } from './_components/PlatformHealth';

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-[--text-primary]">لوحة التحكم</h1>
        <p className="text-sm text-[--text-tertiary] mt-0.5">نظرة عامة على أداء المنصة في الوقت الفعلي</p>
      </div>

      {/* KPI row */}
      <Suspense fallback={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      }>
        <PlatformKPIs />
      </Suspense>

      {/* Revenue chart + Platform health */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Suspense fallback={<Skeleton className="h-80" />}>
            <RevenueChart />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<Skeleton className="h-80" />}>
            <PlatformHealth />
          </Suspense>
        </div>
      </div>

      {/* Top facilities + Recent bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <TopFacilitiesTable />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-96" />}>
          <RecentBookings />
        </Suspense>
      </div>
    </div>
  );
}
