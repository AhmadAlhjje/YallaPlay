'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  CalendarDays,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, clearTokens } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/dashboard/facilities', icon: Building2,       label: 'الملاعب والمالكون' },
  { href: '/dashboard/users',      icon: Users,           label: 'المستخدمون' },
  { href: '/dashboard/plans',      icon: CreditCard,      label: 'خطط الاشتراك' },
  { href: '/dashboard/bookings',   icon: CalendarDays,    label: 'الحجوزات' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearTokens();
    router.push('/login');
  };

  return (
    <aside
      className="fixed top-0 right-0 h-full w-64 flex flex-col z-40 border-l border-white/[0.07]"
      style={{ background: 'rgba(10,18,13,0.92)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.07]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', boxShadow: '0 0 20px rgba(22,163,74,0.3)' }}
        >
          <Building2 size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">يلا بلاي</p>
          <p className="text-xs text-[--text-tertiary]">لوحة الإدارة</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-xs font-semibold text-[--text-tertiary] tracking-widest uppercase">
          القائمة الرئيسية
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-link', active && 'active')}
            >
              <Icon
                size={18}
                className={cn('nav-icon flex-shrink-0 transition-colors', active ? 'text-brand-primary' : 'text-[--text-tertiary]')}
              />
              <span className="flex-1">{item.label}</span>
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.07] space-y-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}
          >
            <Shield size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[--text-primary]">مشرف النظام</p>
            <p className="text-xs text-[--text-tertiary]">Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[--text-tertiary] hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut size={15} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
