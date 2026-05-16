'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatDate, formatCurrency, formatTimeRange, cn } from '@/lib/utils';
import { MapPin, Search, CalendarDays, X, Phone, Clock, Banknote, Hash } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; cls: string; color: string }> = {
  pending:   { label: 'معلّق',  cls: 'badge-warning', color: '#F59E0B' },
  confirmed: { label: 'مؤكّد', cls: 'badge-success', color: '#10B981' },
  completed: { label: 'مكتمل', cls: 'badge-info',    color: '#3B82F6' },
  cancelled: { label: 'ملغي',  cls: 'badge-error',   color: '#EF4444' },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash:      'نقداً',
  card:      'بطاقة',
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

  const openDetail = (id: string) => {
    const found = bookings.find((b) => b._id === id);
    if (found) setDetailBooking(found);
  };

  const totalPages = pagination?.pages ?? pagination?.totalPages ?? 1;

  // Status summary counts from all bookings (current page)
  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[--text-primary]">الحجوزات</h1>
          <p className="text-sm text-[--text-tertiary] mt-0.5">
            {pagination ? `${pagination.total} حجز` : 'جاري التحميل...'}
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
                'rounded-xl p-3 text-center transition-all border',
                statusFilter === status
                  ? 'border-brand-primary/40'
                  : 'border-transparent',
              )}
              style={{
                background: statusFilter === status
                  ? `rgba(${cfg.color === '#10B981' ? '16,185,129' : cfg.color === '#F59E0B' ? '245,158,11' : cfg.color === '#3B82F6' ? '59,130,246' : '239,68,68'},0.08)`
                  : 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <p
                className="text-xl font-bold tabular-nums"
                style={{ color: cfg.color }}
              >
                {statusCounts[status] ?? 0}
              </p>
              <p className="text-xs text-[--text-tertiary] mt-0.5">{cfg.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <GlassCard className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
          <input
            type="text"
            placeholder="ابحث بالمستخدم، الملعب، المرجع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pr-9"
          />
        </div>

        <div
          className="flex gap-1 p-1 rounded-lg border border-white/10"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
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
          {(from || to) && (
            <button
              onClick={() => { setFrom(''); setTo(''); setPage(1); }}
              className="text-xs text-[--text-tertiary] hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <X size={12} /> مسح
            </button>
          )}
        </div>
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
                      <td key={j}><div className="h-4 rounded-md bg-white/5 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <CalendarDays size={40} className="mx-auto mb-3 text-[--text-tertiary] opacity-40" />
                    <p className="text-[--text-tertiary]">لا توجد حجوزات مطابقة</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const sc = STATUS_CONFIG[b.status] ?? { label: b.status, cls: 'badge-ghost' };
                  return (
                    <tr
                      key={b._id}
                      onClick={() => openDetail(b._id)}
                      className="cursor-pointer"
                    >
                      <td>
                        <span className="font-mono text-xs text-[--text-tertiary] bg-white/5 px-2 py-0.5 rounded">
                          #{(b.bookingRef ?? b._id).slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <p className="text-sm font-semibold text-[--text-primary]">{b.user?.name ?? '—'}</p>
                        <p className="text-xs text-[--text-tertiary] flex items-center gap-1">
                          <Phone size={10} /> {b.user?.phone ?? ''}
                        </p>
                      </td>
                      <td>
                        <p className="text-sm font-semibold text-[--text-primary]">{b.facility?.name ?? '—'}</p>
                        <p className="text-xs text-[--text-tertiary] flex items-center gap-1">
                          <MapPin size={10} className="text-brand-primary" />
                          <span className="truncate max-w-[140px]">{b.facility?.address ?? ''}</span>
                        </p>
                      </td>
                      <td>
                        <p className="text-sm tabular-nums text-[--text-primary]">{b.date}</p>
                        <p className="text-xs text-[--text-tertiary] flex items-center gap-1">
                          <Clock size={10} /> {formatTimeRange(b.startTime, b.endTime)}
                        </p>
                      </td>
                      <td>
                        <span className="tabular-nums text-sm font-bold text-emerald-400">
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

      {/* Booking Detail Drawer */}
      {detailBooking && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDetailBooking(null); }}
        >
          <div
            className="w-full max-w-md h-full overflow-y-auto animate-slide-in-right border-r border-white/[0.08]"
            style={{ background: 'rgba(10,18,13,0.97)', backdropFilter: 'blur(20px)' }}
          >
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.08] z-10"
              style={{ background: 'rgba(10,18,13,0.95)', backdropFilter: 'blur(16px)' }}
            >
              <div>
                <h2 className="text-sm font-bold text-[--text-primary]">تفاصيل الحجز</h2>
                <p className="text-xs text-[--text-tertiary] font-mono flex items-center gap-1 mt-0.5">
                  <Hash size={10} />
                  {(detailBooking.bookingRef ?? detailBooking._id).slice(-6).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setDetailBooking(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[--text-tertiary] hover:text-[--text-primary]"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status */}
              <div className="flex justify-center">
                <span className={cn(STATUS_CONFIG[detailBooking.status]?.cls ?? 'badge-ghost', 'text-sm px-4 py-1.5')}>
                  {STATUS_CONFIG[detailBooking.status]?.label ?? detailBooking.status}
                </span>
              </div>

              {/* Booking info */}
              <BookSection title="معلومات الحجز">
                <BookRow label="التاريخ" value={detailBooking.date ?? '—'} icon={<CalendarDays size={12} />} />
                <BookRow label="الوقت" value={formatTimeRange(detailBooking.startTime, detailBooking.endTime)} icon={<Clock size={12} />} />
                <BookRow label="المبلغ" value={formatCurrency(detailBooking.totalPrice ?? 0, 'SYP')} icon={<Banknote size={12} />} />
                <BookRow
                  label="طريقة الدفع"
                  value={PAYMENT_LABELS[detailBooking.paymentMethod] ?? detailBooking.paymentMethod ?? '—'}
                />
                {(detailBooking.pointsUsed ?? 0) > 0 && (
                  <BookRow label="نقاط مستخدمة" value={`${detailBooking.pointsUsed} ✦`} />
                )}
                {detailBooking.cancellationReason && (
                  <BookRow label="سبب الإلغاء" value={detailBooking.cancellationReason} />
                )}
              </BookSection>

              {/* User info */}
              <BookSection title="المستخدم">
                <BookRow label="الاسم" value={detailBooking.user?.name ?? '—'} />
                <BookRow label="الهاتف" value={detailBooking.user?.phone ?? '—'} icon={<Phone size={12} />} />
              </BookSection>

              {/* Facility info */}
              <BookSection title="الملعب">
                <BookRow label="الاسم" value={detailBooking.facility?.name ?? '—'} />
                <BookRow label="العنوان" value={detailBooking.facility?.address ?? '—'} icon={<MapPin size={12} />} />
                <BookRow label="المالك" value={detailBooking.facility?.owner?.name ?? '—'} />
              </BookSection>

              {/* Timestamps */}
              <BookSection title="التوقيت">
                <BookRow label="تاريخ الإنشاء" value={detailBooking.createdAt ? formatDate(detailBooking.createdAt) : '—'} />
                {detailBooking.confirmedAt && (
                  <BookRow label="تاريخ التأكيد" value={formatDate(detailBooking.confirmedAt)} />
                )}
                {detailBooking.cancelledAt && (
                  <BookRow label="تاريخ الإلغاء" value={formatDate(detailBooking.cancelledAt)} />
                )}
              </BookSection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[--text-tertiary] mb-2.5">{title}</p>
      <div className="glass-card-subtle divide-y divide-white/[0.05] rounded-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function BookRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 gap-4">
      <span className="text-sm text-[--text-tertiary] flex items-center gap-1.5 flex-shrink-0">
        {icon}{label}
      </span>
      <span className="text-sm font-semibold text-[--text-primary] text-left break-words max-w-[58%]">{value}</span>
    </div>
  );
}
