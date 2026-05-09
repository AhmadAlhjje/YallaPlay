'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',           icon: '📊', label: 'لوحة التحكم' },
  { href: '/dashboard/facilities', icon: '🏟️', label: 'الملاعب والمالكون' },
  { href: '/dashboard/users',      icon: '👥', label: 'المستخدمون' },
  { href: '/dashboard/plans',      icon: '💎', label: 'خطط الاشتراك' },
  { href: '/dashboard/bookings',   icon: '📋', label: 'الحجوزات' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 right-0 h-full w-64 flex flex-col z-40 border-l border-white/8"
      style={{ background: 'rgba(15,20,40,0.85)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
          🏟️
        </div>
        <div>
          <p className="text-sm font-bold text-[--text-primary]">يلا بلاي</p>
          <p className="text-xs text-[--text-tertiary]">لوحة الإدارة</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[--text-tertiary]">
          القائمة الرئيسية
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-link', active && 'active')}
            >
              <span className="nav-icon text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {active && (
                <span className="mr-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            م
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[--text-primary] truncate">مشرف النظام</p>
            <p className="text-xs text-[--text-tertiary]">Admin</p>
          </div>
          <Link href="/login" className="text-[--text-tertiary] hover:text-[--text-primary] transition-colors text-sm">
            خروج
          </Link>
        </div>
      </div>
    </aside>
  );
}
