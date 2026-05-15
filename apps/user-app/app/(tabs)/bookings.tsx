import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../../src/api/bookings.api';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { formatTimeRange } from '../../src/lib/time';

type Filter = 'upcoming' | 'past';

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: Colors.text.tertiary,
  pending_payment:  Colors.warning,
  confirmed:        Colors.success,
  completed:        Colors.info,
  cancelled:        Colors.error,
  no_show:          Colors.text.tertiary,
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'بانتظار الدفع',
  pending_payment:  'بانتظار التأكيد',
  confirmed:        'مؤكّد',
  completed:        'مكتمل',
  cancelled:        'ملغي',
  no_show:          'لم يحضر',
};

export default function BookingsTab() {
  const [filter, setFilter] = useState<Filter>('upcoming');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['myBookings', filter],
    queryFn: () => bookingsApi.getMyBookings(filter),
    staleTime: 30_000,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const bookings = data?.data?.data?.bookings ?? [];

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <Text style={[Typography.h2, styles.heading]}>حجوزاتي</Text>

        {/* Filter Tabs */}
        <View style={styles.tabs}>
          <FilterTab label="القادمة" active={filter === 'upcoming'} onPress={() => setFilter('upcoming')} />
          <FilterTab label="السابقة" active={filter === 'past'} onPress={() => setFilter('past')} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.huge }} />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 52 }}>📋</Text>
          <Text style={[Typography.h3, { color: Colors.text.secondary, marginTop: Spacing.lg }]}>
            {filter === 'upcoming' ? 'لا توجد حجوزات قادمة' : 'لا توجد حجوزات سابقة'}
          </Text>
          {filter === 'upcoming' && (
            <TouchableOpacity
              onPress={() => router.push('/')}
              style={styles.browseBtn}
            >
              <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>تصفّح الملاعب</Text>
            </TouchableOpacity>
          )}
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
            <BookingCard booking={item} onPress={() => router.push(`/booking/${item._id}`)} />
          )}
        />
      )}
    </View>
  );
}

function BookingCard({ booking, onPress }: { booking: any; onPress: () => void }) {
  const statusColor = STATUS_COLORS[booking.status] ?? Colors.text.secondary;
  const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;
  const ref = booking.bookingRef ?? booking._id.slice(-8).toUpperCase();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={[Typography.h3, { color: Colors.text.primary, flex: 1 }]} numberOfLines={1}>
            {booking.facilityId?.name ?? '—'}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
            <Text style={[Typography.labelSm, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={[styles.cardRow, { marginTop: Spacing.sm }]}>
          <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>📅 {booking.date}</Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>
            🕐 {formatTimeRange(booking.startTime, booking.endTime)}
          </Text>
        </View>

        <View style={[styles.cardRow, { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border.default, paddingTop: Spacing.md }]}>
          <Text style={[Typography.numericMd, { color: Colors.brand.primary }]}>{booking.totalPrice} ر.س</Text>
          <Text style={[Typography.labelSm, { color: Colors.text.tertiary, letterSpacing: 2 }]}>#{ref}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

function FilterTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterTab, active && styles.filterTabActive]}
    >
      <Text style={[Typography.labelMd, { color: active ? Colors.brand.primary : Colors.text.tertiary }]}>
        {label}
      </Text>
      {active && <View style={styles.filterIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  heading: {
    color: Colors.text.primary,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    marginBottom: Spacing.lg,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    marginRight: Spacing.xl,
    alignItems: 'center',
  },
  filterTabActive: { borderBottomWidth: 0 },
  filterIndicator: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, backgroundColor: Colors.brand.primary, borderRadius: 1,
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.huge,
  },
  browseBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.light,
  },
  card: { padding: Spacing.lg, marginBottom: Spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
});
