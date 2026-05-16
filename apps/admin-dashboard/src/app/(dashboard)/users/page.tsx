'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi, plansApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatDate, formatCurrency, formatTime12h, cn } from '@/lib/utils';
import { Search, Users, UserX, UserCheck, Shield, User, X, Phone, Star, CreditCard, Power, PowerOff, CalendarDays } from 'lucide-react';

type ConfirmAction = { id: string; name: string; action: 'suspend' | 'reactivate' } | null;

type OverrideAction = {
  userId: string;
  userName: string;
  currentPlan: string;
  durationDays: number;
  customDays: string;
} | null;

const DURATION_OPTIONS = [
  { label: '30 يوم',  days: 30 },
  { label: '90 يوم',  days: 90 },
  { label: '180 يوم', days: 180 },
  { label: '365 يوم', days: 365 },
  { label: 'مخصص',   days: 0 },
];

const PLAN_CONFIG: Record<string, { label: string; cls: string }> = {
  free:   { label: 'مجاني',  cls: 'badge-ghost' },
  primer: { label: 'برايمر', cls: 'badge-indigo' },
  pro:    { label: 'برو',    cls: 'badge-amber' },
  custom: { label: 'مخصص',  cls: 'badge-success' },
};

const BOOKING_STATUS_LABEL: Record<string, string> = {
  confirmed: 'مؤكد',
  cancelled: 'ملغي',
  completed: 'مكتمل',
  pending:   'معلق',
};

const BOOKING_STATUS_COLOR: Record<string, string> = {
  confirmed: 'text-emerald-400',
  cancelled: 'text-red-400',
  completed: 'text-blue-400',
  pending:   'text-amber-400',
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'owner'>('all');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [overrideAction, setOverrideAction] = useState<OverrideAction>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanTier, setSelectedPlanTier] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await adminApi.listUsers(params);
      setUsers(res.data.data.users ?? []);
      setPagination(res.data.data.pagination);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    plansApi.getAll().then((r) => setPlans(r.data.data ?? [])).catch(() => {});
  }, []);

  const handleAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.action === 'suspend') {
        await adminApi.suspendUser(confirmAction.id);
      } else {
        await adminApi.reactivateUser(confirmAction.id);
      }
      setConfirmAction(null);
      fetchUsers();
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await adminApi.getUserDetail(id);
      setDetailUser(res.data.data);
    } catch {}
  };

  const openOverride = (user: any) => {
    setOverrideAction({
      userId: user._id,
      userName: user.name,
      currentPlan: user.plan ?? 'free',
      durationDays: 30,
      customDays: '',
    });
    setSelectedPlanTier(user.plan ?? 'free');
  };

  const handleOverride = async () => {
    if (!overrideAction || !selectedPlanTier) return;
    setOverrideLoading(true);
    try {
      const days = overrideAction.durationDays === 0
        ? Number(overrideAction.customDays)
        : overrideAction.durationDays;
      const planExpiresAt = days > 0
        ? new Date(Date.now() + days * 86400000).toISOString()
        : undefined;
      await adminApi.overridePlan(overrideAction.userId, { plan: selectedPlanTier, planExpiresAt });
      setOverrideAction(null);
      fetchUsers();
    } finally {
      setOverrideLoading(false);
    }
  };

  const roleBadge = (role: string) => {
    if (role === 'owner') return 'badge badge-amber';
    if (role === 'admin') return 'badge badge-indigo';
    return 'badge badge-ghost';
  };

  const roleLabel = (role: string) => {
    if (role === 'owner') return 'مالك';
    if (role === 'admin') return 'مشرف';
    return 'لاعب';
  };

  const RoleIcon = ({ role }: { role: string }) => {
    if (role === 'owner') return <Star size={11} />;
    if (role === 'admin') return <Shield size={11} />;
    return <User size={11} />;
  };

  const totalPages = pagination?.pages ?? pagination?.totalPages ?? 1;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[--text-primary]">المستخدمون</h1>
          <p className="text-sm text-[--text-tertiary] mt-0.5">
            {pagination ? `${pagination.total} مستخدم مسجّل` : 'جاري التحميل...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الهاتف، البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pr-9"
          />
        </div>
        <div
          className="flex gap-1 p-1 rounded-lg border border-white/10"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          {(['all', 'user', 'owner'] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                roleFilter === r ? 'bg-brand-primary text-white' : 'text-[--text-tertiary] hover:text-[--text-secondary]',
              )}
            >
              {r === 'all' ? 'الكل' : r === 'user' ? 'اللاعبون' : 'المالكون'}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard padding={false}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>الدور</th>
                <th>الخطة</th>
                <th>النقاط</th>
                <th>الحجوزات</th>
                <th>تاريخ التسجيل</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}><div className="h-4 rounded-md bg-white/5 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Users size={40} className="mx-auto mb-3 text-[--text-tertiary] opacity-40" />
                    <p className="text-[--text-tertiary]">لا يوجد مستخدمون مطابقون</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const planCfg = PLAN_CONFIG[u.plan ?? 'free'] ?? PLAN_CONFIG.free;
                  return (
                    <tr key={u._id}>
                      <td>
                        <button
                          onClick={() => openDetail(u._id)}
                          className="text-right hover:text-brand-primary transition-colors flex items-center gap-2.5"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}
                          >
                            {(u.name ?? '?')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[--text-primary]">{u.name ?? '—'}</p>
                            <p className="text-xs text-[--text-tertiary] flex items-center gap-1">
                              <Phone size={10} /> {u.phone ?? u.email ?? ''}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td>
                        <span className={roleBadge(u.role)}>
                          <RoleIcon role={u.role} />
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td>
                        <span className={cn('badge', planCfg.cls)}>{planCfg.label}</span>
                      </td>
                      <td>
                        <span className="tabular-nums text-sm text-amber-400 font-bold">{u.points ?? 0} ✦</span>
                      </td>
                      <td>
                        <span className="tabular-nums font-bold text-[--text-primary]">{u.totalBookings ?? 0}</span>
                      </td>
                      <td className="text-xs text-[--text-tertiary]">{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                      <td>
                        <span className={u.isActive !== false ? 'badge-success' : 'badge-error'}>
                          {u.isActive !== false ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1.5">
                          {u.role === 'owner' && (
                            <button
                              onClick={() => openOverride(u)}
                              className="btn-ghost text-xs px-2.5 py-1 !text-indigo-400 !border-indigo-500/30 flex items-center gap-1"
                            >
                              <CreditCard size={11} /> خطة
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmAction({
                              id: u._id,
                              name: u.name ?? u.phone,
                              action: u.isActive !== false ? 'suspend' : 'reactivate',
                            })}
                            className={u.isActive !== false
                              ? 'btn-danger text-xs px-2.5 py-1'
                              : 'btn-ghost text-xs px-2.5 py-1 !text-emerald-400 !border-emerald-500/30'}
                          >
                            {u.isActive !== false ? 'إيقاف' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.07]">
            <p className="text-xs text-[--text-tertiary]">صفحة {page} من {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
              >السابق</button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
              >التالي</button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction(null); }}
        >
          <div className="glass-card-strong p-6 w-full max-w-sm animate-slide-up">
            <div className="flex justify-center mb-4">
              {confirmAction.action === 'suspend' ? (
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                  <UserX size={24} className="text-red-400" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <UserCheck size={24} className="text-emerald-400" />
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-[--text-primary] text-center mb-2">
              {confirmAction.action === 'suspend' ? 'إيقاف الحساب' : 'تفعيل الحساب'}
            </h3>
            <p className="text-sm text-[--text-secondary] text-center mb-5">
              هل تريد {confirmAction.action === 'suspend' ? 'إيقاف' : 'تفعيل'} حساب{' '}
              <span className="text-[--text-primary] font-semibold">"{confirmAction.name}"</span>؟
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="btn-ghost flex-1">إلغاء</button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all',
                  confirmAction.action === 'suspend' ? 'btn-danger' : 'btn-brand',
                )}
              >
                {actionLoading ? 'جاري...' : confirmAction.action === 'suspend' ? 'إيقاف' : 'تفعيل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Plan Modal */}
      {overrideAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOverrideAction(null); }}
        >
          <div className="glass-card-strong p-6 w-full max-w-sm animate-slide-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[--text-primary] flex items-center gap-2">
                <CreditCard size={16} className="text-brand-primary" /> تعيين خطة
              </h3>
              <button onClick={() => setOverrideAction(null)} className="text-[--text-tertiary] hover:text-[--text-primary]">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[--text-secondary]">
              تعيين خطة للمالك{' '}
              <span className="text-[--text-primary] font-semibold">{overrideAction.userName}</span>
            </p>

            <div>
              <label className="field-label">الخطة الجديدة</label>
              <select
                className="field-select w-full"
                value={selectedPlanTier}
                onChange={(e) => setSelectedPlanTier(e.target.value)}
              >
                {plans.map((p) => (
                  <option key={p._id} value={p.name ?? p.tier}>
                    {p.displayName ?? p.name} — {(p.price ?? 0).toLocaleString('ar-SA')} SYP
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">المدة</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setOverrideAction({ ...overrideAction, durationDays: opt.days, customDays: '' })}
                    className={cn(
                      'px-2 py-2 rounded-lg text-xs font-semibold border transition-all',
                      overrideAction.durationDays === opt.days
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'border-white/10 text-[--text-tertiary] hover:border-white/20 hover:text-[--text-secondary]',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {overrideAction.durationDays === 0 && (
                <input
                  type="number"
                  className="field-input w-full mt-2"
                  placeholder="عدد الأيام"
                  value={overrideAction.customDays}
                  onChange={(e) => setOverrideAction({ ...overrideAction, customDays: e.target.value })}
                  min={1}
                />
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setOverrideAction(null)} className="btn-ghost flex-1">إلغاء</button>
              <button
                onClick={handleOverride}
                disabled={
                  overrideLoading ||
                  !selectedPlanTier ||
                  (overrideAction.durationDays === 0 && !overrideAction.customDays)
                }
                className="btn-brand flex-1"
              >
                {overrideLoading ? 'جاري...' : 'تعيين'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Drawer */}
      {detailUser && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDetailUser(null); }}
        >
          <div
            className="w-full max-w-md h-full overflow-y-auto animate-slide-in-right border-r border-white/[0.08]"
            style={{ background: 'rgba(10,18,13,0.97)', backdropFilter: 'blur(20px)' }}
          >
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.08] z-10"
              style={{ background: 'rgba(10,18,13,0.95)', backdropFilter: 'blur(16px)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}
                >
                  {(detailUser.name ?? '?')[0]}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[--text-primary]">{detailUser.name}</h2>
                  <p className="text-xs text-[--text-tertiary] flex items-center gap-1">
                    <Phone size={10} /> {detailUser.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailUser(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[--text-tertiary] hover:text-[--text-primary]"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Account info */}
              <DrawerSection title="معلومات الحساب">
                <DrawerRow label="الدور" value={detailUser.role === 'owner' ? 'مالك' : 'لاعب'} />
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-sm text-[--text-tertiary]">الخطة</span>
                  <span className={cn('badge', (PLAN_CONFIG[detailUser.plan ?? 'free'] ?? PLAN_CONFIG.free).cls)}>
                    {(PLAN_CONFIG[detailUser.plan ?? 'free'] ?? PLAN_CONFIG.free).label}
                  </span>
                </div>
                <DrawerRow label="مستوى المهارة" value={detailUser.skillLevel ?? '—'} />
                <DrawerRow label="النقاط" value={`${detailUser.points ?? 0} ✦`} />
                <DrawerRow label="تاريخ التسجيل" value={detailUser.createdAt ? formatDate(detailUser.createdAt) : '—'} />
              </DrawerSection>

              {/* Stats */}
              <DrawerSection title="الإحصائيات">
                <div className="grid grid-cols-2 gap-3 px-4 py-3">
                  <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-xl font-bold text-[--text-primary] tabular-nums">
                      {detailUser.stats?.totalBookings ?? 0}
                    </p>
                    <p className="text-xs text-[--text-tertiary] mt-0.5">إجمالي الحجوزات</p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-base font-bold text-emerald-400 tabular-nums">
                      {formatCurrency(detailUser.stats?.totalSpent ?? 0, 'SYP')}
                    </p>
                    <p className="text-xs text-[--text-tertiary] mt-0.5">إجمالي المدفوعات</p>
                  </div>
                </div>
                <DrawerRow label="مكتملة" value={String(detailUser.stats?.completedBookings ?? 0)} />
                <DrawerRow label="ملغاة" value={String(detailUser.stats?.cancelledBookings ?? 0)} />
              </DrawerSection>

              {/* Recent bookings */}
              {(detailUser.recentBookings ?? []).length > 0 && (
                <DrawerSection title="آخر الحجوزات">
                  {(detailUser.recentBookings ?? []).slice(0, 5).map((b: any) => (
                    <div key={b._id} className="flex justify-between items-center px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-[--text-primary]">{b.facility?.name ?? '—'}</p>
                        <p className="text-xs text-[--text-tertiary] flex items-center gap-1">
                          <CalendarDays size={10} /> {b.date} · {formatTime12h(b.startTime)}
                        </p>
                      </div>
                      <span className={cn('text-xs font-semibold', BOOKING_STATUS_COLOR[b.status] ?? 'text-[--text-tertiary]')}>
                        {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </div>
                  ))}
                </DrawerSection>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                {detailUser.role === 'owner' && (
                  <button
                    onClick={() => { openOverride(detailUser); setDetailUser(null); }}
                    className="btn-ghost flex-1 flex items-center gap-1.5 justify-center !text-indigo-400 !border-indigo-500/30"
                  >
                    <CreditCard size={14} /> تعيين خطة
                  </button>
                )}
                <button
                  onClick={() => {
                    setConfirmAction({
                      id: detailUser._id,
                      name: detailUser.name,
                      action: detailUser.isActive !== false ? 'suspend' : 'reactivate',
                    });
                    setDetailUser(null);
                  }}
                  className={cn(
                    'flex-1 flex items-center gap-1.5 justify-center',
                    detailUser.isActive !== false ? 'btn-danger' : 'btn-brand',
                  )}
                >
                  {detailUser.isActive !== false
                    ? <><PowerOff size={14} /> إيقاف</>
                    : <><Power size={14} /> تفعيل</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[--text-tertiary] mb-2.5">{title}</p>
      <div className="glass-card-subtle divide-y divide-white/[0.05] rounded-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function DrawerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-sm text-[--text-tertiary]">{label}</span>
      <span className="text-sm font-semibold text-[--text-primary]">{value}</span>
    </div>
  );
}
