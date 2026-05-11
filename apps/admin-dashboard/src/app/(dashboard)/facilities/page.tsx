'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

const SPORT_LABELS: Record<string, string> = {
  football: '⚽ كرة القدم', basketball: '🏀 كرة السلة', tennis: '🎾 تنس',
  volleyball: '🏐 كرة الطائرة', padel: '🏓 بادل', squash: '🎱 إسكواش',
};

type ConfirmAction = { id: string; name: string; action: 'suspend' | 'restore' } | null;

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [page, setPage]             = useState(1);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailFacility, setDetailFacility] = useState<any>(null);

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

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); }, 400);
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
      setDetailFacility(res.data.data);
    } catch {}
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">الملاعب والمالكون</h1>
          <p className="text-sm text-[--text-tertiary] mt-0.5">
            {pagination ? `${pagination.total} ملعب مسجل` : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <input
            type="text"
            placeholder="ابحث باسم الملعب، العنوان، المالك..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pl-8 w-full"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--text-tertiary] text-xs">🔍</span>
        </div>
        <div className="flex gap-1 p-1 rounded-lg border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['all', 'active', 'suspended'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
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
                <th>الرياضات</th>
                <th>السعر/ساعة</th>
                <th>الحجوزات</th>
                <th>تاريخ التسجيل</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}><div className="h-4 rounded bg-white/5 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : facilities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[--text-tertiary]">
                    <div className="text-4xl mb-2">🏟️</div>
                    لا توجد ملاعب مطابقة
                  </td>
                </tr>
              ) : (
                facilities.map((f) => (
                  <tr key={f._id}>
                    <td>
                      <button onClick={() => openDetail(f._id)} className="text-right hover:text-brand-primary transition-colors">
                        <p className="text-sm font-medium text-[--text-primary]">{f.name}</p>
                        <p className="text-xs text-[--text-tertiary] flex items-center gap-1">
                          <MapPin size={14} className="text-brand-primary" />
                          <span>{f.address}</span>
                        </p>
                      </button>
                    </td>
                    <td>
                      <p className="text-sm text-[--text-primary]">{f.owner?.name ?? '—'}</p>
                      <p className="text-xs text-[--text-tertiary]">{f.owner?.phone ?? ''}</p>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(f.sport ?? []).slice(0, 2).map((s: string) => (
                          <span key={s} className="badge badge-ghost text-xs">{SPORT_LABELS[s] ?? s}</span>
                        ))}
                        {(f.sport?.length ?? 0) > 2 && (
                          <span className="badge badge-ghost">+{f.sport.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="tabular-nums text-sm">{formatCurrency(f.pricePerHour ?? 0, 'SYP')}</span>
                    </td>
                    <td>
                      <span className="tabular-nums font-semibold text-[--text-primary]">{f.totalBookings ?? 0}</span>
                    </td>
                    <td className="text-xs">
                      {f.createdAt ? formatDate(f.createdAt) : '—'}
                    </td>
                    <td>
                      <span className={f.isActive ? 'badge-success' : 'badge-error'}>
                        {f.isActive ? '● نشط' : '● موقوف'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmAction({
                            id: f._id, name: f.name,
                            action: f.isActive ? 'suspend' : 'restore',
                          })}
                          className={f.isActive ? 'btn-danger text-xs px-2 py-1' : 'btn-ghost text-xs px-2 py-1 !text-emerald-400 !border-emerald-500/30'}
                        >
                          {f.isActive ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
            <p className="text-xs text-[--text-tertiary]">
              صفحة {page} من {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
              >
                السابق
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
              >
                التالي
              </button>
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
              {confirmAction.action === 'suspend' ? 'إيقاف الملعب' : 'تفعيل الملعب'}
            </h3>
            <p className="text-sm text-[--text-secondary] text-center mb-6">
              هل تريد {confirmAction.action === 'suspend' ? 'إيقاف' : 'تفعيل'}{' '}
              <span className="text-[--text-primary] font-semibold">"{confirmAction.name}"</span>؟
              {confirmAction.action === 'suspend' && (
                <span className="block mt-1 text-[--text-tertiary] text-xs">
                  سيُخفى الملعب من التطبيق مع الحفاظ على سجل الحجوزات
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="btn-ghost flex-1">
                إلغاء
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all',
                  confirmAction.action === 'suspend'
                    ? 'btn-danger'
                    : 'btn-brand',
                  actionLoading && 'opacity-60 cursor-not-allowed',
                )}
              >
                {actionLoading ? 'جاري...' : confirmAction.action === 'suspend' ? 'إيقاف' : 'تفعيل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Facility Detail Drawer */}
      {detailFacility && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div
            className="w-full max-w-md h-full glass-card-strong overflow-y-auto animate-slide-up border-r border-white/10"
            style={{ borderRadius: '0' }}
          >
            <div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/8"
              style={{ background: 'rgba(20,24,48,0.95)', backdropFilter: 'blur(12px)' }}>
              <h2 className="text-base font-bold text-[--text-primary]">{detailFacility.name}</h2>
              <button onClick={() => setDetailFacility(null)} className="text-[--text-tertiary] hover:text-[--text-primary] text-xl">✕</button>
            </div>

            <div className="p-5 space-y-5">
              <DetailSection title="معلومات الملعب">
                <DetailRow label="العنوان" value={detailFacility.address ?? '—'} />
                <DetailRow label="الهاتف" value={detailFacility.phone ?? '—'} />
                <DetailRow label="السعر/ساعة" value={formatCurrency(detailFacility.pricePerHour ?? 0, 'SYP')} />
                <DetailRow label="مدة الوقت" value={`${detailFacility.slotDurationMinutes ?? 60} دقيقة`} />
                <DetailRow label="التقييم" value={detailFacility.rating > 0 ? `⭐ ${detailFacility.rating.toFixed(1)}` : '—'} />
              </DetailSection>

              <DetailSection title="المالك">
                <DetailRow label="الاسم" value={detailFacility.owner?.name ?? '—'} />
                <DetailRow label="الهاتف" value={detailFacility.owner?.phone ?? '—'} />
                <DetailRow label="الخطة" value={detailFacility.owner?.plan ?? '—'} />
              </DetailSection>

              <DetailSection title="الإحصاءات">
                <DetailRow label="إجمالي الحجوزات" value={String(detailFacility.stats?.totalBookings ?? 0)} />
                <DetailRow label="إجمالي الإيرادات" value={formatCurrency(detailFacility.stats?.totalRevenue ?? 0, 'SYP')} />
                <DetailRow label="إيرادات هذا الشهر" value={formatCurrency(detailFacility.stats?.monthRevenue ?? 0, 'SYP')} />
              </DetailSection>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setConfirmAction({
                      id: detailFacility._id,
                      name: detailFacility.name,
                      action: detailFacility.isActive ? 'suspend' : 'restore',
                    });
                    setDetailFacility(null);
                  }}
                  className={detailFacility.isActive ? 'btn-danger flex-1' : 'btn-brand flex-1'}
                >
                  {detailFacility.isActive ? '⏸ إيقاف الملعب' : '▶ تفعيل الملعب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary] mb-3">{title}</p>
      <div className="glass-card-subtle divide-y divide-white/5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-sm text-[--text-tertiary]">{label}</span>
      <span className="text-sm font-medium text-[--text-primary]">{value}</span>
    </div>
  );
}
