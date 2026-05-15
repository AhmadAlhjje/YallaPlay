import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { plansApi } from '../../src/api/plans.api';
import { analyticsApi } from '../../src/api/analytics.api';
import { authApi } from '../../src/api/auth.api';
import { useAuthStore } from '../../src/store/auth.store';
import { GlassCard } from '../../src/components/GlassCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword]             = useState('');
  const [newPassword, setNewPassword]             = useState('');
  const [confirmPassword, setConfirmPassword]     = useState('');
  const [showOld, setShowOld]                     = useState(false);
  const [showNew, setShowNew]                     = useState(false);

  const { data: planStatusRes, isLoading: planLoading } = useQuery({
    queryKey: ['my-plan-status'],
    queryFn: () => plansApi.getMyStatus(),
    staleTime: 300_000,
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
      Alert.alert('تم الترقية! 🎉', 'تمت ترقية خطتك بنجاح.');
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر الترقية'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => authApi.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPasswordModal(false);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      Alert.alert('تم التغيير', 'تم تغيير كلمة المرور بنجاح.');
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر تغيير كلمة المرور'),
  });

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword)
      return Alert.alert('تنبيه', 'يرجى ملء جميع الحقول.');
    if (newPassword.length < 6)
      return Alert.alert('تنبيه', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
    if (newPassword !== confirmPassword)
      return Alert.alert('تنبيه', 'كلمة المرور الجديدة وتأكيدها غير متطابقتين.');
    changePasswordMutation.mutate();
  };

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تسجيل الخروج',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleSupport = () => {
    const number = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP ?? '963998107722';
    Linking.openURL(`https://wa.me/${number}`).catch(() =>
      Alert.alert('تنبيه', 'تعذّر فتح واتساب')
    );
  };

  const planStatus  = planStatusRes?.data?.data;
  const summary     = summaryRes?.data?.data;
  const currentPlan = owner?.plan ?? 'free';
  const planColor   = PLAN_COLORS[currentPlan] ?? Colors.text.tertiary;
  const initials    = (owner?.name ?? 'مالك').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header Banner ─────────────────────────────────────────── */}
        <View style={styles.banner}>
          <SafeAreaView>
            <View style={styles.bannerContent}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>{owner?.name ?? 'مالك'}</Text>
                <Text style={styles.ownerPhone}>{owner?.phone}</Text>
                <View style={[styles.planBadge, { borderColor: planColor + '55', backgroundColor: planColor + '22' }]}>
                  <Text style={{ fontSize: 13 }}>{PLAN_ICONS[currentPlan]}</Text>
                  <Text style={[styles.planBadgeText, { color: planColor }]}>
                    خطة {PLAN_NAMES[currentPlan] ?? currentPlan}
                  </Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          {/* ── Stats Row ────────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <StatBox
              icon="calendar-outline"
              label="إجمالي الحجوزات"
              value={`${summary?.allTime?.bookings ?? 0}`}
            />
            <View style={styles.statDivider} />
            <StatBox
              icon="storefront-outline"
              label="عدد الملاعب"
              value={`${summary?.facilityCount ?? 0}`}
            />
            <View style={styles.statDivider} />
            <StatBox
              icon="calendar-number-outline"
              label="حجوزات الشهر"
              value={`${summary?.thisMonth?.bookings ?? 0}`}
            />
          </View>

          {/* ── Current Plan ──────────────────────────────────────────── */}
          {planLoading ? (
            <ActivityIndicator color={Colors.brand.primary} style={{ marginVertical: Spacing.xl }} />
          ) : planStatus ? (
            <>
              <SectionLabel title="خطتك الحالية" />
              <GlassCard style={[styles.planCard, { borderColor: planColor + '44' }]}>
                <View style={styles.planHeader}>
                  <Text style={{ fontSize: 28 }}>{PLAN_ICONS[currentPlan]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.labelLg, { color: planColor }]}>
                      خطة {PLAN_NAMES[currentPlan] ?? currentPlan}
                    </Text>
                    {planStatus?.planExpiresAt && (
                      <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginTop: 2 }]}>
                        تنتهي: {new Date(planStatus.planExpiresAt).toLocaleDateString('ar-SA')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.featuresGrid}>
                  <FeatureChip label={`${planStatus.features?.maxFacilities ?? 1} ملاعب`} ok />
                  <FeatureChip label="عروض فلاش" ok={planStatus.features?.canAddOffers} />
                  <FeatureChip label="تحليلات" ok={planStatus.features?.hasAnalytics} />
                  <FeatureChip label="إشعارات فورية" ok={planStatus.features?.hasPushNotifications} />
                </View>
              </GlassCard>
            </>
          ) : null}

          {/* ── Settings ─────────────────────────────────────────────── */}
          <SectionLabel title="الإعدادات" />
          <GlassCard style={styles.settingsCard}>
            <SettingRow
              icon="lock-closed-outline"
              label="تغيير كلمة المرور"
              onPress={() => setShowPasswordModal(true)}
            />
            <View style={styles.settingDivider} />
            <SettingRow
              icon="logo-whatsapp"
              label="تواصل مع الدعم"
              onPress={handleSupport}
            />
            <View style={styles.settingDivider} />
            <SettingRow
              icon="log-out-outline"
              label="تسجيل الخروج"
              onPress={handleLogout}
              danger
            />
          </GlassCard>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Change Password Modal ─────────────────────────────────── */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowPasswordModal(false)} />
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Ionicons name="lock-closed-outline" size={22} color={Colors.brand.primary} />
                <Text style={[Typography.h3, { color: Colors.text.primary }]}>تغيير كلمة المرور</Text>
              </View>

              <PasswordField
                label="كلمة المرور الحالية"
                value={oldPassword}
                onChangeText={setOldPassword}
                show={showOld}
                onToggleShow={() => setShowOld(!showOld)}
                placeholder="أدخل كلمة المرور الحالية"
              />
              <PasswordField
                label="كلمة المرور الجديدة"
                value={newPassword}
                onChangeText={setNewPassword}
                show={showNew}
                onToggleShow={() => setShowNew(!showNew)}
                placeholder="6 أحرف على الأقل"
              />
              <PasswordField
                label="تأكيد كلمة المرور الجديدة"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                show={showNew}
                onToggleShow={() => setShowNew(!showNew)}
                placeholder="أعد إدخال كلمة المرور الجديدة"
              />

              <View style={{ marginTop: Spacing.xl }}>
                <PrimaryButton
                  label="تغيير كلمة المرور"
                  onPress={handleChangePassword}
                  loading={changePasswordMutation.isPending}
                />
              </View>
              <TouchableOpacity
                onPress={() => { setShowPasswordModal(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                style={{ alignItems: 'center', marginTop: Spacing.lg, paddingVertical: Spacing.sm }}
              >
                <Text style={[Typography.labelMd, { color: Colors.text.tertiary }]}>إلغاء</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <Text style={styles.sectionLabel}>{title}</Text>
  );
}

function StatBox({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={20} color={Colors.brand.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeatureChip({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <View style={[styles.featureChip, { backgroundColor: ok ? Colors.successBg : Colors.background.secondary, borderColor: ok ? Colors.success + '44' : Colors.glass.border }]}>
      <Text style={{ fontSize: 11, color: ok ? Colors.success : Colors.text.tertiary }}>{ok ? '✓' : '✕'}</Text>
      <Text style={[Typography.labelSm, { color: ok ? Colors.success : Colors.text.tertiary }]}>{label}</Text>
    </View>
  );
}

function SettingRow({ icon, label, onPress, danger }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.settingRow}>
      <View style={[styles.settingIconWrap, { backgroundColor: danger ? Colors.errorBg : Colors.brand.light }]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.error : Colors.brand.primary} />
      </View>
      <Text style={[Typography.bodyMd, { color: danger ? Colors.error : Colors.text.primary, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );
}

function PasswordField({ label, value, onChangeText, show, onToggleShow, placeholder }: {
  label: string; value: string; onChangeText: (t: string) => void;
  show: boolean; onToggleShow: () => void; placeholder: string;
}) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.passwordWrap}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          secureTextEntry={!show}
          textAlign="right"
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggleShow} style={{ padding: 4 }}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },

  banner: { backgroundColor: Colors.brand.primary, paddingBottom: Spacing.xl },
  bannerContent: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  ownerName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  ownerPhone: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', marginTop: Spacing.sm,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  planBadgeText: { fontSize: 12, fontWeight: '700' },

  body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.glass.border,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: Spacing.sm },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text.primary, fontVariant: ['tabular-nums'] as any },
  statLabel: { fontSize: 11, color: Colors.text.tertiary, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.glass.border, marginVertical: Spacing.sm },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: Colors.text.tertiary,
    marginBottom: Spacing.sm, marginTop: 4,
  },

  planCard: { padding: Spacing.xl, marginBottom: Spacing.xl, borderWidth: 1.5 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },

  settingsCard: { overflow: 'hidden', backgroundColor: Colors.background.primary, marginBottom: Spacing.xl },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md + 2,
  },
  settingIconWrap: {
    width: 36, height: 36, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  settingDivider: { height: 1, backgroundColor: Colors.glass.border, marginHorizontal: Spacing.lg },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, paddingBottom: 0,
    borderTopWidth: 1, borderTopColor: Colors.glass.border,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.glass.strong,
    alignSelf: 'center', marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary, marginBottom: 6, textAlign: 'right' },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.glass.border,
    paddingHorizontal: Spacing.lg,
  },
  passwordInput: {
    flex: 1, fontSize: 15, color: Colors.text.primary,
    paddingVertical: 13,
  },
});
