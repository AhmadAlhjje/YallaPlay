'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi, plansApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatDate, formatCurrency, formatTime12h, cn } from '@/lib/utils';

type ConfirmAction = { id: string; name: string; action: 'suspend' | 'reactivate' } | null;

type OverrideAction = { userId: string; userName: string; currentPlan: string } | null;

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
    setOverrideAction({ userId: user._id, userName: user.name, currentPlan: user.plan ?? 'free' });
    setSelectedPlanTier(user.plan ?? 'free');
  };

  const handleOverride = async () => {
    if (!overrideAction || !selectedPlanTier) return;
    setOverrideLoading(true);
    try {
      await adminApi.overridePlan(overrideAction.userId, selectedPlanTier);
      setOverrideAction(null);
      fetchUsers();
    } finally {
      setOverrideLoading(false);
    }
  };

  const roleBadge = (role: string) =>
    role === 'owner'
      ? 'badge badge-ghost !text-amber-400 !border-amber-500/30'
      : role === 'admin'
      ? 'badge badge-ghost !text-indigo-400 !border-indigo-500/30'
      : 'badge badge-ghost';

  const roleLabel = (role: string) =>
    role === 'owner' ? '👑 مالك' : role === 'admin' ? '🛡 أدمن' : '👤 لاعب';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">المستخدمون</h1>
          <p className="text-sm text-[--text-tertiary] mt-0.5">
            {pagination ? `${pagination.total} مستخدم مسجّل` : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <input
            type="text"
            placeholder="ابحث بالاسم، الهاتف، البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pl-8 w-full"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--text-tertiary] text-xs">🔍</span>
        </div>
        <div className="flex gap-1 p-1 rounded-lg border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['all', 'user', 'owner'] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                roleFilter === r ? 'bg-brand-primary text-white' : 'text-[--text-tertiary] hover:text-[--text-secondary]',
              )}
            >
              {r === 'all' ? 'الكل' : r === 'user' ? 'لاعبون' : 'مالكون'}
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
                      <td key={j}><div className="h-4 rounded bg-white/5 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[--text-tertiary]">
                    <div className="text-4xl mb-2">👥</div>
                    لا يوجد مستخدمون مطابقون
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <button onClick={() => openDetail(u._id)} className="text-right hover:text-brand-primary transition-colors flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}
                        >
                          {(u.name ?? '?')[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[--text-primary] text-right">{u.name ?? '—'}</p>
                          <p className="text-xs text-[--text-tertiary]">{u.phone ?? u.email ?? ''}</p>
                        </div>
                      </button>
                    </td>
                    <td><span className={roleBadge(u.role)}>{roleLabel(u.role)}</span></td>
                    <td>
                      <span className="text-xs text-[--text-secondary] capitalize">{u.plan ?? 'free'}</span>
                    </td>
                    <td>
                      <span className="tabular-nums text-sm text-amber-400 font-semibold">{u.points ?? 0} ✦</span>
                    </td>
                    <td>
                      <span className="tabular-nums font-semibold text-[--text-primary]">{u.totalBookings ?? 0}</span>
                    </td>
                    <td className="text-xs">{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                    <td>
                      <span className={u.isActive !== false ? 'badge-success' : 'badge-error'}>
                        {u.isActive !== false ? '● نشط' : '● موقوف'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        {u.role === 'owner' && (
                          <button
                            onClick={() => openOverride(u)}
                            className="btn-ghost text-xs px-2 py-1 !text-indigo-400 !border-indigo-500/30"
                          >
                            خطة
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmAction({
                            id: u._id, name: u.name ?? u.phone,
                            action: u.isActive !== false ? 'suspend' : 'reactivate',
                          })}
                          className={u.isActive !== false ? 'btn-danger text-xs px-2 py-1' : 'btn-ghost text-xs px-2 py-1 !text-emerald-400 !border-emerald-500/30'}
                        >
                          {u.isActive !== false ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
            <p className="text-xs text-[--text-tertiary]">صفحة {page} من {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
              >السابق</button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
              >التالي</button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card-strong p-6 w-full max-w-sm animate-slide-up">
            <div className="text-4xl text-center mb-4">
              {confirmAction.action === 'suspend' ? '⚠️' : '✅'}
            </div>
            <h3 className="text-lg font-bold text-[--text-primary] text-center mb-2">
              {confirmAction.action === 'suspend' ? 'إيقاف المستخدم' : 'تفعيل المستخدم'}
            </h3>
            <p className="text-sm text-[--text-secondary] text-center mb-6">
              هل تريد {confirmAction.action === 'suspend' ? 'إيقاف' : 'تفعيل'}{' '}
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
                  actionLoading && 'opacity-60 cursor-not-allowed',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card-strong p-6 w-full max-w-sm animate-slide-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[--text-primary]">تعيين خطة</h3>
              <button onClick={() => setOverrideAction(null)} className="text-[--text-tertiary] text-xl">✕</button>
            </div>
            <p className="text-sm text-[--text-secondary]">
              تعيين خطة للمالك <span className="text-[--text-primary] font-semibold">{overrideAction.userName}</span>
            </p>
            <select
              className="field-input w-full"
              value={selectedPlanTier}
              onChange={(e) => setSelectedPlanTier(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p._id} value={p.tier}>{p.name} — {p.price.toLocaleString()} SYP</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setOverrideAction(null)} className="btn-ghost flex-1">إلغاء</button>
              <button
                onClick={handleOverride}
                disabled={overrideLoading || !selectedPlanTier}
                className={cn('btn-brand flex-1', overrideLoading && 'opacity-60')}
              >
                {overrideLoading ? 'جاري...' : 'تعيين'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Drawer */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md h-full glass-card-strong overflow-y-auto animate-slide-up border-r border-white/10" style={{ borderRadius: 0 }}>
            <div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/8"
              style={{ background: 'rgba(20,24,48,0.95)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
                  {(detailUser.name ?? '?')[0]}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[--text-primary]">{detailUser.name}</h2>
                  <p className="text-xs text-[--text-tertiary]">{detailUser.phone}</p>
                </div>
              </div>
              <button onClick={() => setDetailUser(null)} className="text-[--text-tertiary] hover:text-[--text-primary] text-xl">✕</button>
            </div>

            <div className="p-5 space-y-5">
              <UserDetailSection title="معلومات الحساب">
                <UserDetailRow label="الدور" value={detailUser.role === 'owner' ? '👑 مالك' : '👤 لاعب'} />
                <UserDetailRow label="الخطة" value={detailUser.plan ?? 'free'} />
                <UserDetailRow label="مستوى المهارة" value={detailUser.skillLevel ?? '—'} />
                <UserDetailRow label="النقاط" value={`${detailUser.points ?? 0} ✦`} />
                <UserDetailRow label="تاريخ التسجيل" value={detailUser.createdAt ? formatDate(detailUser.createdAt) : '—'} />
              </UserDetailSection>

              <UserDetailSection title="إحصاءات">
                <UserDetailRow label="إجمالي الحجوزات" value={String(detailUser.stats?.totalBookings ?? 0)} />
                <UserDetailRow label="الحجوزات المكتملة" value={String(detailUser.stats?.completedBookings ?? 0)} />
                <UserDetailRow label="الحجوزات الملغاة" value={String(detailUser.stats?.cancelledBookings ?? 0)} />
                <UserDetailRow label="إجمالي المدفوعات" value={formatCurrency(detailUser.stats?.totalSpent ?? 0, 'SYP')} />
              </UserDetailSection>

              {(detailUser.recentBookings ?? []).length > 0 && (
                <UserDetailSection title="آخر الحجوزات">
                  {(detailUser.recentBookings ?? []).slice(0, 5).map((b: any) => (
                    <div key={b._id} className="flex justify-between items-center px-4 py-2.5">
                      <div>
                        <p className="text-sm text-[--text-primary]">{b.facility?.name ?? '—'}</p>
                        <p className="text-xs text-[--text-tertiary]">{b.date} · {formatTime12h(b.startTime)}</p>
                      </div>
                      <span className={cn(
                        'text-xs font-medium',
                        b.status === 'confirmed' ? 'text-emerald-400' :
                        b.status === 'cancelled' ? 'text-red-400' :
                        b.status === 'completed' ? 'text-blue-400' : 'text-amber-400',
                      )}>
                        {b.status === 'confirmed' ? 'مؤكد' : b.status === 'cancelled' ? 'ملغي' : b.status === 'completed' ? 'مكتمل' : 'معلق'}
                      </span>
                    </div>
                  ))}
                </UserDetailSection>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setConfirmAction({
                      id: detailUser._id,
                      name: detailUser.name,
                      action: detailUser.isActive !== false ? 'suspend' : 'reactivate',
                    });
                    setDetailUser(null);
                  }}
                  className={detailUser.isActive !== false ? 'btn-danger flex-1' : 'btn-brand flex-1'}
                >
                  {detailUser.isActive !== false ? '⏸ إيقاف الحساب' : '▶ تفعيل الحساب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserDetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary] mb-3">{title}</p>
      <div className="glass-card-subtle divide-y divide-white/5">{children}</div>
    </div>
  );
}

function UserDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-sm text-[--text-tertiary]">{label}</span>
      <span className="text-sm font-medium text-[--text-primary]">{value}</span>
    </div>
  );
}
