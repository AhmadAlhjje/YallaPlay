'use client';

import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':              'لوحة التحكم',
  '/dashboard/facilities':   'الملاعب والمالكون',
  '/dashboard/users':        'إدارة المستخدمين',
  '/dashboard/plans':        'خطط الاشتراك',
  '/dashboard/bookings':     'إدارة الحجوزات',
};

export function Topbar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'يلا بلاي';

  const now = new Date().toLocaleDateString('ar-SY', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header
      className="fixed top-0 left-0 right-64 h-16 flex items-center justify-between px-6 z-30 border-b border-white/8"
      style={{ background: 'rgba(10,14,26,0.8)', backdropFilter: 'blur(16px)' }}
    >
      <div>
        <h1 className="text-lg font-bold text-[--text-primary]">{title}</h1>
        <p className="text-xs text-[--text-tertiary] hidden sm:block">{now}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Global search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="بحث سريع..."
            className="field-input w-52 pl-8 text-xs h-8"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--text-tertiary] text-xs">🔍</span>
        </div>

        {/* Notification bell */}
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[--text-secondary] hover:text-[--text-primary] transition-colors border border-white/10 hover:border-white/20"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          🔔
        </button>
      </div>
    </header>
  );
}
