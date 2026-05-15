import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { analyticsApi } from '../../src/api/analytics.api';
import { facilitiesApi } from '../../src/api/facilities.api';
import { bookingsApi } from '../../src/api/bookings.api';
import { notificationsApi } from '../../src/api/notifications.api';
import { GlassCard } from '../../src/components/GlassCard';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { formatTime12h } from '../../src/lib/time';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'مساء الخير';
  return 'أهلاً';
}

function todayLabel() {
  return new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: Colors.text.tertiary,
  pending_payment: Colors.warning,
  confirmed: Colors.success,
  completed: Colors.info,
  cancelled: Colors.error,
};
const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'بانتظار الدفع',
  pending_payment: 'بانتظار التأكيد',
  confirmed: 'مؤكّد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardTab() {
  const { owner } = useAuthStore();
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>();

  const todayDate = new Date().toISOString().split('T')[0];

  const { data: facilitiesRes, isLoading: facilitiesLoading } = useQuery({
    queryKey: ['owner-facilities'],
    queryFn: () => facilitiesApi.getMyFacilities(),
    staleTime: 0,
    refetchOnMount: true,
  });

  const facilitiesPayload = facilitiesRes?.data;
  const facilities: any[] = Array.isArray(facilitiesPayload?.data)
    ? facilitiesPayload.data
    : Array.isArray(facilitiesPayload)
      ? facilitiesPayload
      : facilitiesPayload?.facilities ?? [];

  const activeFacilityId = selectedFacility ?? facilities[0]?._id;

  const { data: notifRes } = useQuery({
    queryKey: ['owner-notifications-unread'],
    queryFn: () => notificationsApi.getInbox(1),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const unreadCount: number = notifRes?.data?.data?.unreadCount ?? 0;

  const { data: summaryRes, isLoading: summaryLoading, refetch } = useQuery({
    queryKey: ['owner-summary', selectedFacility],
    queryFn: () => analyticsApi.getSummary(selectedFacility),
    staleTime: 60_000,
  });
  const summary = summaryRes?.data?.data;

  const { data: todayBookingsRes, isLoading: todayLoading } = useQuery({
    queryKey: ['today-bookings', activeFacilityId, todayDate],
    queryFn: () => {
      if (!activeFacilityId) return null;
      return bookingsApi.getFacilityBookings(activeFacilityId, { date: todayDate, page: 1 });
    },
    enabled: !!activeFacilityId,
    staleTime: 30_000,
  });

  const todayBookings: any[] = todayBookingsRes?.data?.data?.bookings ?? [];
  const pendingCount = todayBookings.filter(b => b.status === 'pending_payment').length;

  const isRefreshing = summaryLoading && !summary;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#fff" />
        }
      >
        {/* ── Green Banner Header ──────────────────────────────────── */}
        <View style={styles.banner}>
          <SafeAreaView>
            <View style={styles.bannerInner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerGreeting}>{greeting()}،</Text>
                <Text style={styles.bannerName}>
                  {owner?.name?.split(' ')[0] ?? 'مالك'}
                </Text>
                <Text style={styles.bannerDate}>{todayLabel()}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bellBtn}>
                  <Ionicons name="notifications-outline" size={20} color="#fff" />
                  {unreadCount > 0 && (
                    <View style={styles.bellBadge}>
                      <Text style={styles.bellBadgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/offers')} style={styles.offersBtn}>
                  <Text style={{ fontSize: 18 }}>⚡</Text>
                  <Text style={styles.offersBtnText}>عروض</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stat pills inside banner */}
            <View style={styles.bannerStats}>
              <BannerStat
                label="حجوزات اليوم"
                value={`${todayBookings.length}`}
                unit="حجز"
              />
              <View style={styles.bannerStatDivider} />
              <BannerStat
                label="بانتظار التأكيد"
                value={`${pendingCount}`}
                unit=""
                warn={pendingCount > 0}
              />
              <View style={styles.bannerStatDivider} />
              <BannerStat
                label="حجوزات الشهر"
                value={`${summary?.thisMonth?.bookings ?? 0}`}
                unit="حجز"
              />
            </View>
          </SafeAreaView>
        </View>

        {/* ── Facility Selector ────────────────────────────────────── */}
        {facilities.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.facilityScroll}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: 8 }}
          >
            <FacilityChip
              label="الكل"
              active={!selectedFacility}
              onPress={() => setSelectedFacility(undefined)}
            />
            {facilities.map((f) => (
              <FacilityChip
                key={f._id}
                label={f.name}
                active={selectedFacility === f._id}
                onPress={() => setSelectedFacility(f._id)}
              />
            ))}
          </ScrollView>
        )}

        {/* ── Month Stats ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.monthRow}>
            <MonthCard
              icon="📅"
              label="حجوزات هذا الشهر"
              value={`${summary?.thisMonth?.bookings ?? 0}`}
              unit="حجز"
              color={Colors.brand.primary}
            />
            <MonthCard
              icon="📈"
              label="إجمالي الحجوزات"
              value={`${summary?.allTime?.bookings ?? 0}`}
              unit="حجز"
              color={Colors.info}
            />
          </View>
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.actionsGrid}>
            <ActionCard
              icon="➕"
              label="إضافة حجز"
              desc="حجز بالكاش"
              color={Colors.brand.primary}
              onPress={() => router.push('/booking/add')}
            />
            <ActionCard
              icon="🏟️"
              label="ملعب جديد"
              desc="أضف ملعبك"
              color={Colors.info}
              onPress={() => router.push('/facility/new')}
            />
            <ActionCard
              icon="⚡"
              label="عرض فلاش"
              desc="خصم لوقت"
              color={Colors.warning}
              onPress={() => router.push('/offers')}
            />
            <ActionCard
              icon="📋"
              label="كل الحجوزات"
              desc="عرض وإدارة"
              color="#8B5CF6"
              onPress={() => router.push('/(tabs)/bookings')}
            />
          </View>
        </View>

        {/* ── Today's Bookings ──────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>حجوزات اليوم</Text>
            {todayBookings.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
                <Text style={styles.seeAll}>عرض الكل ›</Text>
              </TouchableOpacity>
            )}
          </View>

          {!activeFacilityId ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>أضف ملعبك أولاً لعرض الحجوزات</Text>
            </GlassCard>
          ) : todayLoading ? (
            <ActivityIndicator color={Colors.brand.primary} style={{ marginVertical: Spacing.xl }} />
          ) : todayBookings.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>📋</Text>
              <Text style={styles.emptyText}>لا توجد حجوزات اليوم</Text>
              <TouchableOpacity
                onPress={() => router.push('/booking/add')}
                style={styles.addBookingInline}
              >
                <Text style={styles.addBookingInlineText}>+ إضافة حجز يدوي</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            todayBookings.slice(0, 5).map((b) => (
              <TodayBookingRow key={b._id} booking={b} />
            ))
          )}
        </View>

        {/* ── My Facilities ─────────────────────────────────────────── */}
        {facilities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ملاعبي</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/facilities')}>
                <Text style={styles.seeAll}>إدارة ›</Text>
              </TouchableOpacity>
            </View>
            {facilitiesLoading ? (
              <ActivityIndicator color={Colors.brand.primary} />
            ) : (
              facilities.map((f) => (
                <TouchableOpacity
                  key={f._id}
                  onPress={() => router.push(`/facility/${f._id}`)}
                >
                  <GlassCard style={styles.facilityRow}>
                    <View style={[styles.facilityIconBox, { backgroundColor: f.isActive ? Colors.brand.light : Colors.errorBg }]}>
                      <Text style={{ fontSize: 22 }}>🏟️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.labelMd, { color: Colors.text.primary }]} numberOfLines={1}>
                        {f.name}
                      </Text>
                      <View style={styles.facilityAddressRow}>
                        <Ionicons name="location-sharp" size={12} color={Colors.brand.primary} />
                        <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]} numberOfLines={1}>
                          {f.address}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <View style={[styles.statusDot, { backgroundColor: f.isActive ? Colors.success : Colors.error }]} />
                      <Text style={[Typography.labelSm, { color: f.isActive ? Colors.success : Colors.error }]}>
                        {f.isActive ? 'نشط' : 'موقوف'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Empty state */}
        {!facilitiesLoading && facilities.length === 0 && (
          <View style={styles.section}>
            <GlassCard style={styles.emptyFacility}>
              <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: Spacing.md }}>🏟️</Text>
              <Text style={[Typography.h3, { color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.sm }]}>
                لا توجد ملاعب بعد
              </Text>
              <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center', marginBottom: Spacing.lg }]}>
                أضف ملعبك الأول وابدأ باستقبال الحجوزات
              </Text>
              <TouchableOpacity onPress={() => router.push('/facility/new')} style={styles.addFirstBtn}>
                <Text style={[Typography.labelMd, { color: '#fff' }]}>+ أضف ملعبك الأول</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BannerStat({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <View style={styles.bannerStat}>
      <View style={styles.bannerStatRow}>
        <Text style={[styles.bannerStatValue, warn && { color: Colors.warning }]}>{value}</Text>
        {unit ? <Text style={styles.bannerStatUnit}> {unit}</Text> : null}
      </View>
      <Text style={styles.bannerStatLabel}>{label}</Text>
    </View>
  );
}

function FacilityChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.facilityChip, active && styles.facilityChipActive]}
    >
      <Text style={[Typography.labelSm, { color: active ? Colors.brand.primary : Colors.text.tertiary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MonthCard({ icon, label, value, unit, color }: {
  icon: string; label: string; value: string; unit: string; color: string;
}) {
  return (
    <GlassCard style={[styles.monthCard, { borderColor: color + '33' }]}>
      <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Text style={[Typography.numericMd, { color }]}>{value}</Text>
        <Text style={[Typography.labelSm, { color: Colors.text.tertiary }]}> {unit}</Text>
      </View>
      <Text style={[Typography.labelSm, { color: Colors.text.secondary, marginTop: 2 }]}>{label}</Text>
    </GlassCard>
  );
}

function ActionCard({ icon, label, desc, color, onPress }: {
  icon: string; label: string; desc: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.actionCard, { backgroundColor: color + '0F', borderColor: color + '33' }]}
    >
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <Text style={[Typography.labelSm, { color, marginTop: 6 }]}>{label}</Text>
      <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{desc}</Text>
    </TouchableOpacity>
  );
}

function TodayBookingRow({ booking }: { booking: any }) {
  const statusColor = STATUS_COLORS[booking.status] ?? Colors.text.secondary;
  const name = booking.guestName ?? booking.user?.name ?? 'لاعب';
  const isPending = booking.status === 'pending_payment';

  return (
    <GlassCard style={[styles.todayRow, isPending && { borderLeftWidth: 3, borderLeftColor: Colors.warning }]}>
      <View style={styles.todayTimeBox}>
        <Text style={styles.todayTime}>{formatTime12h(booking.startTime)}</Text>
        <Text style={styles.todayTimeSub}>{formatTime12h(booking.endTime)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.labelMd, { color: Colors.text.primary }]} numberOfLines={1}>
          {name}
        </Text>
        {booking.guestPhone || booking.user?.phone ? (
          <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>
            {booking.guestPhone ?? booking.user?.phone}
          </Text>
        ) : null}
      </View>
      <View style={[styles.statusPill, { backgroundColor: statusColor + '18', borderColor: statusColor + '44' }]}>
        <View style={[styles.statusDotSm, { backgroundColor: statusColor }]} />
        <Text style={[Typography.labelSm, { color: statusColor }]}>
          {STATUS_LABELS[booking.status] ?? booking.status}
        </Text>
      </View>
    </GlassCard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },

  // Banner
  banner: {
    backgroundColor: Colors.brand.primary,
    paddingBottom: Spacing.lg,
  },
  bannerInner: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  bannerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  bannerName: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 2 },
  bannerDate: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: Colors.brand.primary,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  offersBtn: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    gap: 2, minWidth: 60,
  },
  offersBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  bannerStats: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.lg, paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerStatRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  bannerStatValue: { fontSize: 20, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'] as any },
  bannerStatUnit: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  bannerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2, textAlign: 'center' },
  bannerStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Facility selector
  facilityScroll: { paddingVertical: Spacing.md, backgroundColor: Colors.background.primary },
  facilityChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
  },
  facilityChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },

  // Section
  section: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  sectionTitle: {
    ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAll: { fontSize: 13, fontWeight: '600', color: Colors.brand.primary },

  // Month cards
  monthRow: { flexDirection: 'row', gap: Spacing.md },
  monthCard: { flex: 1, padding: Spacing.lg, borderWidth: 1 },

  // Actions grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionCard: {
    width: '47%', alignItems: 'center', paddingVertical: Spacing.lg,
    borderRadius: Radius.lg, borderWidth: 1, gap: 2,
  },

  // Today's bookings
  todayRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  todayTimeBox: {
    width: 52, alignItems: 'center',
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.sm, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.brand.primary + '33',
  },
  todayTime: { fontSize: 13, fontWeight: '800', color: Colors.brand.primary },
  todayTimeSub: { fontSize: 10, color: Colors.brand.primary + 'AA', marginTop: 1 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusDotSm: { width: 5, height: 5, borderRadius: 3 },

  emptyCard: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center' },
  addBookingInline: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.brand.primary + '55', backgroundColor: Colors.brand.light,
  },
  addBookingInlineText: { fontSize: 13, fontWeight: '700', color: Colors.brand.primary },

  // Facilities list
  facilityRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  facilityIconBox: {
    width: 46, height: 46, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  facilityAddressRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  emptyFacility: { padding: Spacing.xl, alignItems: 'center' },
  addFirstBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
});
