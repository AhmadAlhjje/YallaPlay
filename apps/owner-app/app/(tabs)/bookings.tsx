import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView,
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
import { formatTimeRange } from '../../src/lib/time';

// ─── Filter config ─────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: undefined,           label: 'الكل',            icon: '📋', color: Colors.text.secondary },
  { key: 'pending_payment',   label: 'بانتظار التأكيد', icon: '⏳', color: Colors.warning },
  { key: 'confirmed',         label: 'مؤكّد',           icon: '✅', color: Colors.success },
  { key: 'completed',         label: 'مكتمل',           icon: '🏁', color: Colors.info },
  { key: 'cancelled',         label: 'ملغي',            icon: '❌', color: Colors.error },
] as const;

type StatusKey = typeof STATUS_FILTERS[number]['key'];

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'بانتظار التأكيد',
  confirmed: 'مؤكّد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  no_show: 'لم يحضر',
};
const STATUS_COLORS: Record<string, string> = {
  pending_payment: Colors.warning,
  confirmed: Colors.success,
  completed: Colors.info,
  cancelled: Colors.error,
  no_show: Colors.text.tertiary,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OwnerBookingsTab() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [statusFilter, setStatusFilter]         = useState<StatusKey>(undefined);
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>();
  const [showTodayOnly, setShowTodayOnly]       = useState(false);

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

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['owner-bookings', activeFacilityId, statusFilter, showTodayOnly],
    queryFn: () => {
      if (!activeFacilityId) return Promise.resolve({ data: { data: { bookings: [], pagination: {} } } });
      return bookingsApi.getFacilityBookings(activeFacilityId, {
        status: statusFilter as string | undefined,
        date: showTodayOnly ? today : undefined,
        page: 1,
      });
    },
    enabled: facilities.length > 0,
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingsApi.cancel(id, reason),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-bookings'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر الإلغاء'),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.confirmManual(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-bookings'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر التأكيد'),
  });

  const bookings: any[] = data?.data?.data?.bookings ?? [];

  const confirmCancel = (id: string, name: string) => {
    Alert.alert(
      'إلغاء الحجز',
      `هل تريد إلغاء حجز ${name}؟`,
      [
        { text: 'رجوع', style: 'cancel' },
        {
          text: 'إلغاء الحجز',
          style: 'destructive',
          onPress: () => cancelMutation.mutate({ id, reason: 'إلغاء من المالك' }),
        },
      ],
    );
  };

  const activeFilter = STATUS_FILTERS.find(f => f.key === statusFilter);

  return (
    <View style={styles.container}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[Typography.h2, { color: Colors.text.primary }]}>الحجوزات</Text>
          <TouchableOpacity
            onPress={() => router.push('/booking/add')}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>إضافة حجز</Text>
          </TouchableOpacity>
        </View>

        {/* ── Date toggle ─────────────────────────────────────────── */}
        <View style={styles.dateToggleRow}>
          <TouchableOpacity
            onPress={() => setShowTodayOnly(false)}
            style={[styles.dateToggle, !showTodayOnly && styles.dateToggleActive]}
          >
            <Text style={[styles.dateToggleText, !showTodayOnly && styles.dateToggleTextActive]}>
              كل الأيام
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowTodayOnly(true)}
            style={[styles.dateToggle, showTodayOnly && styles.dateToggleActive]}
          >
            <Ionicons
              name="today"
              size={13}
              color={showTodayOnly ? Colors.brand.primary : Colors.text.tertiary}
            />
            <Text style={[styles.dateToggleText, showTodayOnly && styles.dateToggleTextActive]}>
              اليوم فقط
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Facility chips ──────────────────────────────────────── */}
        {facilities.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {[{ _id: undefined as any, name: 'الكل' }, ...facilities].map((f) => (
              <TouchableOpacity
                key={f._id ?? 'all'}
                onPress={() => setSelectedFacility(f._id)}
                style={[styles.chip, activeFacilityId === f._id && styles.chipActive]}
              >
                <Text style={[
                  Typography.labelSm,
                  { color: activeFacilityId === f._id ? Colors.brand.primary : Colors.text.tertiary },
                ]}>
                  {f.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Status filter ───────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {STATUS_FILTERS.map((item) => {
            const active = statusFilter === item.key;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => setStatusFilter(item.key)}
                style={[
                  styles.statusChip,
                  active && { borderColor: item.color, backgroundColor: item.color + '18' },
                ]}
              >
                <Text style={{ fontSize: 12 }}>{item.icon}</Text>
                <Text style={[
                  Typography.labelSm,
                  { color: active ? item.color : Colors.text.tertiary },
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* ── Content ──────────────────────────────────────────────── */}
      {isLoading ? (
        <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.huge }} />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 52, marginBottom: Spacing.md }}>
            {activeFilter?.icon ?? '📋'}
          </Text>
          <Text style={[Typography.h3, { color: Colors.text.secondary, textAlign: 'center' }]}>
            لا توجد حجوزات
          </Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center', marginTop: 4 }]}>
            {showTodayOnly ? 'لا توجد حجوزات اليوم' : 'لم يتم تسجيل أي حجوزات بعد'}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/booking/add')}
            style={[styles.addBtn, { marginTop: Spacing.xl, paddingHorizontal: Spacing.xl }]}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>إضافة حجز يدوي</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onCancel={() => confirmCancel(item._id, item.guestName ?? item.user?.name ?? 'اللاعب')}
              onConfirm={() => confirmMutation.mutate(item._id)}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({
  booking, onCancel, onConfirm,
}: { booking: any; onCancel: () => void; onConfirm: () => void }) {
  const statusColor = STATUS_COLORS[booking.status] ?? Colors.text.secondary;
  const ref = (booking.bookingRef ?? booking._id.slice(-6)).toUpperCase();
  const isPending = booking.status === 'pending_payment';
  const isOwnerAdded = booking.source === 'owner';

  const displayName = booking.guestName ?? booking.user?.name ?? 'لاعب';
  const displayPhone = booking.guestPhone ?? booking.user?.phone;

  return (
    <GlassCard style={[styles.card, isPending && { borderLeftColor: Colors.warning, borderLeftWidth: 3 }]}>

      {/* Name + status row */}
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[Typography.labelLg, { color: Colors.text.primary }]} numberOfLines={1}>
              {displayName}
            </Text>
            {isOwnerAdded && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>يدوي</Text>
              </View>
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

      {/* Info chips */}
      <View style={styles.infoRow}>
        <InfoChip icon="calendar-outline" value={booking.date} />
        <InfoChip icon="time-outline" value={formatTimeRange(booking.startTime, booking.endTime)} />
        <InfoChip icon="cash-outline" value={`${booking.totalPrice ?? booking.price ?? 0} ل.س`} highlight />
        {isOwnerAdded && (booking.depositPaid ?? 0) > 0 && (
          <InfoChip icon="wallet-outline" value={`عربون: ${booking.depositPaid} ل.س`} />
        )}
      </View>

      {/* Ref */}
      <Text style={styles.refText}>#{ref}</Text>

      {/* Actions for pending */}
      {isPending && (
        <View style={[styles.cardRow, { marginTop: Spacing.md, gap: Spacing.sm }]}>
          <TouchableOpacity onPress={onConfirm} style={styles.confirmBtn}>
            <Ionicons name="checkmark-circle-outline" size={15} color={Colors.brand.primary} />
            <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>تأكيد الدفع</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Ionicons name="close-circle-outline" size={15} color={Colors.error} />
            <Text style={[Typography.labelMd, { color: Colors.error }]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      )}
    </GlassCard>
  );
}

function InfoChip({ icon, value, highlight }: {
  icon: keyof typeof Ionicons.glyphMap; value: string; highlight?: boolean;
}) {
  return (
    <View style={styles.infoChip}>
      <Ionicons name={icon} size={11} color={highlight ? Colors.brand.primary : Colors.text.tertiary} />
      <Text style={[Typography.bodySm, { color: highlight ? Colors.brand.primary : Colors.text.secondary }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background.secondary },

  // Header
  header: { backgroundColor: Colors.background.primary, borderBottomWidth: 1, borderBottomColor: Colors.glass.border },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.md, paddingVertical: 9,
    borderRadius: Radius.md,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Date toggle
  dateToggleRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm,
  },
  dateToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
  },
  dateToggleActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },
  dateToggleText: { fontSize: 12, fontWeight: '600', color: Colors.text.tertiary },
  dateToggleTextActive: { color: Colors.brand.primary },

  // Chips
  chipRow: { paddingHorizontal: Spacing.xl, gap: 8, paddingBottom: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
  },
  chipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
  },

  // List
  list: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 110 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },

  // Card
  card: { padding: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  ownerBadge: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: Radius.sm, backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.primary + '44',
  },
  ownerBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.brand.primary },

  infoRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.glass.border,
  },
  refText: {
    fontSize: 11, fontWeight: '600', color: Colors.text.tertiary,
    letterSpacing: 1, textAlign: 'right',
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  confirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.brand.primary + '55', backgroundColor: Colors.brand.light,
  },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.error + '55', backgroundColor: Colors.errorBg,
  },
});
