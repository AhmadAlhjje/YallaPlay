import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../src/api/analytics.api';
import { facilitiesApi } from '../../src/api/facilities.api';
import { bookingsApi } from '../../src/api/bookings.api';
import { GlassCard } from '../../src/components/GlassCard';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

export default function DashboardTab() {
  const { owner } = useAuthStore();
  const [selectedFacility, setSelectedFacility] = useState<string | undefined>();

  const { data: facilitiesRes } = useQuery({
    queryKey: ['owner-facilities'],
    queryFn: () => facilitiesApi.getMyFacilities(),
    staleTime: 300_000,
  });

  const { data: summaryRes, isLoading: summaryLoading, refetch } = useQuery({
    queryKey: ['owner-summary', selectedFacility],
    queryFn: () => analyticsApi.getSummary(selectedFacility),
    staleTime: 60_000,
  });

  const todayDate = new Date().toISOString().split('T')[0];
  const { data: pendingRes } = useQuery({
    queryKey: ['pending-bookings', selectedFacility, todayDate],
    queryFn: async () => {
      if (!selectedFacility) return null;
      return bookingsApi.getFacilityBookings(selectedFacility, { date: todayDate, status: 'pending' });
    },
    enabled: !!selectedFacility,
    staleTime: 30_000,
  });

  const facilities: any[] = facilitiesRes?.data?.data ?? [];
  const summary = summaryRes?.data?.data;
  const pendingCount = pendingRes?.data?.data?.pagination?.total ?? 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء النور';
    return 'أهلاً';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={summaryLoading} onRefresh={refetch} tintColor={Colors.brand.primary} />}
      >
        <SafeAreaView>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>{greeting()}،</Text>
              <Text style={[Typography.h2, { color: Colors.text.primary }]}>
                {owner?.name?.split(' ')[0] ?? 'مالك'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/offers')} style={styles.offersBtn}>
              <Text style={{ fontSize: 18 }}>⚡</Text>
              <Text style={[Typography.labelSm, { color: Colors.warning }]}>عروض</Text>
            </TouchableOpacity>
          </View>

          {/* Facility selector */}
          {facilities.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedFacility(undefined)}
                  style={[styles.facilityChip, !selectedFacility && styles.facilityChipActive]}
                >
                  <Text style={[Typography.labelSm, { color: !selectedFacility ? Colors.brand.primary : Colors.text.tertiary }]}>
                    الكل
                  </Text>
                </TouchableOpacity>
                {facilities.map((f) => (
                  <TouchableOpacity
                    key={f._id}
                    onPress={() => setSelectedFacility(f._id)}
                    style={[styles.facilityChip, selectedFacility === f._id && styles.facilityChipActive]}
                  >
                    <Text style={[Typography.labelSm, { color: selectedFacility === f._id ? Colors.brand.primary : Colors.text.tertiary }]}>
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Pending bookings alert */}
          {pendingCount > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/bookings')}
              style={styles.pendingAlert}
            >
              <LinearGradient colors={[Colors.warning + '33', Colors.warning + '11']} style={StyleSheet.absoluteFill} />
              <View style={[styles.pendingBadge]}>
                <Text style={[Typography.numericMd, { color: Colors.warning }]}>{pendingCount}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.labelMd, { color: Colors.warning }]}>
                  {pendingCount} حجز{pendingCount > 1 ? 'ات' : ''} تنتظر التأكيد اليوم
                </Text>
                <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>
                  امسح رمز QR للتأكيد
                </Text>
              </View>
              <Text style={{ color: Colors.warning, fontSize: 18 }}>←</Text>
            </TouchableOpacity>
          )}

          {/* KPI Cards */}
          <View style={[styles.kpiGrid, { paddingHorizontal: Spacing.xl }]}>
            <KpiCard
              icon="💰"
              label="إيرادات اليوم"
              value={summary ? `${summary.today?.revenue ?? 0} ر.س` : '—'}
              sub={`${summary?.today?.bookings ?? 0} حجز`}
              color={Colors.success}
            />
            <KpiCard
              icon="📅"
              label="إيرادات الشهر"
              value={summary ? `${summary.month?.revenue ?? 0} ر.س` : '—'}
              sub={`${summary?.month?.bookings ?? 0} حجز`}
              color={Colors.brand.primary}
            />
            <KpiCard
              icon="📈"
              label="إجمالي الإيرادات"
              value={summary ? `${summary.allTime?.revenue ?? 0} ر.س` : '—'}
              sub={`${summary?.allTime?.bookings ?? 0} حجز`}
              color={Colors.info}
            />
            <KpiCard
              icon="❌"
              label="نسبة الإلغاء"
              value={summary ? `${(summary.cancellationRate ?? 0).toFixed(1)}%` : '—'}
              sub="هذا الشهر"
              color={Colors.error}
            />
          </View>

          {/* Quick actions */}
          <Text style={[Typography.h3, styles.sectionTitle]}>إجراءات سريعة</Text>
          <View style={[styles.quickActions, { paddingHorizontal: Spacing.xl }]}>
            <QuickAction icon="📱" label="مسح QR" onPress={() => router.push('/(tabs)/scanner')} color={Colors.success} />
            <QuickAction icon="🏟️" label="ملعب جديد" onPress={() => router.push('/facility/new')} color={Colors.brand.primary} />
            <QuickAction icon="⚡" label="عرض فلاش" onPress={() => router.push('/offers')} color={Colors.warning} />
            <QuickAction icon="📊" label="التحليلات" onPress={() => router.push('/(tabs)/profile')} color={Colors.info} />
          </View>

          {/* My Facilities list */}
          {facilities.length > 0 && (
            <>
              <Text style={[Typography.h3, styles.sectionTitle]}>ملاعبي</Text>
              {facilities.map((f) => (
                <TouchableOpacity
                  key={f._id}
                  onPress={() => router.push(`/facility/${f._id}`)}
                  style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.md }}
                >
                  <GlassCard style={styles.facilityRow}>
                    <View style={[styles.facilityIconBox, { backgroundColor: Colors.brand.primary + '22' }]}>
                      <Text style={{ fontSize: 24 }}>🏟️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.labelLg, { color: Colors.text.primary }]} numberOfLines={1}>{f.name}</Text>
                      <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]} numberOfLines={1}>{f.address}</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: f.isActive ? Colors.success : Colors.error }]} />
                    <Text style={{ color: Colors.text.tertiary, fontSize: 18 }}>›</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </>
          )}

          {facilities.length === 0 && !summaryLoading && (
            <GlassCard style={[{ marginHorizontal: Spacing.xl, padding: Spacing.xl, alignItems: 'center' }]}>
              <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>🏟️</Text>
              <Text style={[Typography.labelLg, { color: Colors.text.primary, marginBottom: Spacing.sm }]}>
                لا توجد ملاعب بعد
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/facility/new')}
                style={styles.addFacilityBtn}
              >
                <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>+ أضف ملعبك الأول</Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          <View style={{ height: 100 }} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (
    <GlassCard style={[styles.kpiCard, { borderColor: color + '33' }]}>
      <Text style={{ fontSize: 24, marginBottom: 4 }}>{icon}</Text>
      <Text style={[Typography.numericMd, { color }]}>{value}</Text>
      <Text style={[Typography.labelSm, { color: Colors.text.secondary, marginTop: 2 }]}>{label}</Text>
      <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{sub}</Text>
    </GlassCard>
  );
}

function QuickAction({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.quickAction, { backgroundColor: color + '18', borderColor: color + '44' }]}>
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={[Typography.labelSm, { color, marginTop: 4 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, marginBottom: Spacing.xl,
  },
  offersBtn: {
    alignItems: 'center', padding: Spacing.sm,
    backgroundColor: Colors.warningBg,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.warning + '44',
    minWidth: 56,
  },
  facilityChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.glass.border, backgroundColor: Colors.glass.subtle,
  },
  facilityChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary + '18' },
  pendingAlert: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.warning + '44',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    overflow: 'hidden',
  },
  pendingBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.warningBg, alignItems: 'center', justifyContent: 'center',
  },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  kpiCard: { width: '47%', padding: Spacing.lg, flex: 1 },
  sectionTitle: {
    color: Colors.text.primary, paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md, marginTop: Spacing.sm,
  },
  quickActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  quickAction: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.lg,
    borderRadius: Radius.lg, borderWidth: 1,
  },
  facilityRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md,
  },
  facilityIconBox: {
    width: 48, height: 48, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  addFacilityBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary + '15',
  },
});
