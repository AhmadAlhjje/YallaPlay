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
  { key: undefined, label: 'الكل' },
  { key: 'pending',   label: 'معلّق' },
  { key: 'confirmed', label: 'مؤكّد' },
  { key: 'completed', label: 'مكتمل' },
  { key: 'cancelled', label: 'ملغي' },
] as const;

type StatusKey = typeof STATUS_FILTERS[number]['key'];

const STATUS_COLORS: Record<string, string> = {
  pending:   Colors.warning,
  confirmed: Colors.success,
  completed: Colors.info,
  cancelled: Colors.error,
  no_show:   Colors.text.tertiary,
};

export default function OwnerBookingsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusKey>(undefined);
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>();
  const [dateFilter, setDateFilter]     = useState<string | undefined>();

  const { data: facilitiesRes } = useQuery({
    queryKey: ['owner-facilities'],
    queryFn: () => facilitiesApi.getMyFacilities(),
    staleTime: 300_000,
  });

  const facilities: any[] = facilitiesRes?.data?.data ?? [];

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['owner-bookings', selectedFacility, statusFilter, dateFilter],
    queryFn: () => {
      if (!selectedFacility && facilities.length === 0) return Promise.resolve({ data: { data: { bookings: [], pagination: {} } } });
      const fid = selectedFacility ?? facilities[0]?._id;
      if (!fid) return Promise.resolve({ data: { data: { bookings: [], pagination: {} } } });
      return bookingsApi.getFacilityBookings(fid, {
        status: statusFilter,
        date: dateFilter,
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

  const confirmCancel = (id: string) => {
    Alert.alert('إلغاء الحجز', 'هل تريد إلغاء هذا الحجز؟', [
      { text: 'لا', style: 'cancel' },
      {
        text: 'نعم، إلغاء',
        style: 'destructive',
        onPress: () => cancelMutation.mutate({ id, reason: 'إلغاء من المالك' }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <Text style={[Typography.h2, styles.heading]}>الحجوزات</Text>

        {/* Facility selector */}
        {facilities.length > 1 && (
          <FlatList
            horizontal
            data={[{ _id: undefined, name: 'الكل' }, ...facilities]}
            keyExtractor={(f) => f._id ?? 'all'}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: 8, marginBottom: Spacing.md }}
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

        {/* Status filter tabs */}
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(s) => s.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: 8, marginBottom: Spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setStatusFilter(item.key)}
              style={[styles.chip, statusFilter === item.key && styles.chipActive]}
            >
              <Text style={[Typography.labelSm, { color: statusFilter === item.key ? Colors.brand.primary : Colors.text.tertiary }]}>
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
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={[Typography.h3, { color: Colors.text.secondary, marginTop: Spacing.lg }]}>
            لا توجد حجوزات
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <OwnerBookingCard
              booking={item}
              onCancel={() => confirmCancel(item._id)}
              onScanConfirm={() => router.push('/(tabs)/scanner')}
            />
          )}
        />
      )}
    </View>
  );
}

function OwnerBookingCard({
  booking, onCancel, onScanConfirm,
}: { booking: any; onCancel: () => void; onScanConfirm: () => void }) {
  const statusColor = STATUS_COLORS[booking.status] ?? Colors.text.secondary;
  const statusLabels: Record<string, string> = {
    pending: 'معلّق', confirmed: 'مؤكّد', completed: 'مكتمل', cancelled: 'ملغي',
  };
  const ref = booking.bookingRef ?? booking._id.slice(-8).toUpperCase();

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardRow}>
        <View>
          <Text style={[Typography.labelLg, { color: Colors.text.primary }]}>
            {booking.user?.name ?? 'لاعب'}
          </Text>
          <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{booking.user?.phone}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
          <Text style={[Typography.labelSm, { color: statusColor }]}>{statusLabels[booking.status] ?? booking.status}</Text>
        </View>
      </View>

      <View style={[styles.cardRow, { marginTop: Spacing.sm }]}>
        <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>📅 {booking.date}</Text>
        <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>🕐 {booking.startTime} – {booking.endTime}</Text>
      </View>

      <View style={[styles.cardRow, { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.glass.border, paddingTop: Spacing.md }]}>
        <Text style={[Typography.numericSm, { color: Colors.brand.primary }]}>{booking.price} ر.س</Text>
        <Text style={[Typography.labelSm, { color: Colors.text.tertiary, letterSpacing: 1.5 }]}>#{ref}</Text>
      </View>

      {booking.status === 'pending' && (
        <View style={[styles.cardRow, { marginTop: Spacing.md, gap: Spacing.sm }]}>
          <TouchableOpacity onPress={onScanConfirm} style={styles.confirmBtn}>
            <Text style={[Typography.labelMd, { color: Colors.success }]}>📱 تأكيد QR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={[Typography.labelMd, { color: Colors.error }]}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  heading: {
    color: Colors.text.primary,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.glass.border, backgroundColor: Colors.glass.subtle,
  },
  chipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary + '18' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { padding: Spacing.lg, marginBottom: Spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
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
