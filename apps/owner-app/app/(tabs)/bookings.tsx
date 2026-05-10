import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { bookingsApi } from '../../src/api/bookings.api';
import { facilitiesApi } from '../../src/api/facilities.api';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const STATUS_FILTERS = [
  { key: undefined,    label: 'الكل',    color: Colors.text.secondary },
  { key: 'pending',    label: 'بانتظار تأكيد', color: Colors.warning },
  { key: 'confirmed',  label: 'مؤكّد',   color: Colors.success },
  { key: 'completed',  label: 'مكتمل',   color: Colors.info },
  { key: 'cancelled',  label: 'ملغي',    color: Colors.error },
] as const;

type StatusKey = typeof STATUS_FILTERS[number]['key'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'بانتظار تأكيد', confirmed: 'مؤكّد', completed: 'مكتمل',
  cancelled: 'ملغي', no_show: 'لم يحضر',
};
const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning, confirmed: Colors.success,
  completed: Colors.info, cancelled: Colors.error, no_show: Colors.text.tertiary,
};

export default function OwnerBookingsTab() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [statusFilter, setStatusFilter]       = useState<StatusKey>(undefined);
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>();
  const [showTodayOnly, setShowTodayOnly]       = useState(false);

  const { data: facilitiesRes } = useQuery({
    queryKey: ['owner-facilities'],
    queryFn: () => facilitiesApi.getMyFacilities(),
    staleTime: 300_000,
  });

  const facilities: any[] = facilitiesRes?.data?.data ?? [];

  const firstFacilityId = selectedFacility ?? facilities[0]?._id;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['owner-bookings', firstFacilityId, statusFilter, showTodayOnly],
    queryFn: () => {
      if (!firstFacilityId) return Promise.resolve({ data: { data: { bookings: [], pagination: {} } } });
      return bookingsApi.getFacilityBookings(firstFacilityId, {
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
      qc.invalidateQueries({ queryKey: ['pending-bookings'] });
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر الإلغاء'),
  });

  const bookings: any[] = data?.data?.data?.bookings ?? [];

  const confirmCancel = (id: string, playerName: string) => {
    Alert.alert(
      'إلغاء الحجز',
      `هل تريد إلغاء حجز ${playerName}؟`,
      [
        { text: 'لا، رجوع', style: 'cancel' },
        {
          text: 'نعم، إلغاء',
          style: 'destructive',
          onPress: () => cancelMutation.mutate({ id, reason: 'إلغاء من المالك' }),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topSection}>
        <Text style={[Typography.h2, styles.heading]}>الحجوزات</Text>

        {/* Today filter toggle */}
        <TouchableOpacity
          onPress={() => setShowTodayOnly(!showTodayOnly)}
          style={[styles.todayToggle, showTodayOnly && styles.todayToggleActive]}
        >
          <Text style={[Typography.labelMd, { color: showTodayOnly ? Colors.brand.primary : Colors.text.secondary }]}>
            📅 {showTodayOnly ? 'اليوم فقط' : 'كل الأيام'}
          </Text>
        </TouchableOpacity>

        {/* Facility selector */}
        {facilities.length > 1 && (
          <FlatList
            horizontal
            data={[{ _id: undefined as any, name: 'الكل' }, ...facilities]}
            keyExtractor={(f) => f._id ?? 'all'}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: 8, paddingBottom: Spacing.sm }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedFacility(item._id)}
                style={[styles.chip, selectedFacility === item._id && styles.chipActive]}
              >
                <Text style={[Typography.labelSm, { color: selectedFacility === item._id ? Colors.brand.primary : Colors.text.tertiary }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Status filter */}
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(s) => s.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: 8, paddingBottom: Spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setStatusFilter(item.key)}
              style={[
                styles.chip,
                statusFilter === item.key && { borderColor: item.color, backgroundColor: item.color + '15' },
              ]}
            >
              <Text style={[Typography.labelSm, { color: statusFilter === item.key ? item.color : Colors.text.tertiary }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>

      {isLoading ? (
        <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.huge }} />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 52 }}>📋</Text>
          <Text style={[Typography.h3, { color: Colors.text.secondary, marginTop: Spacing.lg, textAlign: 'center' }]}>
            لا توجد حجوزات
          </Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center', marginTop: 4 }]}>
            {showTodayOnly ? 'لا توجد حجوزات اليوم' : 'لم يتم تسجيل أي حجوزات بعد'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onCancel={() => confirmCancel(item._id, item.user?.name ?? 'اللاعب')}
              onScanConfirm={() => router.push('/(tabs)/scanner')}
            />
          )}
        />
      )}
    </View>
  );
}

function BookingCard({
  booking, onCancel, onScanConfirm,
}: { booking: any; onCancel: () => void; onScanConfirm: () => void }) {
  const statusColor = STATUS_COLORS[booking.status] ?? Colors.text.secondary;
  const ref = (booking.bookingRef ?? booking._id.slice(-8)).toUpperCase();
  const isPending = booking.status === 'pending';

  return (
    <GlassCard style={[styles.card, isPending && { borderLeftColor: Colors.warning, borderLeftWidth: 4 }]}>
      {/* Player + status */}
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.labelLg, { color: Colors.text.primary }]}>
            👤 {booking.user?.name ?? 'لاعب'}
          </Text>
          <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>
            📞 {booking.user?.phone ?? '—'}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '18', borderColor: statusColor + '44' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[Typography.labelSm, { color: statusColor }]}>
            {STATUS_LABELS[booking.status] ?? booking.status}
          </Text>
        </View>
      </View>

      {/* Date, time, price */}
      <View style={[styles.cardRow, styles.infoRow]}>
        <InfoChip icon="📅" value={booking.date} />
        <InfoChip icon="🕐" value={`${booking.startTime} – ${booking.endTime}`} />
        <InfoChip icon="💰" value={`${booking.price} ل.س`} highlight />
      </View>

      {/* Ref */}
      <Text style={[Typography.labelSm, { color: Colors.text.tertiary, textAlign: 'left', letterSpacing: 1 }]}>
        #{ref}
      </Text>

      {/* Actions for pending */}
      {isPending && (
        <View style={[styles.cardRow, { marginTop: Spacing.md, gap: Spacing.sm }]}>
          <TouchableOpacity onPress={onScanConfirm} style={styles.confirmBtn}>
            <Text style={[Typography.labelMd, { color: Colors.success }]}>📱 تأكيد برمز QR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={[Typography.labelMd, { color: Colors.error }]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      )}
    </GlassCard>
  );
}

function InfoChip({ icon, value, highlight }: { icon: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoChip}>
      <Text style={[Typography.bodySm, { color: highlight ? Colors.brand.primary : Colors.text.secondary }]}>
        {icon} {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background.secondary },
  topSection: { backgroundColor: Colors.background.primary, borderBottomWidth: 1, borderBottomColor: Colors.glass.border },
  heading: {
    color: Colors.text.primary,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, marginBottom: Spacing.md,
  },
  todayToggle: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
    alignSelf: 'flex-start',
  },
  todayToggleActive: {
    borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light,
  },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
  },
  chipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  card: { padding: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: 2 },
  infoChip: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.glass.border,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  confirmBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.success + '55', backgroundColor: Colors.successBg,
  },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.error + '55', backgroundColor: Colors.errorBg,
  },
});
