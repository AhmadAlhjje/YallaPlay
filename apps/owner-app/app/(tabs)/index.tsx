import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
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
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: summaryRes, isLoading: summaryLoading, refetch } = useQuery({
    queryKey: ['owner-summary', selectedFacility],
    queryFn: () => analyticsApi.getSummary(selectedFacility),
    staleTime: 60_000,
  });

  const facilitiesPayload = facilitiesRes?.data;
  const facilities: any[] = Array.isArray(facilitiesPayload?.data)
    ? facilitiesPayload.data
    : Array.isArray(facilitiesPayload)
      ? facilitiesPayload
      : facilitiesPayload?.facilities ?? [];
  const summary = summaryRes?.data?.data;

  const todayDate = new Date().toISOString().split('T')[0];
  const firstFacilityId = facilities[0]?._id;
  const { data: pendingRes } = useQuery({
    queryKey: ['pending-bookings', selectedFacility ?? firstFacilityId, todayDate],
    queryFn: async () => {
      const fid = selectedFacility ?? firstFacilityId;
      if (!fid) return null;
      return bookingsApi.getFacilityBookings(fid, { date: todayDate, status: 'pending' });
    },
    enabled: facilities.length > 0,
    staleTime: 30_000,
  });
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
        refreshControl={
          <RefreshControl refreshing={summaryLoading} onRefresh={refetch} tintColor={Colors.brand.primary} />
        }
      >
        <SafeAreaView>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[Typography.bodyMd, { color: Colors.text.tertiary }]}>{greeting()}،</Text>
              <Text style={[Typography.h2, { color: Colors.text.primary }]}>
                {owner?.name?.split(' ')[0] ?? 'مالك'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/offers')} style={styles.offersBtn}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
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
              onPress={() => router.push('/(tabs)/scanner')}
              style={styles.pendingAlert}
            >
              <View style={styles.pendingBadge}>
                <Text style={[Typography.numericMd, { color: Colors.warning }]}>{pendingCount}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.labelMd, { color: Colors.warning }]}>
                  {pendingCount} حجز{pendingCount > 1 ? 'ات' : ''} تنتظر تأكيدك اليوم
                </Text>
                <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>
                  اضغط هنا لمسح رمز QR وتأكيد الحجوزات
                </Text>
              </View>
              <Text style={{ color: Colors.warning, fontSize: 22 }}>←</Text>
            </TouchableOpacity>
          )}

          {/* KPI Cards */}
          <View style={[styles.kpiGrid, { paddingHorizontal: Spacing.xl }]}>
            <KpiCard
              icon="💰"
              label="إيرادات اليوم"
              value={`${summary?.today?.revenue ?? 0}`}
              unit="ل.س"
              sub={`${summary?.today?.bookings ?? 0} حجز`}
              color={Colors.success}
            />
            <KpiCard
              icon="📅"
              label="إيرادات الشهر"
              value={`${summary?.thisMonth?.revenue ?? 0}`}
              unit="ل.س"
              sub={`${summary?.thisMonth?.bookings ?? 0} حجز`}
              color={Colors.brand.primary}
            />
            <KpiCard
              icon="📈"
              label="إجمالي الإيرادات"
              value={`${summary?.allTime?.revenue ?? 0}`}
              unit="ل.س"
              sub={`${summary?.allTime?.bookings ?? 0} حجز`}
              color={Colors.info}
            />
            <KpiCard
              icon="🏟️"
              label="عدد ملاعبي"
              value={`${summary?.facilityCount ?? facilities.length}`}
              unit=""
              sub="ملعب مسجل"
              color={Colors.warning}
            />
          </View>

          {/* Quick actions */}
          <Text style={[Typography.h3, styles.sectionTitle]}>ماذا تريد أن تفعل؟</Text>
          <View style={[styles.quickActions, { paddingHorizontal: Spacing.xl }]}>
            <QuickAction
              icon="📱"
              label="مسح QR"
              desc="تأكيد حجز"
              onPress={() => router.push('/(tabs)/scanner')}
              color={Colors.success}
            />
            <QuickAction
              icon="🏟️"
              label="ملعب جديد"
              desc="أضف ملعبك"
              onPress={() => router.push('/facility/new')}
              color={Colors.brand.primary}
            />
            <QuickAction
              icon="⚡"
              label="عرض فلاش"
              desc="خصم لوقت"
              onPress={() => router.push('/offers')}
              color={Colors.warning}
            />
            <QuickAction
              icon="📋"
              label="الحجوزات"
              desc="كل الحجوزات"
              onPress={() => router.push('/(tabs)/bookings')}
              color={Colors.info}
            />
          </View>

          {/* My Facilities list */}
          {facilities.length > 0 ? (
            <>
              <Text style={[Typography.h3, styles.sectionTitle]}>ملاعبي</Text>
              {facilities.map((f) => (
                <TouchableOpacity
                  key={f._id}
                  onPress={() => router.push(`/facility/${f._id}`)}
                  style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.md }}
                >
                  <GlassCard style={styles.facilityRow}>
                    <View style={styles.facilityIconBox}>
                      <Text style={{ fontSize: 26 }}>🏟️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.labelLg, { color: Colors.text.primary }]} numberOfLines={1}>
                        {f.name}
                      </Text>
                      <View style={styles.addressRow}>
                        <Ionicons name="location-sharp" size={14} color={Colors.brand.primary} />
                        <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]} numberOfLines={1}>
                          {f.address}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={[styles.statusDot, { backgroundColor: f.isActive ? Colors.success : Colors.error }]} />
                      <Text style={[Typography.labelSm, { color: f.isActive ? Colors.success : Colors.error }]}>
                        {f.isActive ? 'نشط' : 'موقوف'}
                      </Text>
                    </View>
                    <Text style={{ color: Colors.text.tertiary, fontSize: 20, marginLeft: 4 }}>›</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </>
          ) : !summaryLoading ? (
            <GlassCard style={styles.emptyFacility}>
              <Text style={{ fontSize: 48, marginBottom: Spacing.md, textAlign: 'center' }}>🏟️</Text>
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
          ) : null}

          <View style={{ height: 100 }} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

function KpiCard({ icon, label, value, unit, sub, color }: {
  icon: string; label: string; value: string; unit: string; sub: string; color: string;
}) {
  return (
    <GlassCard style={[styles.kpiCard, { borderColor: color + '33' }]}>
      <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Text style={[Typography.numericMd, { color }]}>{value}</Text>
        {unit ? <Text style={[Typography.labelSm, { color: Colors.text.tertiary }]}> {unit}</Text> : null}
      </View>
      <Text style={[Typography.labelSm, { color: Colors.text.secondary, marginTop: 2 }]}>{label}</Text>
      <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{sub}</Text>
    </GlassCard>
  );
}

function QuickAction({ icon, label, desc, onPress, color }: {
  icon: string; label: string; desc: string; onPress: () => void; color: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.quickAction, { backgroundColor: color + '12', borderColor: color + '33' }]}
    >
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={[Typography.labelSm, { color, marginTop: 4 }]}>{label}</Text>
      <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, marginBottom: Spacing.xl,
    backgroundColor: Colors.background.primary,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.border,
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
    borderColor: Colors.glass.border, backgroundColor: Colors.background.primary,
  },
  facilityChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },
  pendingAlert: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.warning + '55',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.warningBg,
  },
  pendingBadge: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.warning + '22',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.warning + '44',
  },
  kpiGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl, marginTop: Spacing.xl },
  kpiCard:   { width: '47%', padding: Spacing.lg, flex: 1, borderWidth: 1 },
  sectionTitle: {
    color: Colors.text.primary, paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md, marginTop: Spacing.sm,
  },
  quickActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  quickAction: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1, gap: 2,
  },
  facilityRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md,
  },
  addressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  facilityIconBox: {
    width: 50, height: 50, borderRadius: Radius.md,
    backgroundColor: Colors.brand.light,
    alignItems: 'center', justifyContent: 'center',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyFacility: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  addFirstBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
});
