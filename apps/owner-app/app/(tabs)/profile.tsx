import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { plansApi } from '../../src/api/plans.api';
import { analyticsApi } from '../../src/api/analytics.api';
import { useAuthStore } from '../../src/store/auth.store';
import { GlassCard } from '../../src/components/GlassCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const PLAN_COLORS: Record<string, string> = {
  free:   Colors.text.tertiary,
  primer: Colors.brand.primary,
  pro:    Colors.warning,
};

const PLAN_ICONS: Record<string, string> = {
  free: '🌱', primer: '⚡', pro: '🏆',
};

export default function OwnerProfileTab() {
  const { owner, logout } = useAuthStore();
  const qc = useQueryClient();

  const { data: planStatusRes, isLoading: planLoading } = useQuery({
    queryKey: ['my-plan-status'],
    queryFn: () => plansApi.getMyStatus(),
    staleTime: 300_000,
  });

  const { data: publicPlansRes } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => plansApi.getPublic(),
    staleTime: 600_000,
  });

  const { data: summaryRes } = useQuery({
    queryKey: ['owner-summary'],
    queryFn: () => analyticsApi.getSummary(),
    staleTime: 120_000,
  });

  const upgradeMutation = useMutation({
    mutationFn: (planId: string) => plansApi.upgrade(planId),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['my-plan-status'] });
      Alert.alert('تم الترقية!', 'تمت ترقية خطتك بنجاح');
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر الترقية'),
  });

  const planStatus = planStatusRes?.data?.data;
  const publicPlans: any[] = publicPlansRes?.data?.data ?? [];
  const summary = summaryRes?.data?.data;

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  const currentPlan = owner?.plan ?? 'free';
  const planColor = PLAN_COLORS[currentPlan] ?? Colors.text.tertiary;
  const initials = (owner?.name ?? 'مالك').split(' ').map((w) => w[0]).join('').slice(0, 2);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SafeAreaView>
          {/* Hero */}
          <LinearGradient colors={[Colors.brand.primary + '33', 'transparent']} style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={[Typography.h1, { color: '#fff' }]}>{initials}</Text>
            </View>
            <Text style={[Typography.h2, { color: Colors.text.primary, marginTop: Spacing.md }]}>{owner?.name}</Text>
            <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>{owner?.phone}</Text>
            <View style={[styles.planBadge, { borderColor: planColor + '55', backgroundColor: planColor + '22' }]}>
              <Text style={{ fontSize: 16 }}>{PLAN_ICONS[currentPlan]}</Text>
              <Text style={[Typography.labelMd, { color: planColor }]}>
                خطة {currentPlan === 'free' ? 'مجانية' : currentPlan === 'primer' ? 'برايمر' : 'برو'}
              </Text>
            </View>
            {planStatus?.planExpiresAt && (
              <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginTop: 4 }]}>
                تنتهي: {new Date(planStatus.planExpiresAt).toLocaleDateString('ar-SA')}
              </Text>
            )}
          </LinearGradient>

          <View style={styles.body}>
            {/* All-time stats */}
            <GlassCard style={styles.statsRow}>
              <StatChip icon="💰" label="إجمالي الإيرادات" value={summary ? `${summary.allTime?.revenue ?? 0}` : '—'} unit="ر.س" />
              <View style={styles.statDivider} />
              <StatChip icon="📋" label="إجمالي الحجوزات" value={String(summary?.allTime?.bookings ?? '—')} unit="" />
              <View style={styles.statDivider} />
              <StatChip icon="❌" label="نسبة الإلغاء" value={summary ? `${(summary.cancellationRate ?? 0).toFixed(0)}%` : '—'} unit="" />
            </GlassCard>

            {/* Current plan features */}
            {planStatus && (
              <>
                <Text style={[Typography.h3, styles.sectionTitle]}>خطتك الحالية</Text>
                <GlassCard style={[styles.currentPlanCard, { borderColor: planColor + '44' }]}>
                  <View style={styles.planHeader}>
                    <Text style={{ fontSize: 28 }}>{PLAN_ICONS[currentPlan]}</Text>
                    <View>
                      <Text style={[Typography.h3, { color: planColor }]}>
                        {currentPlan === 'free' ? 'مجانية' : currentPlan === 'primer' ? 'برايمر' : 'برو'}
                      </Text>
                    </View>
                  </View>
                  {planStatus.features && (
                    <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                      <FeatureRow label={`${planStatus.features.maxFacilities} ملاعب كحد أقصى`} ok />
                      <FeatureRow label="إضافة عروض فلاش" ok={planStatus.features.canAddOffers} />
                      <FeatureRow label="تحليلات متقدمة" ok={planStatus.features.hasAnalytics} />
                      <FeatureRow label="إشعارات فورية" ok={planStatus.features.hasPushNotifications} />
                    </View>
                  )}
                </GlassCard>
              </>
            )}

            {/* Upgrade plans */}
            {publicPlans.filter((p) => p.tier !== currentPlan).length > 0 && (
              <>
                <Text style={[Typography.h3, styles.sectionTitle]}>ترقية الخطة</Text>
                {publicPlans
                  .filter((p) => p.tier !== currentPlan)
                  .map((plan) => (
                    <PlanCard
                      key={plan._id}
                      plan={plan}
                      currentPlan={currentPlan}
                      onUpgrade={() => upgradeMutation.mutate(plan._id)}
                      upgrading={upgradeMutation.isPending}
                    />
                  ))}
              </>
            )}

            {/* Settings */}
            <Text style={[Typography.h3, styles.sectionTitle]}>الإعدادات</Text>
            <GlassCard style={styles.settingsCard}>
              <SettingRow icon="🔔" label="إعدادات الإشعارات" onPress={() => {}} />
              <View style={styles.settingDivider} />
              <SettingRow icon="🔒" label="الأمان والخصوصية" onPress={() => {}} />
              <View style={styles.settingDivider} />
              <SettingRow icon="📞" label="تواصل مع الدعم" onPress={() => {}} />
              <View style={styles.settingDivider} />
              <SettingRow icon="🚪" label="تسجيل الخروج" onPress={handleLogout} labelColor={Colors.error} />
            </GlassCard>

            <View style={{ height: 100 }} />
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

function StatChip({ icon, label, value, unit }: { icon: string; label: string; value: string; unit: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: Spacing.sm }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[Typography.numericSm, { color: Colors.text.primary }]}>{value} {unit}</Text>
      <Text style={[Typography.labelSm, { color: Colors.text.tertiary, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
}

function FeatureRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      <Text style={{ color: ok ? Colors.success : Colors.text.tertiary, fontSize: 14 }}>{ok ? '✓' : '✕'}</Text>
      <Text style={[Typography.bodyMd, { color: ok ? Colors.text.primary : Colors.text.tertiary }]}>{label}</Text>
    </View>
  );
}

function PlanCard({ plan, currentPlan, onUpgrade, upgrading }: { plan: any; currentPlan: string; onUpgrade: () => void; upgrading: boolean }) {
  const tiers: Record<string, number> = { free: 0, primer: 1, pro: 2 };
  const isUpgrade = (tiers[plan.tier] ?? 0) > (tiers[currentPlan] ?? 0);
  const color = PLAN_COLORS[plan.tier] ?? Colors.text.secondary;

  return (
    <GlassCard style={[styles.planCard, { borderColor: color + '44' }]}>
      <View style={styles.planHeader}>
        <Text style={{ fontSize: 24 }}>{PLAN_ICONS[plan.tier]}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.labelLg, { color }]}>{plan.name}</Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>
            {plan.price === 0 ? 'مجاني' : `${plan.price} ر.س / شهر`}
          </Text>
        </View>
        {isUpgrade && (
          <TouchableOpacity
            onPress={onUpgrade}
            disabled={upgrading}
            style={[styles.upgradeBtn, { backgroundColor: color + '22', borderColor: color + '55' }]}
          >
            <Text style={[Typography.labelMd, { color }]}>{upgrading ? '...' : 'ترقية'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

function SettingRow({ icon, label, onPress, labelColor }: { icon: string; label: string; onPress: () => void; labelColor?: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.settingRow}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[Typography.bodyMd, { color: labelColor ?? Colors.text.primary, flex: 1 }]}>{label}</Text>
      <Text style={{ color: Colors.text.tertiary, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  hero: { alignItems: 'center', paddingVertical: Spacing.xl, paddingHorizontal: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.brand.primary + '55',
  },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.sm, paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  body: { paddingHorizontal: Spacing.xl },
  statsRow: { flexDirection: 'row', padding: Spacing.md, marginBottom: Spacing.xl },
  statDivider: { width: 1, backgroundColor: Colors.glass.border },
  sectionTitle: {
    color: Colors.text.primary, marginBottom: Spacing.md, marginTop: Spacing.sm,
  },
  currentPlanCard: { padding: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1.5 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  planCard: { padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1.5 },
  upgradeBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1.5,
  },
  settingsCard: { padding: 0, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md + 2,
  },
  settingDivider: { height: 1, backgroundColor: Colors.glass.subtle, marginHorizontal: Spacing.lg },
});
