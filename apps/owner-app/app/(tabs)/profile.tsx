import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { plansApi } from '../../src/api/plans.api';
import { analyticsApi } from '../../src/api/analytics.api';
import { useAuthStore } from '../../src/store/auth.store';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const PLAN_ICONS: Record<string, string>  = { free: '🌱', primer: '⚡', pro: '🏆' };
const PLAN_NAMES: Record<string, string>  = { free: 'مجانية', primer: 'برايمر', pro: 'برو' };
const PLAN_COLORS: Record<string, string> = {
  free:   Colors.text.tertiary,
  primer: Colors.brand.primary,
  pro:    Colors.warning,
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
      Alert.alert('تم الترقية! 🎉', 'تمت ترقية خطتك بنجاح. استمتع بالمميزات الجديدة.');
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر الترقية'),
  });

  const planStatus  = planStatusRes?.data?.data;
  const publicPlans: any[] = publicPlansRes?.data?.data ?? [];
  const summary     = summaryRes?.data?.data;
  const currentPlan = owner?.plan ?? 'free';
  const planColor   = PLAN_COLORS[currentPlan] ?? Colors.text.tertiary;
  const initials    = (owner?.name ?? 'مالك').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تسجيل الخروج',
        style: 'destructive',
        onPress: async () => { await logout(); router.replace('/(auth)/welcome'); },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SafeAreaView>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{initials}</Text>
            </View>
            <Text style={[Typography.h2, { color: Colors.text.primary, marginTop: Spacing.md }]}>
              {owner?.name}
            </Text>
            <Text style={[Typography.bodyMd, { color: Colors.text.tertiary }]}>{owner?.phone}</Text>
            <View style={[styles.planBadge, { borderColor: planColor + '55', backgroundColor: planColor + '15' }]}>
              <Text style={{ fontSize: 16 }}>{PLAN_ICONS[currentPlan]}</Text>
              <Text style={[Typography.labelMd, { color: planColor }]}>
                خطة {PLAN_NAMES[currentPlan] ?? currentPlan}
              </Text>
            </View>
            {planStatus?.planExpiresAt && (
              <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginTop: 4 }]}>
                تنتهي: {new Date(planStatus.planExpiresAt).toLocaleDateString('ar-SA')}
              </Text>
            )}
          </View>

          <View style={styles.body}>
            {/* Stats */}
            <View style={styles.statsRow}>
              <StatBox icon="💰" label="إجمالي الإيرادات" value={`${summary?.allTime?.revenue ?? 0}`} unit="ل.س" />
              <View style={styles.statDivider} />
              <StatBox icon="📋" label="إجمالي الحجوزات" value={`${summary?.allTime?.bookings ?? 0}`} unit="" />
              <View style={styles.statDivider} />
              <StatBox icon="🏟️" label="عدد الملاعب" value={`${summary?.facilityCount ?? 0}`} unit="" />
            </View>

            {/* Current plan features */}
            {planLoading ? (
              <ActivityIndicator color={Colors.brand.primary} style={{ marginVertical: Spacing.xl }} />
            ) : planStatus ? (
              <>
                <SectionTitle title="خطتك الحالية" />
                <GlassCard style={[styles.planCard, { borderColor: planColor + '44', borderWidth: 2 }]}>
                  <View style={styles.planHeader}>
                    <Text style={{ fontSize: 32 }}>{PLAN_ICONS[currentPlan]}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.h3, { color: planColor }]}>
                        خطة {PLAN_NAMES[currentPlan] ?? currentPlan}
                      </Text>
                    </View>
                  </View>
                  <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                    <FeatureRow label={`حتى ${planStatus.features?.maxFacilities ?? 1} ملاعب`} ok />
                    <FeatureRow label="إضافة عروض فلاش" ok={planStatus.features?.canAddOffers} />
                    <FeatureRow label="تحليلات متقدمة" ok={planStatus.features?.hasAnalytics} />
                    <FeatureRow label="إشعارات فورية للاعبين" ok={planStatus.features?.hasPushNotifications} />
                  </View>
                </GlassCard>
              </>
            ) : null}

            {/* Upgrade plans */}
            {publicPlans.filter((p) => p.tier !== currentPlan).length > 0 && (
              <>
                <SectionTitle title="ترقية الخطة" />
                <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, marginBottom: Spacing.md }]}>
                  رقّي خطتك للحصول على مزيد من الملاعب والمميزات
                </Text>
                {publicPlans
                  .filter((p) => p.tier !== currentPlan)
                  .map((plan) => {
                    const tiers: Record<string, number> = { free: 0, primer: 1, pro: 2 };
                    const isUpgrade = (tiers[plan.tier] ?? 0) > (tiers[currentPlan] ?? 0);
                    const color = PLAN_COLORS[plan.tier] ?? Colors.text.secondary;
                    return (
                      <GlassCard key={plan._id} style={[styles.upgradePlanCard, { borderColor: color + '44' }]}>
                        <View style={styles.planHeader}>
                          <Text style={{ fontSize: 28 }}>{PLAN_ICONS[plan.tier]}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[Typography.labelLg, { color }]}>{plan.name}</Text>
                            <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>
                              {plan.price === 0 ? 'مجاني' : `${plan.price} ل.س / شهر`}
                            </Text>
                          </View>
                          {isUpgrade && (
                            <TouchableOpacity
                              onPress={() => upgradeMutation.mutate(plan._id)}
                              disabled={upgradeMutation.isPending}
                              style={[styles.upgradeBtn, { backgroundColor: color, borderColor: color }]}
                            >
                              <Text style={[Typography.labelMd, { color: '#fff' }]}>
                                {upgradeMutation.isPending ? '...' : 'ترقية'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </GlassCard>
                    );
                  })}
              </>
            )}

            {/* Settings */}
            <SectionTitle title="الإعدادات" />
            <GlassCard style={styles.settingsCard}>
              <SettingRow icon="🔔" label="الإشعارات" onPress={() => {}} />
              <View style={styles.settingDivider} />
              <SettingRow icon="🔒" label="الأمان" onPress={() => {}} />
              <View style={styles.settingDivider} />
              <SettingRow icon="📞" label="تواصل مع الدعم" onPress={() => {}} />
              <View style={styles.settingDivider} />
              <SettingRow icon="🚪" label="تسجيل الخروج" onPress={handleLogout} danger />
            </GlassCard>

            <View style={{ height: 100 }} />
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={[Typography.h3, { color: Colors.text.primary, marginBottom: Spacing.md, marginTop: Spacing.sm }]}>{title}</Text>;
}

function StatBox({ icon, label, value, unit }: { icon: string; label: string; value: string; unit: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: Spacing.sm }}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={[Typography.numericMd, { color: Colors.text.primary }]}>
        {value}{unit ? <Text style={[Typography.labelSm, { color: Colors.text.tertiary }]}> {unit}</Text> : null}
      </Text>
      <Text style={[Typography.labelSm, { color: Colors.text.tertiary, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
}

function FeatureRow({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      <View style={[styles.featureIcon, { backgroundColor: ok ? Colors.successBg : Colors.glass.subtle }]}>
        <Text style={{ fontSize: 12, color: ok ? Colors.success : Colors.text.tertiary }}>{ok ? '✓' : '✕'}</Text>
      </View>
      <Text style={[Typography.bodyMd, { color: ok ? Colors.text.primary : Colors.text.tertiary }]}>{label}</Text>
    </View>
  );
}

function SettingRow({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.settingRow}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[Typography.bodyMd, { color: danger ? Colors.error : Colors.text.primary, flex: 1 }]}>{label}</Text>
      <Text style={{ color: Colors.text.tertiary, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },

  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl + 8,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.brand.primary,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.md, paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },

  body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.glass.border,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statDivider: { width: 1, backgroundColor: Colors.glass.border },

  planCard:   { padding: Spacing.xl, marginBottom: Spacing.md },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },

  upgradePlanCard: { padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1.5 },
  upgradeBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1.5,
  },

  settingsCard:   { overflow: 'hidden', backgroundColor: Colors.background.primary },
  settingRow:     {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md + 4,
  },
  settingDivider: { height: 1, backgroundColor: Colors.glass.border, marginHorizontal: Spacing.lg },
});
