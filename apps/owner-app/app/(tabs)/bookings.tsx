import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { bookingsApi } from '../../src/api/bookings.api';
import { facilitiesApi } from '../../src/api/facilities.api';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { formatTime12h, formatTimeRange } from '../../src/lib/time';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  // awaiting_payment: 'بانتظار الدفع',
  pending_payment:  'بانتظار التأكيد',
  confirmed:        'مؤكّد',
  completed:        'مكتمل',
  cancelled:        'ملغي',
  no_show:          'لم يحضر',
};
const STATUS_COLORS: Record<string, string> = {
  // awaiting_payment: Colors.text.tertiary,
  pending_payment:  Colors.warning,
  confirmed:        Colors.success,
  completed:        Colors.info,
  cancelled:        Colors.error,
  no_show:          Colors.text.tertiary,
};

const STATUS_KEYS = ['pending_payment', 'awaiting_payment', 'confirmed', 'cancelled', 'completed'] as const;

const STATUS_FILTERS = [
  { key: 'all',              label: 'الكل',              icon: '📋', color: Colors.brand.primary },
  { key: 'pending_payment',  label: 'انتظار التأكيد',    icon: '⏳', color: Colors.warning },
  // { key: 'awaiting_payment', label: 'انتظار الدفع',      icon: '💳', color: Colors.text.tertiary },
  { key: 'confirmed',        label: 'مؤكّد',             icon: '✅', color: Colors.success },
  { key: 'cancelled',        label: 'ملغي',              icon: '❌', color: Colors.error },
  { key: 'completed',        label: 'مكتمل',             icon: '🏁', color: Colors.info },
];

function buildDays() {
  const out: { iso: string; dayLabel: string; dateLabel: string; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    out.push({
      iso: d.toISOString().split('T')[0],
      dayLabel: d.toLocaleDateString('ar-SA', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
      isToday: i === 0,
    });
  }
  return out;
}
const DAYS = buildDays();

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OwnerBookingsTab() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [scheduleDate, setScheduleDate]         = useState(today);
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>();
  const [detailBooking, setDetailBooking]       = useState<any>(null);
  const [statusFilter, setStatusFilter]         = useState<string>('all');

  // ── Facilities ──
  const { data: facilitiesRes } = useQuery({
    queryKey: ['owner-facilities'],
    queryFn: () => facilitiesApi.getMyFacilities(),
    staleTime: 300_000,
  });
  const facilitiesPayload = facilitiesRes?.data;
  const facilities: any[] = Array.isArray(facilitiesPayload?.data)
    ? facilitiesPayload.data
    : Array.isArray(facilitiesPayload)
      ? facilitiesPayload
      : (facilitiesPayload as any)?.facilities ?? [];

  const activeFacilityId = selectedFacility ?? facilities[0]?._id;

  // ── Status counts (all dates, one query per status) ──
  const countQueries = useQueries({
    queries: STATUS_KEYS.map((status) => ({
      queryKey: ['status-count', activeFacilityId, status],
      queryFn: () => bookingsApi.getFacilityBookings(activeFacilityId!, { status, page: 1 }),
      enabled: !!activeFacilityId,
      staleTime: 60_000,
    })),
  });
  const statusCounts: Record<string, number> = {};
  STATUS_KEYS.forEach((key, i) => {
    statusCounts[key] = countQueries[i].data?.data?.data?.pagination?.total ?? 0;
  });
  const totalAllCount = STATUS_KEYS.reduce((sum, k) => sum + (statusCounts[k] ?? 0), 0);

  // ── Schedule data ──
  const { data: slotsRes, isLoading: slotsLoading } = useQuery({
    queryKey: ['facility-slots', activeFacilityId, scheduleDate],
    queryFn: () => facilitiesApi.getSlots(activeFacilityId!, scheduleDate),
    enabled: !!activeFacilityId,
    staleTime: 30_000,
  });

  const { data: scheduleBkRes, isLoading: scheduleBkLoading } = useQuery({
    queryKey: ['schedule-bookings', activeFacilityId, scheduleDate],
    queryFn: () => bookingsApi.getFacilityBookings(activeFacilityId!, { date: scheduleDate }),
    enabled: !!activeFacilityId,
    staleTime: 30_000,
  });

  const allSlots: any[] = slotsRes?.data?.data ?? [];
  const dayBookings: any[] = scheduleBkRes?.data?.data?.bookings ?? [];

  const schedule = useMemo(() => allSlots.map(slot => ({
    ...slot,
    booking: dayBookings.find(b => b.startTime === slot.startTime) ?? null,
  })), [allSlots, dayBookings]);

  const pendingCount = dayBookings.filter(b => b.status === 'pending_payment').length;

  // When a status filter is active, fetch ALL bookings with that status across all dates
  const showingAllDates = statusFilter !== 'all';
  const { data: allStatusRes, isLoading: allStatusLoading } = useQuery({
    queryKey: ['all-status-bookings', activeFacilityId, statusFilter],
    queryFn: () => bookingsApi.getFacilityBookings(activeFacilityId!, { status: statusFilter, page: 1 }),
    enabled: !!activeFacilityId && showingAllDates,
    staleTime: 30_000,
  });
  const allStatusBookings: any[] = allStatusRes?.data?.data?.bookings ?? [];

  const filteredSchedule = useMemo(() => {
    if (statusFilter === 'all') return schedule;
    return schedule.filter(s => s.booking?.status === statusFilter);
  }, [schedule, statusFilter]);

  // ── Mutations ──
  const confirmMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.confirmManual(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['schedule-bookings'] });
      qc.invalidateQueries({ queryKey: ['facility-slots'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
      qc.invalidateQueries({ queryKey: ['all-status-bookings'] });
      setDetailBooking(null);
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر التأكيد'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id, 'إلغاء من المالك'),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['schedule-bookings'] });
      qc.invalidateQueries({ queryKey: ['facility-slots'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
      qc.invalidateQueries({ queryKey: ['all-status-bookings'] });
      setDetailBooking(null);
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر الإلغاء'),
  });

  const handleConfirmRow = (booking: any) => {
    confirmMutation.mutate(booking._id);
  };

  const handleCancelSheet = (booking: any) => {
    Alert.alert(
      'إلغاء الحجز',
      `هل تريد إلغاء حجز ${booking.guestName ?? booking.user?.name ?? 'اللاعب'}؟`,
      [
        { text: 'رجوع', style: 'cancel' },
        { text: 'إلغاء الحجز', style: 'destructive', onPress: () => cancelMutation.mutate(booking._id) },
      ],
    );
  };

  const isLoading = slotsLoading || scheduleBkLoading;

  return (
    <View style={styles.container}>

      {/* ══ Header ══════════════════════════════════════════════════ */}
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>الحجوزات</Text>
            {pendingCount > 0 && (
              <Text style={styles.headerSub}>
                {pendingCount} حجز{pendingCount === 1 ? '' : 'ات'} بانتظار تأكيدك
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => router.push('/booking/add')} style={styles.addBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>إضافة</Text>
          </TouchableOpacity>
        </View>

        {/* Facility selector (only if multiple) */}
        {facilities.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {facilities.map((f) => (
              <TouchableOpacity
                key={f._id}
                onPress={() => setSelectedFacility(f._id)}
                style={[styles.chip, selectedFacility === f._id && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedFacility === f._id && styles.chipTextActive]}>
                  {f.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ══ Day picker ══════════════════════════════════════════════ */}
      <View style={styles.dayPickerWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPickerRow}
        >
          {DAYS.map((d) => {
            const active = scheduleDate === d.iso;
            return (
              <TouchableOpacity
                key={d.iso}
                onPress={() => { setScheduleDate(d.iso); setStatusFilter('all'); }}
                style={[styles.dayChip, active && styles.dayChipActive]}
              >
                <Text style={[styles.dayChipDay, active && styles.dayChipDayActive]}>{d.dayLabel}</Text>
                <Text style={[styles.dayChipDate, active && styles.dayChipDateActive]}>{d.dateLabel}</Text>
                {d.isToday && (
                  <View style={[styles.todayDot, active && styles.todayDotActive]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ══ Status Filter ═══════════════════════════════════════════ */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            const count = f.key === 'all' ? totalAllCount : (statusCounts[f.key] ?? 0);
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setStatusFilter(f.key)}
                style={[styles.filterChip, active && { backgroundColor: f.color, borderColor: f.color }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipIcon]}>{f.icon}</Text>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ══ Content: day schedule OR all-dates filtered list ══════ */}
      {showingAllDates ? (
        // ── All-dates view for a specific status ──
        allStatusLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.brand.primary} size="large" />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        ) : allStatusBookings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={styles.emptyTitle}>لا توجد حجوزات بهذه الحالة</Text>
            <Text style={styles.emptySubtitle}>لا يوجد أي حجز بهذه الحالة في جميع الأيام</Text>
          </View>
        ) : (
          <FlatList
            data={allStatusBookings}
            keyExtractor={(b) => b._id}
            contentContainerStyle={styles.timeline}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <BookingListRow
                booking={item}
                onPress={() => setDetailBooking(item)}
                onConfirm={() => handleConfirmRow(item)}
                isConfirming={confirmMutation.isPending}
              />
            )}
          />
        )
      ) : (
        // ── Day schedule view ──
        isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.brand.primary} size="large" />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        ) : allSlots.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🏟️</Text>
            <Text style={styles.emptyTitle}>لا توجد أوقات في هذا اليوم</Text>
            <Text style={styles.emptySubtitle}>قد يكون الملعب مغلقاً أو لم تُضبط ساعات العمل</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSchedule}
            keyExtractor={(s) => s.startTime}
            contentContainerStyle={styles.timeline}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ScheduleRow
                slot={item}
                onPressDetail={() => item.booking && setDetailBooking(item.booking)}
                onPressAdd={() => router.push('/booking/add')}
                onConfirm={() => handleConfirmRow(item.booking)}
                isConfirming={confirmMutation.isPending}
              />
            )}
          />
        )
      )}

      {/* ══ Booking Detail Bottom Sheet ══════════════════════════════ */}
      <Modal
        visible={!!detailBooking}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailBooking(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailBooking(null)}
        />
        {detailBooking && (
          <BookingSheet
            booking={detailBooking}
            onClose={() => setDetailBooking(null)}
            onConfirm={() => confirmMutation.mutate(detailBooking._id)}
            onCancel={() => handleCancelSheet(detailBooking)}
            confirming={confirmMutation.isPending}
            cancelling={cancelMutation.isPending}
          />
        )}
      </Modal>
    </View>
  );
}

// ─── Schedule Row ─────────────────────────────────────────────────────────────

function ScheduleRow({
  slot, onPressDetail, onPressAdd, onConfirm, isConfirming,
}: {
  slot: any;
  onPressDetail: () => void;
  onPressAdd: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
}) {
  const { startTime, endTime, status, price, booking } = slot;
  const hasBooking = !!booking;
  const isPending  = booking?.status === 'pending_payment';
  const isConfirmed = booking?.status === 'confirmed';
  const displayName  = booking?.guestName ?? booking?.user?.name ?? 'لاعب';
  const displayPhone = booking?.guestPhone ?? booking?.user?.phone ?? null;

  // Closed slot
  if (status === 'closed') {
    return (
      <View style={[styles.row, styles.rowClosed]}>
        <TimeBlock start={startTime} end={endTime} />
        <Text style={styles.closedLabel}>مغلق</Text>
      </View>
    );
  }

  // Available slot
  if (status === 'available') {
    return (
      <TouchableOpacity style={[styles.row, styles.rowAvailable]} onPress={onPressAdd} activeOpacity={0.8}>
        <TimeBlock start={startTime} end={endTime} color={Colors.brand.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.availableLabel}>متاح</Text>
          <Text style={styles.availablePrice}>{price} ل.س</Text>
        </View>
        <View style={styles.addCircle}>
          <Ionicons name="add" size={20} color={Colors.brand.primary} />
        </View>
      </TouchableOpacity>
    );
  }

  // Booked slot (pending or confirmed/completed)
  return (
    <TouchableOpacity
      style={[
        styles.row, styles.rowBooked,
        isPending && styles.rowPending,
        isConfirmed && styles.rowConfirmed,
      ]}
      onPress={onPressDetail}
      activeOpacity={0.85}
    >
      {/* Left: time */}
      <TimeBlock
        start={startTime}
        end={endTime}
        color={isPending ? Colors.warning : isConfirmed ? Colors.success : Colors.text.tertiary}
      />

      {/* Center: player info */}
      <View style={{ flex: 1 }}>
        <View style={styles.playerRow}>
          <Text style={styles.playerName} numberOfLines={1}>{displayName}</Text>
          {booking?.source === 'owner' && (
            <View style={styles.manualBadge}>
              <Text style={styles.manualBadgeText}>يدوي</Text>
            </View>
          )}
        </View>
        {displayPhone && (
          <Text style={styles.playerPhone} numberOfLines={1}>{displayPhone}</Text>
        )}
        <View style={styles.bookingMeta}>
          <Text style={styles.bookingPrice}>{booking?.totalPrice ?? price} ل.س</Text>
          {!isPending && (
            <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[booking?.status] ?? Colors.text.tertiary) + '22' }]}>
              <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[booking?.status] ?? Colors.text.tertiary }]}>
                {STATUS_LABELS[booking?.status] ?? booking?.status}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right: confirm button or chevron */}
      {isPending ? (
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={(e) => { e.stopPropagation?.(); onConfirm(); }}
          disabled={isConfirming}
        >
          {isConfirming
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.confirmBtnText}>تأكيد</Text>
              </>
          }
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
      )}
    </TouchableOpacity>
  );
}

// ─── Time Block ───────────────────────────────────────────────────────────────

function TimeBlock({ start, end, color }: { start: string; end: string; color?: string }) {
  return (
    <View style={[styles.timeBlock, color && { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={[styles.timeStart, color && { color }]}>{formatTime12h(start)}</Text>
      <Text style={styles.timeEnd}>{formatTime12h(end)}</Text>
    </View>
  );
}

// ─── Booking List Row (all-dates filtered view) ───────────────────────────────

function BookingListRow({
  booking, onPress, onConfirm, isConfirming,
}: {
  booking: any; onPress: () => void; onConfirm: () => void; isConfirming: boolean;
}) {
  const statusColor = STATUS_COLORS[booking.status] ?? Colors.text.tertiary;
  const isPending   = booking.status === 'pending_payment';
  const displayName = booking.guestName ?? booking.user?.name ?? 'لاعب';
  const displayPhone = booking.guestPhone ?? booking.user?.phone;

  return (
    <TouchableOpacity
      style={[styles.row, styles.rowBooked, isPending && styles.rowPending]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Date + time column */}
      <View style={styles.listDateBlock}>
        <Text style={styles.listDate}>{booking.date}</Text>
        <Text style={[styles.timeStart, { color: statusColor }]}>{formatTime12h(booking.startTime)}</Text>
        <Text style={styles.timeEnd}>{formatTime12h(booking.endTime)}</Text>
      </View>

      {/* Player info */}
      <View style={{ flex: 1 }}>
        <View style={styles.playerRow}>
          <Text style={styles.playerName} numberOfLines={1}>{displayName}</Text>
          {booking.source === 'owner' && (
            <View style={styles.manualBadge}>
              <Text style={styles.manualBadgeText}>يدوي</Text>
            </View>
          )}
        </View>
        {displayPhone && (
          <Text style={styles.playerPhone} numberOfLines={1}>{displayPhone}</Text>
        )}
        <View style={styles.bookingMeta}>
          <Text style={styles.bookingPrice}>{booking.totalPrice ?? 0} ل.س</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {STATUS_LABELS[booking.status] ?? booking.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Confirm or chevron */}
      {isPending ? (
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={(e) => { e.stopPropagation?.(); onConfirm(); }}
          disabled={isConfirming}
        >
          {isConfirming
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.confirmBtnText}>تأكيد</Text>
              </>
          }
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
      )}
    </TouchableOpacity>
  );
}

// ─── Booking Detail Sheet ─────────────────────────────────────────────────────

function BookingSheet({
  booking, onClose, onConfirm, onCancel, confirming, cancelling,
}: {
  booking: any; onClose: () => void; onConfirm: () => void;
  onCancel: () => void; confirming: boolean; cancelling: boolean;
}) {
  const statusColor = STATUS_COLORS[booking.status] ?? Colors.text.secondary;
  const isPending   = booking.status === 'pending_payment';
  const displayName = booking.guestName ?? booking.user?.name ?? 'لاعب';
  const displayPhone = booking.guestPhone ?? booking.user?.phone;

  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />

      {/* Player header */}
      <View style={styles.sheetHeader}>
        {/* Avatar circle */}
        <View style={[styles.avatarCircle, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.avatarLetter, { color: statusColor }]}>
            {displayName.charAt(0)}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.sheetName}>{displayName}</Text>
          {displayPhone && (
            <Text style={styles.sheetPhone}>{displayPhone}</Text>
          )}
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusColor + '20', borderColor: statusColor + '55' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {STATUS_LABELS[booking.status]}
          </Text>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.sheetBody}>
        {/* Info row */}
        <View style={styles.infoGrid}>
          <InfoCell icon="calendar-outline"  label="التاريخ" value={booking.date} />
          <InfoCell icon="time-outline"      label="الوقت"   value={formatTimeRange(booking.startTime, booking.endTime)} />
          <InfoCell icon="cash-outline"      label="السعر"   value={`${booking.totalPrice ?? 0} ل.س`} highlight />
          {(booking.depositPaid ?? 0) > 0 && (
            <InfoCell icon="wallet-outline"  label="العربون" value={`${booking.depositPaid} ل.س`} />
          )}
        </View>

        {/* Payment screenshot indicator */}
        {booking.paymentScreenshot && (
          <TouchableOpacity
            style={styles.screenshotBtn}
            onPress={() => { onClose(); router.push(`/booking/${booking._id}`); }}
          >
            <Ionicons name="image-outline" size={18} color={Colors.brand.primary} />
            <Text style={styles.screenshotBtnText}>عرض إيصال الدفع</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.brand.primary} />
          </TouchableOpacity>
        )}

        {/* Actions */}
        {isPending && (
          <View style={styles.sheetActions}>
            <TouchableOpacity onPress={onConfirm} disabled={confirming} style={styles.sheetConfirmBtn}>
              {confirming
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.sheetConfirmText}>تأكيد الحجز</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} disabled={cancelling} style={styles.sheetCancelBtn}>
              <Ionicons name="close-circle" size={20} color={Colors.error} />
              <Text style={styles.sheetCancelText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* View full details */}
        <TouchableOpacity
          style={styles.fullDetailBtn}
          onPress={() => { onClose(); router.push(`/booking/${booking._id}`); }}
        >
          <Text style={styles.fullDetailText}>عرض التفاصيل الكاملة</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoCell({ icon, label, value, highlight }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; highlight?: boolean;
}) {
  return (
    <View style={styles.infoCell}>
      <Ionicons name={icon} size={18} color={highlight ? Colors.brand.primary : Colors.text.tertiary} />
      <Text style={styles.infoCellLabel}>{label}</Text>
      <Text style={[styles.infoCellValue, highlight && { color: Colors.brand.primary }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },

  // Header
  safeHeader: {
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text.primary },
  headerSub: { fontSize: 12, color: Colors.warning, fontWeight: '600', marginTop: 2 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.md,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  chipRow: { paddingHorizontal: Spacing.xl, gap: 8, paddingBottom: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border.default, backgroundColor: Colors.background.secondary,
  },
  chipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.text.tertiary },
  chipTextActive: { color: Colors.brand.primary },

  // Day picker
  dayPickerWrap: {
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  dayPickerRow: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: 8 },
  dayChip: {
    alignItems: 'center', paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.border.default, backgroundColor: Colors.background.secondary,
    minWidth: 62, position: 'relative',
  },
  dayChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary },
  dayChipDay: { fontSize: 11, fontWeight: '600', color: Colors.text.tertiary },
  dayChipDayActive: { color: 'rgba(255,255,255,0.85)' },
  dayChipDate: { fontSize: 13, fontWeight: '700', color: Colors.text.primary, marginTop: 2 },
  dayChipDateActive: { color: '#fff' },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.brand.primary, marginTop: 4,
  },
  todayDotActive: { backgroundColor: 'rgba(255,255,255,0.8)' },

  // Timeline
  timeline: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 110 },

  // Slot rows
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    marginBottom: 6, borderRadius: Radius.lg,
    borderWidth: 1,
  },

  rowClosed: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.border.default,
    opacity: 0.55,
  },
  closedLabel: { fontSize: 13, color: Colors.text.tertiary, flex: 1 },

  rowAvailable: {
    backgroundColor: Colors.brand.light,
    borderColor: Colors.brand.border,
  },
  availableLabel: { fontSize: 14, fontWeight: '700', color: Colors.brand.primary },
  availablePrice: { fontSize: 12, color: Colors.brand.dark, marginTop: 2 },
  addCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  rowBooked: {
    backgroundColor: Colors.background.primary,
    borderColor: Colors.border.strong,
  },
  rowPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
  },
  rowConfirmed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },

  // List date block (all-dates view)
  listDateBlock: {
    width: 68, alignItems: 'center',
    borderLeftColor: Colors.border.default,
    borderLeftWidth: 3,
    paddingRight: Spacing.sm,
  },
  listDate: { fontSize: 10, color: Colors.text.tertiary, marginBottom: 2 },

  // Time block
  timeBlock: {
    width: 56, alignItems: 'center',
    borderLeftColor: Colors.border.default,
    paddingRight: Spacing.sm,
  },
  timeStart: { fontSize: 13, fontWeight: '800', color: Colors.text.primary },
  timeEnd: { fontSize: 10, color: Colors.text.tertiary, marginTop: 2 },

  // Player info
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playerName: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, flex: 1 },
  playerPhone: { fontSize: 11, color: Colors.text.tertiary, marginTop: 2 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  bookingPrice: { fontSize: 12, fontWeight: '700', color: Colors.brand.primary },
  statusBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  manualBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.primary + '44',
  },
  manualBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.brand.primary },

  // Confirm button (on row)
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: Radius.md,
  },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Loading / empty
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: 14, color: Colors.text.tertiary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.secondary, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: Colors.text.tertiary, textAlign: 'center', lineHeight: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '75%', paddingBottom: 34,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border.strong,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 20, fontWeight: '800' },
  sheetName: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  sheetPhone: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  sheetBody: { padding: Spacing.lg, gap: Spacing.md },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  infoCell: {
    flex: 1, minWidth: '44%',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border.default,
    alignItems: 'center', gap: 4,
  },
  infoCellLabel: { fontSize: 11, color: Colors.text.tertiary },
  infoCellValue: { fontSize: 14, fontWeight: '700', color: Colors.text.primary, textAlign: 'center' },

  screenshotBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.brand.light, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.brand.border,
  },
  screenshotBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.brand.primary },

  sheetActions: { flexDirection: 'row', gap: Spacing.md },
  sheetConfirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: Radius.lg,
    backgroundColor: Colors.brand.primary,
  },
  sheetConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sheetCancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.error + '55', backgroundColor: Colors.errorBg,
  },
  sheetCancelText: { fontSize: 15, fontWeight: '700', color: Colors.error },

  fullDetailBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: Spacing.md,
  },
  fullDetailText: { fontSize: 13, color: Colors.text.tertiary },

  // Status filter
  filterWrap: {
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  filterRow: {
    paddingHorizontal: Spacing.xl, paddingVertical: 10, gap: 8,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.border.strong,
    backgroundColor: Colors.background.secondary,
  },
  filterChipIcon: { fontSize: 13 },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary },
  filterChipTextActive: { color: '#fff' },
  filterBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.border.strong,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.text.tertiary },
  filterBadgeTextActive: { color: '#fff' },
});
