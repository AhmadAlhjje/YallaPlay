import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { bookingsApi } from '../../src/api/bookings.api';
import { facilitiesApi } from '../../src/api/facilities.api';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { formatTime12h, formatTimeRange } from '../../src/lib/time';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: undefined,         label: 'الكل',            color: Colors.text.secondary,  bg: Colors.glass.subtle },
  { key: 'pending_payment', label: 'بانتظار التأكيد', color: Colors.warning,         bg: Colors.warningBg },
  { key: 'confirmed',       label: 'مؤكّد',           color: Colors.success,         bg: Colors.successBg },
  { key: 'completed',       label: 'مكتمل',           color: Colors.info,            bg: Colors.infoBg },
  { key: 'cancelled',       label: 'ملغي',            color: Colors.error,           bg: Colors.errorBg },
] as const;
type StatusKey = typeof STATUS_FILTERS[number]['key'];

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'بانتظار الدفع',
  pending_payment: 'بانتظار التأكيد', confirmed: 'مؤكّد',
  completed: 'مكتمل', cancelled: 'ملغي', no_show: 'لم يحضر',
};
const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: Colors.text.tertiary,
  pending_payment: Colors.warning, confirmed: Colors.success,
  completed: Colors.info, cancelled: Colors.error, no_show: Colors.text.tertiary,
};

function buildDays() {
  const out: { iso: string; dayLabel: string; dateLabel: string; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
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

  const [viewMode, setViewMode] = useState<'list' | 'schedule'>('schedule');
  const [statusFilter, setStatusFilter]         = useState<StatusKey>(undefined);
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>();
  const [showTodayOnly, setShowTodayOnly]       = useState(false);
  const [scheduleDate, setScheduleDate]         = useState(today);
  const [detailBooking, setDetailBooking]       = useState<any>(null);

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
      : facilitiesPayload?.facilities ?? [];

  const activeFacilityId = selectedFacility ?? facilities[0]?._id;

  // ── List data ──
  const { data: listData, isLoading: listLoading, refetch: listRefetch, isFetching: listFetching } = useQuery({
    queryKey: ['owner-bookings', activeFacilityId, statusFilter, showTodayOnly],
    queryFn: () => {
      if (!activeFacilityId) return null;
      return bookingsApi.getFacilityBookings(activeFacilityId, {
        status: statusFilter as string | undefined,
        date: showTodayOnly ? today : undefined,
        page: 1,
      });
    },
    enabled: facilities.length > 0 && viewMode === 'list',
    staleTime: 30_000,
  });
  const bookings: any[] = listData?.data?.data?.bookings ?? [];

  // ── Schedule data ──
  const { data: slotsRes, isLoading: slotsLoading } = useQuery({
    queryKey: ['facility-slots', activeFacilityId, scheduleDate],
    queryFn: () => facilitiesApi.getSlots(activeFacilityId!, scheduleDate),
    enabled: !!activeFacilityId && viewMode === 'schedule',
    staleTime: 30_000,
  });
  const { data: scheduleBkRes, isLoading: scheduleBkLoading } = useQuery({
    queryKey: ['schedule-bookings', activeFacilityId, scheduleDate],
    queryFn: () => bookingsApi.getFacilityBookings(activeFacilityId!, { date: scheduleDate }),
    enabled: !!activeFacilityId && viewMode === 'schedule',
    staleTime: 30_000,
  });

  const allSlots: any[] = slotsRes?.data?.data ?? [];
  const dayBookings: any[] = scheduleBkRes?.data?.data?.bookings ?? [];

  const schedule = useMemo(() => allSlots.map(slot => ({
    ...slot,
    booking: dayBookings.find(b => b.startTime === slot.startTime) ?? null,
  })), [allSlots, dayBookings]);

  // ── Mutations ──
  const confirmMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.confirmManual(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-bookings'] });
      qc.invalidateQueries({ queryKey: ['schedule-bookings'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
      setDetailBooking(null);
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر التأكيد'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => bookingsApi.cancel(id, 'إلغاء من المالك'),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-bookings'] });
      qc.invalidateQueries({ queryKey: ['schedule-bookings'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
      qc.invalidateQueries({ queryKey: ['facility-slots'] });
      setDetailBooking(null);
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر الإلغاء'),
  });

  const handleCancel = (booking: any) => {
    Alert.alert('إلغاء الحجز', `هل تريد إلغاء حجز ${booking.guestName ?? booking.user?.name ?? 'اللاعب'}؟`, [
      { text: 'رجوع', style: 'cancel' },
      { text: 'إلغاء الحجز', style: 'destructive', onPress: () => cancelMutation.mutate({ id: booking._id }) },
    ]);
  };

  return (
    <View style={styles.container}>

      {/* ══ Header ══════════════════════════════════════════════════ */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[Typography.h2, { color: Colors.text.primary }]}>الحجوزات</Text>
          <TouchableOpacity onPress={() => router.push('/booking/add')} style={styles.addBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>إضافة حجز</Text>
          </TouchableOpacity>
        </View>

        {/* View mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            onPress={() => setViewMode('schedule')}
            style={[styles.modeBtn, viewMode === 'schedule' && styles.modeBtnActive]}
          >
            <Ionicons name="calendar" size={15} color={viewMode === 'schedule' ? Colors.brand.primary : Colors.text.tertiary} />
            <Text style={[styles.modeBtnText, viewMode === 'schedule' && styles.modeBtnTextActive]}>جدول</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={[styles.modeBtn, viewMode === 'list' && styles.modeBtnActive]}
          >
            <Ionicons name="list" size={15} color={viewMode === 'list' ? Colors.brand.primary : Colors.text.tertiary} />
            <Text style={[styles.modeBtnText, viewMode === 'list' && styles.modeBtnTextActive]}>قائمة</Text>
          </TouchableOpacity>
        </View>

        {/* Facility selector */}
        {facilities.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {[{ _id: undefined as any, name: 'الكل' }, ...facilities].map((f) => (
              <TouchableOpacity
                key={f._id ?? 'all'}
                onPress={() => setSelectedFacility(f._id)}
                style={[styles.chip, (selectedFacility ?? undefined) === f._id && styles.chipActive]}
              >
                <Text style={[Typography.labelSm, {
                  color: (selectedFacility ?? undefined) === f._id ? Colors.brand.primary : Colors.text.tertiary,
                }]}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ══ SCHEDULE VIEW ═══════════════════════════════════════════ */}
      {viewMode === 'schedule' ? (
        <View style={{ flex: 1 }}>
          {/* Day picker */}
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
                    onPress={() => setScheduleDate(d.iso)}
                    style={[styles.dayChip, active && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayChipDay, active && { color: '#fff' }]}>{d.dayLabel}</Text>
                    <Text style={[styles.dayChipDate, active && { color: 'rgba(255,255,255,0.9)' }]}>{d.dateLabel}</Text>
                    {d.isToday && (
                      <View style={[styles.todayDot, active && { backgroundColor: 'rgba(255,255,255,0.8)' }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Slot timeline */}
          {slotsLoading || scheduleBkLoading ? (
            <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.huge }} />
          ) : allSlots.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>🏟️</Text>
              <Text style={[Typography.h3, { color: Colors.text.secondary, marginTop: Spacing.md, textAlign: 'center' }]}>
                لا توجد أوقات في هذا اليوم
              </Text>
              <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center', marginTop: 4 }]}>
                قد يكون الملعب مغلقاً
              </Text>
            </View>
          ) : (
            <FlatList
              data={schedule}
              keyExtractor={(s) => s.startTime}
              contentContainerStyle={styles.scheduleList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ScheduleRow
                  slot={item}
                  onPressBooked={() => setDetailBooking(item.booking)}
                  onPressAvailable={() => router.push('/booking/add')}
                />
              )}
            />
          )}
        </View>

      ) : (
        /* ══ LIST VIEW ═════════════════════════════════════════════ */
        <View style={{ flex: 1 }}>
          {/* Simple status filter */}
          <View style={styles.filterWrap}>
            {/* Today toggle */}
            <TouchableOpacity
              onPress={() => setShowTodayOnly(!showTodayOnly)}
              style={[styles.todayToggle, showTodayOnly && styles.todayToggleActive]}
            >
              <Ionicons name="today" size={14} color={showTodayOnly ? Colors.brand.primary : Colors.text.secondary} />
              <Text style={[styles.todayToggleText, showTodayOnly && { color: Colors.brand.primary }]}>
                {showTodayOnly ? 'اليوم فقط ✓' : 'كل الأيام'}
              </Text>
            </TouchableOpacity>

            {/* Status filter - big chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFilterRow}>
              {STATUS_FILTERS.map((item) => {
                const active = statusFilter === item.key;
                return (
                  <TouchableOpacity
                    key={item.label}
                    onPress={() => setStatusFilter(item.key)}
                    style={[
                      styles.statusChip,
                      { backgroundColor: active ? item.color : Colors.background.primary, borderColor: active ? item.color : Colors.glass.border },
                    ]}
                  >
                    <Text style={[Typography.labelMd, { color: active ? '#fff' : Colors.text.secondary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {listLoading ? (
            <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.huge }} />
          ) : bookings.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>📋</Text>
              <Text style={[Typography.h3, { color: Colors.text.secondary, textAlign: 'center' }]}>
                لا توجد حجوزات
              </Text>
              <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center', marginTop: 4 }]}>
                {showTodayOnly ? 'لا توجد حجوزات اليوم' : 'لم يتم تسجيل أي حجوزات بعد'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/booking/add')} style={styles.emptyAddBtn}>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.emptyAddBtnText}>إضافة حجز يدوي</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={bookings}
              keyExtractor={(b) => b._id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshing={listFetching && !listLoading}
              onRefresh={listRefetch}
              renderItem={({ item }) => (
                <BookingCard
                  booking={item}
                  onPress={() => router.push(`/booking/${item._id}`)}
                  onConfirm={() => confirmMutation.mutate(item._id)}
                  onCancel={() => handleCancel(item)}
                />
              )}
            />
          )}
        </View>
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
          <BookingDetailSheet
            booking={detailBooking}
            onClose={() => setDetailBooking(null)}
            onConfirm={() => confirmMutation.mutate(detailBooking._id)}
            onCancel={() => handleCancel(detailBooking)}
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
  slot, onPressBooked, onPressAvailable,
}: {
  slot: any;
  onPressBooked: () => void;
  onPressAvailable: () => void;
}) {
  const { startTime, endTime, status, price, booking } = slot;
  const hasBooking = booking && status !== 'available' && status !== 'closed';

  const barColor =
    status === 'available' ? Colors.brand.primary :
    status === 'pending'   ? Colors.warning :
    status === 'booked'    ? Colors.info :
    Colors.text.tertiary;

  const displayName = booking?.guestName ?? booking?.user?.name ?? 'لاعب';
  const displayPhone = booking?.guestPhone ?? booking?.user?.phone;

  return (
    <TouchableOpacity
      onPress={hasBooking ? onPressBooked : (status === 'available' ? onPressAvailable : undefined)}
      activeOpacity={hasBooking || status === 'available' ? 0.75 : 1}
      style={[styles.scheduleRow, hasBooking && { borderLeftWidth: 4, borderLeftColor: barColor }]}
    >
      {/* Time */}
      <View style={styles.scheduleTime}>
        <Text style={styles.scheduleTimeText}>{formatTime12h(startTime)}</Text>
        <Text style={styles.scheduleTimeEnd}>{formatTime12h(endTime)}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {hasBooking ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[Typography.labelMd, { color: Colors.text.primary }]} numberOfLines={1}>
                {displayName}
              </Text>
              {booking.source === 'owner' && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>يدوي</Text>
                </View>
              )}
            </View>
            {displayPhone && (
              <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginTop: 2 }]}>
                {displayPhone}
              </Text>
            )}
            <View style={styles.scheduleStatusRow}>
              <View style={[styles.scheduleStatusPill, { backgroundColor: barColor + '22', borderColor: barColor + '55' }]}>
                <View style={[styles.scheduleStatusDot, { backgroundColor: barColor }]} />
                <Text style={[Typography.labelSm, { color: barColor }]}>
                  {STATUS_LABELS[booking.status] ?? booking.status}
                </Text>
              </View>
              <Text style={[Typography.numericSm, { color: Colors.brand.primary }]}>
                {booking.totalPrice ?? price} ل.س
              </Text>
            </View>
          </>
        ) : status === 'available' ? (
          <View style={styles.availableRow}>
            <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>متاح</Text>
            <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{price} ل.س · اضغط لإضافة حجز</Text>
          </View>
        ) : (
          <Text style={[Typography.bodyMd, { color: Colors.text.tertiary }]}>مغلق</Text>
        )}
      </View>

      {hasBooking && (
        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
      )}
      {status === 'available' && (
        <Ionicons name="add-circle-outline" size={20} color={Colors.brand.primary} />
      )}
    </TouchableOpacity>
  );
}

// ─── Booking Detail Bottom Sheet ──────────────────────────────────────────────

function BookingDetailSheet({
  booking, onClose, onConfirm, onCancel, confirming, cancelling,
}: {
  booking: any; onClose: () => void; onConfirm: () => void;
  onCancel: () => void; confirming: boolean; cancelling: boolean;
}) {
  const statusColor = STATUS_COLORS[booking.status] ?? Colors.text.secondary;
  const isPending = booking.status === 'pending_payment';
  const displayName = booking.guestName ?? booking.user?.name ?? 'لاعب';
  const displayPhone = booking.guestPhone ?? booking.user?.phone;

  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />

      {/* Header */}
      <View style={styles.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.h3, { color: Colors.text.primary }]} numberOfLines={1}>{displayName}</Text>
          {displayPhone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="call-outline" size={12} color={Colors.text.tertiary} />
              <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{displayPhone}</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusPillSheet, { backgroundColor: statusColor + '20', borderColor: statusColor + '55' }]}>
          <View style={[styles.statusDotSheet, { backgroundColor: statusColor }]} />
          <Text style={[Typography.labelSm, { color: statusColor }]}>{STATUS_LABELS[booking.status]}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
          <Ionicons name="close" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
        {/* Details grid */}
        <View style={styles.detailGrid}>
          <DetailCell icon="calendar-outline" label="التاريخ" value={booking.date} />
          <DetailCell icon="time-outline"     label="الوقت"   value={formatTimeRange(booking.startTime, booking.endTime)} />
          <DetailCell icon="cash-outline"     label="السعر"   value={`${booking.totalPrice ?? 0} ل.س`} highlight />
          {(booking.depositPaid ?? 0) > 0 && (
            <DetailCell icon="wallet-outline" label="العربون" value={`${booking.depositPaid} ل.س`} />
          )}
          {booking.source === 'owner' && (
            <DetailCell icon="person-outline" label="المصدر" value="حجز يدوي من المالك" />
          )}
        </View>

        {/* Payment screenshot */}
        {booking.paymentScreenshot && (
          <View style={styles.screenshotWrap}>
            <View style={styles.screenshotHeader}>
              <Ionicons name="image-outline" size={14} color={Colors.brand.primary} />
              <Text style={[Typography.labelSm, { color: Colors.brand.primary }]}>إيصال الدفع</Text>
            </View>
            <TouchableOpacity onPress={() => { onClose(); router.push(`/booking/${booking._id}`); }}>
              <View style={styles.screenshotBtn}>
                <Ionicons name="eye-outline" size={18} color={Colors.brand.primary} />
                <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>عرض الإيصال كاملاً</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        {isPending && (
          <View style={styles.sheetActions}>
            <TouchableOpacity onPress={onConfirm} disabled={confirming} style={styles.sheetConfirmBtn}>
              {confirming
                ? <ActivityIndicator color={Colors.brand.primary} size="small" />
                : <>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.brand.primary} />
                    <Text style={[Typography.labelLg, { color: Colors.brand.primary }]}>تأكيد الحجز</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} disabled={cancelling} style={styles.sheetCancelBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.error} />
              <Text style={[Typography.labelLg, { color: Colors.error }]}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* View full details */}
        <TouchableOpacity
          onPress={() => { onClose(); router.push(`/booking/${booking._id}`); }}
          style={styles.viewDetailBtn}
        >
          <Text style={[Typography.labelMd, { color: Colors.text.secondary }]}>عرض التفاصيل الكاملة</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Booking List Card ────────────────────────────────────────────────────────

function BookingCard({
  booking, onPress, onConfirm, onCancel,
}: { booking: any; onPress: () => void; onConfirm: () => void; onCancel: () => void }) {
  const statusColor = STATUS_COLORS[booking.status] ?? Colors.text.secondary;
  const isPending = booking.status === 'pending_payment';
  const displayName = booking.guestName ?? booking.user?.name ?? 'لاعب';
  const displayPhone = booking.guestPhone ?? booking.user?.phone;

  return (
    <TouchableOpacity onPress={onPress}>
      <GlassCard style={[styles.card, isPending && { borderLeftWidth: 3, borderLeftColor: Colors.warning }]}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[Typography.labelLg, { color: Colors.text.primary }]} numberOfLines={1}>
                {displayName}
              </Text>
              {booking.source === 'owner' && (
                <View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>يدوي</Text></View>
              )}
            </View>
            {displayPhone && (
              <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginTop: 2 }]}>
                <Ionicons name="call-outline" size={11} color={Colors.text.tertiary} /> {displayPhone}
              </Text>
            )}
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18', borderColor: statusColor + '44' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[Typography.labelSm, { color: statusColor }]}>
              {STATUS_LABELS[booking.status] ?? booking.status}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MiniChip icon="calendar-outline" value={booking.date} />
          <MiniChip icon="time-outline" value={formatTimeRange(booking.startTime, booking.endTime)} />
          <MiniChip icon="cash-outline" value={`${booking.totalPrice ?? 0} ل.س`} highlight />
        </View>

        {isPending && (
          <View style={[styles.cardRow, { gap: Spacing.sm, marginTop: Spacing.sm }]}>
            <TouchableOpacity onPress={onConfirm} style={styles.confirmBtn}>
              <Ionicons name="checkmark-circle-outline" size={14} color={Colors.brand.primary} />
              <Text style={[Typography.labelSm, { color: Colors.brand.primary }]}>تأكيد الدفع</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Ionicons name="close-circle-outline" size={14} color={Colors.error} />
              <Text style={[Typography.labelSm, { color: Colors.error }]}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onPress} style={styles.detailBtn}>
              <Text style={[Typography.labelSm, { color: Colors.text.secondary }]}>التفاصيل ›</Text>
            </TouchableOpacity>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

function MiniChip({ icon, value, highlight }: {
  icon: keyof typeof Ionicons.glyphMap; value: string; highlight?: boolean;
}) {
  return (
    <View style={styles.miniChip}>
      <Ionicons name={icon} size={11} color={highlight ? Colors.brand.primary : Colors.text.tertiary} />
      <Text style={[Typography.bodySm, { color: highlight ? Colors.brand.primary : Colors.text.secondary }]}>
        {value}
      </Text>
    </View>
  );
}

function DetailCell({ icon, label, value, highlight }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; highlight?: boolean;
}) {
  return (
    <View style={styles.detailCell}>
      <Ionicons name={icon} size={16} color={highlight ? Colors.brand.primary : Colors.text.tertiary} />
      <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginTop: 2 }]}>{label}</Text>
      <Text style={[Typography.labelMd, { color: highlight ? Colors.brand.primary : Colors.text.primary, marginTop: 2 }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },

  // Header
  header: { backgroundColor: Colors.background.primary, borderBottomWidth: 1, borderBottomColor: Colors.glass.border },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.md, paddingVertical: 9, borderRadius: Radius.md,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Mode toggle
  modeRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm,
  },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
  },
  modeBtnActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text.tertiary },
  modeBtnTextActive: { color: Colors.brand.primary },

  chipRow: { paddingHorizontal: Spacing.xl, gap: 8, paddingBottom: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
  },
  chipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },

  // Day picker
  dayPickerWrap: {
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  dayPickerRow: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: 8 },
  dayChip: {
    alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
    minWidth: 58, position: 'relative',
  },
  dayChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary },
  dayChipDay: { fontSize: 11, fontWeight: '600', color: Colors.text.tertiary },
  dayChipDate: { fontSize: 13, fontWeight: '700', color: Colors.text.primary, marginTop: 2 },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.brand.primary, marginTop: 3,
  },

  // Schedule list
  scheduleList: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 110 },
  scheduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.background.primary,
    borderWidth: 1, borderColor: Colors.glass.border,
  },
  scheduleTime: {
    width: 60, alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.sm, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.glass.border,
  },
  scheduleTimeText: { fontSize: 13, fontWeight: '800', color: Colors.text.primary },
  scheduleTimeEnd: { fontSize: 10, color: Colors.text.tertiary, marginTop: 1 },
  scheduleStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  scheduleStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1,
  },
  scheduleStatusDot: { width: 5, height: 5, borderRadius: 3 },
  availableRow: { gap: 2 },
  ownerBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.primary + '44',
  },
  ownerBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.brand.primary },

  // List filter
  filterWrap: { backgroundColor: Colors.background.primary, borderBottomWidth: 1, borderBottomColor: Colors.glass.border, paddingTop: Spacing.sm },
  todayToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
  },
  todayToggleActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },
  todayToggleText: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary },
  statusFilterRow: { paddingHorizontal: Spacing.xl, gap: 8, paddingBottom: Spacing.md },
  statusChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderRadius: Radius.full, borderWidth: 1.5,
  },

  // List content
  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 110 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.xl, backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.lg,
  },
  emptyAddBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Card
  card: { padding: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  miniChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.glass.border,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  confirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 9, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.brand.primary + '55', backgroundColor: Colors.brand.light,
  },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 9, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.error + '55', backgroundColor: Colors.errorBg,
  },
  detailBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 9,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
  },

  // Bottom sheet modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '80%', paddingBottom: 34,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.glass.medium,
    alignSelf: 'center', marginTop: 10,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  sheetClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  statusPillSheet: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusDotSheet: { width: 6, height: 6, borderRadius: 3 },
  sheetBody: { padding: Spacing.lg, gap: Spacing.md },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  detailCell: {
    width: '45%', flex: 1, minWidth: '40%',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.glass.border,
    alignItems: 'center',
  },
  screenshotWrap: {
    borderRadius: Radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.glass.border,
  },
  screenshotHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.brand.light,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  screenshotBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: Spacing.md,
  },
  sheetActions: { flexDirection: 'row', gap: Spacing.md },
  sheetConfirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.brand.primary + '55', backgroundColor: Colors.brand.light,
  },
  sheetCancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.error + '55', backgroundColor: Colors.errorBg,
  },
  viewDetailBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: Spacing.md,
  },
});
