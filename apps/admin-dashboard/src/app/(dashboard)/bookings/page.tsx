'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'معلّق',   cls: 'badge-warning' },
  confirmed: { label: 'مؤكّد',   cls: 'badge-success' },
  completed: { label: 'مكتمل',   cls: 'badge-info' },
  cancelled: { label: 'ملغي',    cls: 'badge-error' },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'نقداً',
  card: 'بطاقة',
  apple_pay: 'Apple Pay',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [detailBooking, setDetailBooking] = useState<any>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await adminApi.listBookings(params);
      setBookings(res.data.data.bookings ?? []);
      setPagination(res.data.data.pagination);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, from, to]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const openDetail = async (id: string) => {
    const found = bookings.find((b) => b._id === id);
    if (found) setDetailBooking(found);
  };

  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">الحجوزات</h1>
          <p className="text-sm text-[--text-tertiary] mt-0.5">
            {pagination ? `${pagination.total} حجز` : ''}
          </p>
        </div>
      </div>

      {/* Status summary strip */}
      {!loading && bookings.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status as typeof statusFilter); setPage(1); }}
              className={cn(
                'glass-card text-center py-3 transition-all cursor-pointer border',
                statusFilter === status ? 'border-brand-primary/40' : 'border-transparent',
              )}
            >
              <p className="text-lg font-bold tabular-nums text-[--text-primary]">{statusCounts[status] ?? 0}</p>
              <p className="text-xs text-[--text-tertiary] mt-0.5">{cfg.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <GlassCard className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <input
            type="text"
            placeholder="ابحث بالمستخدم، الملعب، المرجع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pl-8 w-full"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--text-tertiary] text-xs">🔍</span>
        </div>

        <div className="flex gap-1 p-1 rounded-lg border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                statusFilter === s ? 'bg-brand-primary text-white' : 'text-[--text-tertiary] hover:text-[--text-secondary]',
              )}
            >
              {s === 'all' ? 'الكل' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="field-input text-xs w-36"
          />
          <span className="text-[--text-tertiary] text-xs">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="field-input text-xs w-36"
          />
        </div>

        {(from || to) && (
          <button
            onClick={() => { setFrom(''); setTo(''); setPage(1); }}
            className="text-xs text-[--text-tertiary] hover:text-[--text-primary] transition-colors"
          >
            ✕ مسح التاريخ
          </button>
        )}
      </GlassCard>

      {/* Table */}
      <GlassCard padding={false}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>المرجع</th>
                <th>المستخدم</th>
                <th>الملعب</th>
                <th>التاريخ والوقت</th>
                <th>المبلغ</th>
                <th>الدفع</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
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
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[--text-tertiary]">
                    <div className="text-4xl mb-2">📅</div>
                    لا توجد حجوزات مطابقة
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const sc = STATUS_CONFIG[b.status] ?? { label: b.status, cls: 'badge-ghost' };
                  return (
                    <tr key={b._id} onClick={() => openDetail(b._id)} className="cursor-pointer">
                      <td>
                        <span className="font-mono text-xs text-[--text-tertiary]">
                          #{(b.bookingRef ?? b._id).slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <p className="text-sm text-[--text-primary]">{b.user?.name ?? '—'}</p>
                        <p className="text-xs text-[--text-tertiary]">{b.user?.phone ?? ''}</p>
                      </td>
                      <td>
                        <p className="text-sm text-[--text-primary]">{b.facility?.name ?? '—'}</p>
                        <p className="text-xs text-[--text-tertiary]">📍 {b.facility?.address ?? ''}</p>
                      </td>
                      <td>
                        <p className="text-sm tabular-nums">{b.date}</p>
                        <p className="text-xs text-[--text-tertiary]">{b.startTime} – {b.endTime}</p>
                      </td>
                      <td>
                        <span className="tabular-nums text-sm font-semibold text-emerald-400">
                          {formatCurrency(b.totalPrice ?? 0, 'SYP')}
                        </span>
                      </td>
                      <td className="text-xs text-[--text-secondary]">
                        {PAYMENT_LABELS[b.paymentMethod] ?? b.paymentMethod ?? '—'}
                      </td>
                      <td>
                        <span className={sc.cls}>{sc.label}</span>
                      </td>
                      <td className="text-xs text-[--text-tertiary]">
                        {b.createdAt ? formatDate(b.createdAt) : '—'}
                      </td>
                    </tr>
                  );
                })
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

      {/* Booking Detail Drawer */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div
            className="w-full max-w-md h-full glass-card-strong overflow-y-auto animate-slide-up border-r border-white/10"
            style={{ borderRadius: 0 }}
          >
            <div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/8"
              style={{ background: 'rgba(20,24,48,0.95)', backdropFilter: 'blur(12px)' }}>
              <div>
                <h2 className="text-base font-bold text-[--text-primary]">تفاصيل الحجز</h2>
                <p className="text-xs text-[--text-tertiary] font-mono">
                  #{(detailBooking.bookingRef ?? detailBooking._id).slice(-6).toUpperCase()}
                </p>
              </div>
              <button onClick={() => setDetailBooking(null)} className="text-[--text-tertiary] hover:text-[--text-primary] text-xl">✕</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status badge large */}
              <div className="flex justify-center">
                <span className={cn(STATUS_CONFIG[detailBooking.status]?.cls ?? 'badge-ghost', 'text-sm px-4 py-1.5')}>
                  {STATUS_CONFIG[detailBooking.status]?.label ?? detailBooking.status}
                </span>
              </div>

              <BookingDetailSection title="معلومات الحجز">
                <BookingDetailRow label="التاريخ" value={detailBooking.date ?? '—'} />
                <BookingDetailRow label="الوقت" value={`${detailBooking.startTime} – ${detailBooking.endTime}`} />
                <BookingDetailRow label="المبلغ" value={formatCurrency(detailBooking.totalPrice ?? 0, 'SYP')} />
                <BookingDetailRow label="طريقة الدفع" value={PAYMENT_LABELS[detailBooking.paymentMethod] ?? detailBooking.paymentMethod ?? '—'} />
                {detailBooking.pointsUsed > 0 && (
                  <BookingDetailRow label="نقاط مستخدمة" value={`${detailBooking.pointsUsed} ✦`} />
                )}
                {detailBooking.cancellationReason && (
                  <BookingDetailRow label="سبب الإلغاء" value={detailBooking.cancellationReason} />
                )}
              </BookingDetailSection>

              <BookingDetailSection title="المستخدم">
                <BookingDetailRow label="الاسم" value={detailBooking.user?.name ?? '—'} />
                <BookingDetailRow label="الهاتف" value={detailBooking.user?.phone ?? '—'} />
              </BookingDetailSection>

              <BookingDetailSection title="الملعب">
                <BookingDetailRow label="الاسم" value={detailBooking.facility?.name ?? '—'} />
                <BookingDetailRow label="العنوان" value={detailBooking.facility?.address ?? '—'} />
                <BookingDetailRow label="المالك" value={detailBooking.facility?.owner?.name ?? '—'} />
              </BookingDetailSection>

              <BookingDetailSection title="التوقيت">
                <BookingDetailRow label="تاريخ الإنشاء" value={detailBooking.createdAt ? formatDate(detailBooking.createdAt) : '—'} />
                {detailBooking.confirmedAt && (
                  <BookingDetailRow label="تاريخ التأكيد" value={formatDate(detailBooking.confirmedAt)} />
                )}
                {detailBooking.cancelledAt && (
                  <BookingDetailRow label="تاريخ الإلغاء" value={formatDate(detailBooking.cancelledAt)} />
                )}
              </BookingDetailSection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingDetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[--text-tertiary] mb-3">{title}</p>
      <div className="glass-card-subtle divide-y divide-white/5">{children}</div>
    </div>
  );
}

function BookingDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-sm text-[--text-tertiary]">{label}</span>
      <span className="text-sm font-medium text-[--text-primary] text-left">{value}</span>
    </div>
  );
}
