'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { MapPin, Search, Building2, Edit2, Power, PowerOff, X, ChevronRight, ChevronLeft, Phone, Star, Calendar, Trophy } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const SPORT_LABELS: Record<string, string> = {
  football:   'كرة القدم',
  basketball: 'كرة السلة',
  tennis:     'تنس',
  volleyball: 'كرة الطائرة',
  padel:      'بادل',
  squash:     'إسكواش',
};

const PLAN_CONFIG: Record<string, { label: string; cls: string }> = {
  free:   { label: 'مجاني',  cls: 'badge-ghost' },
  primer: { label: 'برايمر', cls: 'badge-indigo' },
  pro:    { label: 'برو',    cls: 'badge-amber' },
  custom: { label: 'مخصص',  cls: 'badge-success' },
};

// ── Types ─────────────────────────────────────────────────────────────────────

type ConfirmAction = { id: string; name: string; action: 'suspend' | 'restore' } | null;
type DrawerMode = 'detail' | 'edit';

// ── Component ─────────────────────────────────────────────────────────────────

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [drawerFacility, setDrawerFacility] = useState<any>(null);
  const [drawerStats, setDrawerStats] = useState<Record<string, { count: number; revenue: number }>>({});
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('detail');
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';
      const res = await adminApi.listFacilities(params);
      setFacilities(res.data.data.facilities ?? []);
      setPagination(res.data.data.pagination);
    } catch {
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.action === 'suspend') {
        await adminApi.suspendFacility(confirmAction.id);
      } else {
        await adminApi.restoreFacility(confirmAction.id);
      }
      setConfirmAction(null);
      fetchFacilities();
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await adminApi.getFacilityDetail(id);
      const { facility, bookingStats } = res.data.data;
      const f = facility ?? res.data.data;
      setDrawerFacility(f);
      setDrawerStats(bookingStats ?? {});
      setDrawerMode('detail');
      setEditForm({
        name: f.name ?? '',
        address: f.address ?? '',
        phone: f.phone ?? '',
        pricePerSlot: f.pricePerSlot ?? f.pricePerHour ?? 0,
        slotDuration: f.slotDuration ?? f.slotDurationMinutes ?? 60,
      });
    } catch {}
  };

  const handleEdit = async () => {
    if (!drawerFacility) return;
    setEditLoading(true);
    try {
      await adminApi.updateFacility(drawerFacility._id, editForm);
      const updated = { ...drawerFacility, ...editForm };
      setDrawerFacility(updated);
      setDrawerMode('detail');
      fetchFacilities();
    } finally {
      setEditLoading(false);
    }
  };

  const getOwner = (f: any) => f.ownerId ?? f.owner ?? null;
  const getTotalBookings = (stats: Record<string, { count: number; revenue: number }>) =>
    Object.values(stats).reduce((s, v) => s + v.count, 0);
  const getTotalRevenue = (stats: Record<string, { count: number; revenue: number }>) =>
    Object.values(stats).reduce((s, v) => s + v.revenue, 0);

  const STATUS_LABELS: Record<string, string> = {
    confirmed: 'مؤكدة',
    completed: 'مكتملة',
    cancelled: 'ملغاة',
    pending:   'معلقة',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[--text-primary]">الملاعب والمالكون</h1>
          <p className="text-sm text-[--text-tertiary] mt-0.5">
            {pagination ? `${pagination.total} ملعب مسجل` : 'جاري التحميل...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
          <input
            type="text"
            placeholder="ابحث باسم الملعب أو العنوان..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pr-9"
          />
        </div>
        <div
          className="flex gap-1 p-1 rounded-lg border border-white/10"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          {(['all', 'active', 'suspended'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                statusFilter === s ? 'bg-brand-primary text-white' : 'text-[--text-tertiary] hover:text-[--text-secondary]',
              )}
            >
              {s === 'all' ? 'الكل' : s === 'active' ? 'نشط' : 'موقوف'}
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
                <th>الملعب</th>
                <th>المالك</th>
                <th>الخطة</th>
                <th>الرياضات</th>
                <th>السعر/جلسة</th>
                <th>التقييم</th>
                <th>تاريخ التسجيل</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j}><div className="h-4 rounded-md bg-white/5 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : facilities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <Building2 size={40} className="mx-auto mb-3 text-[--text-tertiary] opacity-40" />
                    <p className="text-[--text-tertiary]">لا توجد ملاعب مطابقة</p>
                  </td>
                </tr>
              ) : (
                facilities.map((f) => {
                  const owner = getOwner(f);
                  const sports = f.sports ?? f.sport ?? [];
                  const planKey = owner?.plan ?? 'free';
                  const planCfg = PLAN_CONFIG[planKey] ?? PLAN_CONFIG.free;
                  return (
                    <tr key={f._id}>
                      {/* Name + address */}
                      <td>
                        <button
                          onClick={() => openDetail(f._id)}
                          className="text-right hover:text-brand-primary transition-colors"
                        >
                          <p className="text-sm font-semibold text-[--text-primary]">{f.name}</p>
                          <p className="text-xs text-[--text-tertiary] flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-brand-primary flex-shrink-0" />
                            <span className="truncate max-w-[160px]">{f.address ?? '—'}</span>
                          </p>
                        </button>
                      </td>

                      {/* Owner */}
                      <td>
                        <p className="text-sm font-medium text-[--text-primary]">{owner?.name ?? '—'}</p>
                        <p className="text-xs text-[--text-tertiary] flex items-center gap-1 mt-0.5">
                          {owner?.phone && <><Phone size={10} /> {owner.phone}</>}
                        </p>
                      </td>

                      {/* Plan */}
                      <td>
                        <span className={cn('badge', planCfg.cls)}>{planCfg.label}</span>
                      </td>

                      {/* Sports */}
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {sports.slice(0, 2).map((s: string) => (
                            <span key={s} className="badge badge-ghost text-xs">
                              {SPORT_LABELS[s] ?? s}
                            </span>
                          ))}
                          {sports.length > 2 && (
                            <span className="badge badge-ghost text-xs">+{sports.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td>
                        <span className="tabular-nums text-sm font-semibold text-[--text-primary]">
                          {formatCurrency(f.pricePerSlot ?? f.pricePerHour ?? 0, 'SYP')}
                        </span>
                      </td>

                      {/* Rating */}
                      <td>
                        {(f.rating ?? 0) > 0 ? (
                          <span className="text-amber-400 text-sm flex items-center gap-1">
                            <Star size={12} fill="currentColor" />
                            {f.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-[--text-tertiary]">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="text-xs text-[--text-tertiary]">
                        {f.createdAt ? formatDate(f.createdAt) : '—'}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={f.isActive ? 'badge-success' : 'badge-error'}>
                          {f.isActive ? 'نشط' : 'موقوف'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openDetail(f._id)}
                            className="btn-ghost text-xs px-2.5 py-1"
                          >
                            تفاصيل
                          </button>
                          <button
                            onClick={() => setConfirmAction({
                              id: f._id,
                              name: f.name,
                              action: f.isActive ? 'suspend' : 'restore',
                            })}
                            className={f.isActive ? 'btn-danger text-xs px-2.5 py-1' : 'btn-ghost text-xs px-2.5 py-1 !text-emerald-400 !border-emerald-500/30'}
                          >
                            {f.isActive ? 'إيقاف' : 'تفعيل'}
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

        {/* Pagination */}
        {pagination && (pagination.pages ?? pagination.totalPages) > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.07]">
            <p className="text-xs text-[--text-tertiary]">
              صفحة {page} من {pagination.pages ?? pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronRight size={14} /> السابق
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages ?? pagination.totalPages, p + 1))}
                disabled={page >= (pagination.pages ?? pagination.totalPages)}
                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40 flex items-center gap-1"
              >
                التالي <ChevronLeft size={14} />
              </button>
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
                <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
                  <PowerOff size={24} className="text-red-400" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Power size={24} className="text-emerald-400" />
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-[--text-primary] text-center mb-2">
              {confirmAction.action === 'suspend' ? 'إيقاف الملعب' : 'تفعيل الملعب'}
            </h3>
            <p className="text-sm text-[--text-secondary] text-center mb-1">
              هل تريد {confirmAction.action === 'suspend' ? 'إيقاف' : 'تفعيل'}{' '}
              <span className="text-[--text-primary] font-semibold">"{confirmAction.name}"</span>؟
            </p>
            {confirmAction.action === 'suspend' && (
              <p className="text-center text-xs text-[--text-tertiary] mb-5">
                سيُخفى الملعب من التطبيق مع الحفاظ على سجل الحجوزات
              </p>
            )}
            <div className="flex gap-3 mt-5">
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

      {/* Detail / Edit Drawer */}
      {drawerFacility && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDrawerFacility(null); }}
        >
          <div
            className="w-full max-w-md h-full overflow-y-auto animate-slide-in-right border-r border-white/[0.08]"
            style={{ background: 'rgba(10,18,13,0.97)', backdropFilter: 'blur(20px)' }}
          >
            {/* Drawer Header */}
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.08] z-10"
              style={{ background: 'rgba(10,18,13,0.95)', backdropFilter: 'blur(16px)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.25)' }}
                >
                  <Building2 size={16} className="text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[--text-primary]">{drawerFacility.name}</h2>
                  <p className="text-xs text-[--text-tertiary] flex items-center gap-1">
                    <MapPin size={10} /> {drawerFacility.address ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {drawerMode === 'detail' && (
                  <button
                    onClick={() => setDrawerMode('edit')}
                    className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1.5"
                  >
                    <Edit2 size={12} /> تعديل
                  </button>
                )}
                <button
                  onClick={() => setDrawerFacility(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[--text-tertiary] hover:text-[--text-primary] transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {drawerMode === 'detail' ? (
                <>
                  {/* Status + actions */}
                  <div className="flex items-center gap-3">
                    <span className={drawerFacility.isActive ? 'badge-success' : 'badge-error'}>
                      {drawerFacility.isActive ? 'نشط' : 'موقوف'}
                    </span>
                    <button
                      onClick={() => {
                        setConfirmAction({
                          id: drawerFacility._id,
                          name: drawerFacility.name,
                          action: drawerFacility.isActive ? 'suspend' : 'restore',
                        });
                        setDrawerFacility(null);
                      }}
                      className={drawerFacility.isActive ? 'btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5' : 'btn-brand text-xs px-3 py-1.5 flex items-center gap-1.5'}
                    >
                      {drawerFacility.isActive
                        ? <><PowerOff size={12} /> إيقاف الملعب</>
                        : <><Power size={12} /> تفعيل الملعب</>}
                    </button>
                  </div>

                  {/* Facility info */}
                  <InfoSection title="معلومات الملعب">
                    <InfoRow label="الهاتف" value={drawerFacility.phone ?? '—'} icon={<Phone size={12} />} />
                    <InfoRow
                      label="الرياضات"
                      value={(drawerFacility.sports ?? drawerFacility.sport ?? [])
                        .map((s: string) => SPORT_LABELS[s] ?? s).join(' · ') || '—'}
                    />
                    <InfoRow
                      label="مدة الجلسة"
                      value={`${drawerFacility.slotDuration ?? drawerFacility.slotDurationMinutes ?? 60} دقيقة`}
                    />
                    <InfoRow
                      label="السعر/جلسة"
                      value={formatCurrency(drawerFacility.pricePerSlot ?? drawerFacility.pricePerHour ?? 0, 'SYP')}
                    />
                    {(drawerFacility.rating ?? 0) > 0 && (
                      <InfoRow
                        label="التقييم"
                        value={`⭐ ${drawerFacility.rating.toFixed(1)}`}
                      />
                    )}
                    <InfoRow
                      label="تاريخ التسجيل"
                      value={drawerFacility.createdAt ? formatDate(drawerFacility.createdAt) : '—'}
                      icon={<Calendar size={12} />}
                    />
                  </InfoSection>

                  {/* Owner info */}
                  {(() => {
                    const owner = getOwner(drawerFacility);
                    if (!owner) return null;
                    const planCfg = PLAN_CONFIG[owner.plan ?? 'free'] ?? PLAN_CONFIG.free;
                    return (
                      <InfoSection title="المالك">
                        <InfoRow label="الاسم" value={owner.name ?? '—'} />
                        <InfoRow label="الهاتف" value={owner.phone ?? '—'} icon={<Phone size={12} />} />
                        <div className="flex justify-between items-center px-4 py-2.5">
                          <span className="text-sm text-[--text-tertiary]">الخطة</span>
                          <span className={cn('badge', planCfg.cls)}>{planCfg.label}</span>
                        </div>
                        {owner.planExpiresAt && (
                          <InfoRow label="انتهاء الخطة" value={formatDate(owner.planExpiresAt)} />
                        )}
                        <InfoRow label="النقاط" value={`${owner.points ?? 0} ✦`} />
                      </InfoSection>
                    );
                  })()}

                  {/* Booking stats */}
                  <InfoSection title="إحصائيات الحجوزات">
                    <div className="grid grid-cols-2 gap-3 px-4 py-3">
                      <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-xl font-bold text-[--text-primary] tabular-nums">
                          {getTotalBookings(drawerStats)}
                        </p>
                        <p className="text-xs text-[--text-tertiary] mt-0.5">إجمالي الحجوزات</p>
                      </div>
                      <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-base font-bold text-emerald-400 tabular-nums">
                          {formatCurrency(getTotalRevenue(drawerStats), 'SYP')}
                        </p>
                        <p className="text-xs text-[--text-tertiary] mt-0.5">إجمالي الإيرادات</p>
                      </div>
                    </div>
                    {Object.entries(drawerStats).map(([status, data]) => (
                      <InfoRow
                        key={status}
                        label={STATUS_LABELS[status] ?? status}
                        value={`${data.count} حجز · ${formatCurrency(data.revenue, 'SYP')}`}
                      />
                    ))}
                  </InfoSection>
                </>
              ) : (
                /* Edit Mode */
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => setDrawerMode('detail')}
                      className="text-xs text-[--text-tertiary] hover:text-[--text-primary] flex items-center gap-1"
                    >
                      <ChevronRight size={14} /> رجوع
                    </button>
                    <span className="text-xs text-[--text-tertiary]">/</span>
                    <span className="text-xs text-[--text-primary]">تعديل الملعب</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="field-label">اسم الملعب</label>
                      <input
                        className="field-input w-full"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="field-label">العنوان</label>
                      <input
                        className="field-input w-full"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="field-label">رقم الهاتف</label>
                      <input
                        className="field-input w-full"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="field-label">السعر/جلسة (SYP)</label>
                        <input
                          type="number"
                          className="field-input w-full"
                          value={editForm.pricePerSlot}
                          onChange={(e) => setEditForm({ ...editForm, pricePerSlot: Number(e.target.value) })}
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="field-label">مدة الجلسة (دقيقة)</label>
                        <input
                          type="number"
                          className="field-input w-full"
                          value={editForm.slotDuration}
                          onChange={(e) => setEditForm({ ...editForm, slotDuration: Number(e.target.value) })}
                          min={15}
                          step={15}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setDrawerMode('detail')} className="btn-ghost flex-1">
                        إلغاء
                      </button>
                      <button
                        onClick={handleEdit}
                        disabled={editLoading || !editForm.name?.trim()}
                        className="btn-brand flex-1 flex items-center gap-2"
                      >
                        {editLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[--text-tertiary] mb-2.5">{title}</p>
      <div className="glass-card-subtle divide-y divide-white/[0.05] rounded-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 gap-4">
      <span className="text-sm text-[--text-tertiary] flex items-center gap-1.5 flex-shrink-0">
        {icon}{label}
      </span>
      <span className="text-sm font-semibold text-[--text-primary] text-left break-words max-w-[58%]">{value}</span>
    </div>
  );
}
