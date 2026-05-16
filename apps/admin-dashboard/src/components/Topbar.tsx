'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/dashboard':              { title: 'لوحة التحكم',        sub: 'نظرة عامة على أداء المنصة' },
  '/dashboard/facilities':   { title: 'الملاعب والمالكون',  sub: 'إدارة الملاعب المسجلة في المنصة' },
  '/dashboard/users':        { title: 'إدارة المستخدمين',   sub: 'اللاعبون والمالكون المسجلون' },
  '/dashboard/plans':        { title: 'خطط الاشتراك',       sub: 'إدارة الباقات والاشتراكات' },
  '/dashboard/bookings':     { title: 'الحجوزات',            sub: 'جميع حجوزات المنصة' },
};

export function Topbar() {
  const pathname = usePathname();
  const page = PAGE_TITLES[pathname] ?? { title: 'يلا بلاي', sub: '' };

  const now = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header
      className="fixed top-0 left-0 right-64 h-16 flex items-center justify-between px-6 z-30 border-b border-white/[0.07]"
      style={{ background: 'rgba(10,18,13,0.85)', backdropFilter: 'blur(16px)' }}
    >
      <div>
        <h1 className="text-base font-bold text-[--text-primary] leading-tight">{page.title}</h1>
        <p className="text-xs text-[--text-tertiary] hidden sm:block">{now}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[--text-secondary] hover:text-[--text-primary] transition-colors relative"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary border border-canvas-primary" />
        </button>
      </div>
    </header>
  );
}
