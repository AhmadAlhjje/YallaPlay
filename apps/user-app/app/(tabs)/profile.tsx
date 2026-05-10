import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth.store';
import { usersApi } from '../../src/api/users.api';
import { GlassCard } from '../../src/components/GlassCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const SKILL_LEVELS = [
  { key: 'beginner',     label: 'مبتدئ',  icon: '🌱' },
  { key: 'intermediate', label: 'متوسط',   icon: '⚡' },
  { key: 'advanced',     label: 'متقدم',   icon: '🏆' },
  { key: 'professional', label: 'محترف',   icon: '⭐' },
] as const;

const SPORTS_LIST = [
  { key: 'football',   label: 'كرة القدم',   emoji: '⚽' },
  { key: 'basketball', label: 'كرة السلة',   emoji: '🏀' },
  { key: 'tennis',     label: 'تنس',          emoji: '🎾' },
  { key: 'volleyball', label: 'كرة الطائرة', emoji: '🏐' },
  { key: 'padel',      label: 'بادل',         emoji: '🏓' },
  { key: 'squash',     label: 'إسكواش',       emoji: '🎱' },
] as const;

type SkillKey = typeof SKILL_LEVELS[number]['key'];
type SportKey = typeof SPORTS_LIST[number]['key'];

export default function ProfileTab() {
  const { user, updateUser, logout } = useAuthStore();
  const qc = useQueryClient();

  const [editMode, setEditMode]               = useState(false);
  const [name, setName]                       = useState(user?.name ?? '');
  const [skillLevel, setSkillLevel]           = useState<SkillKey | undefined>(user?.skillLevel as SkillKey);
  const [preferredSports, setPreferredSports] = useState<SportKey[]>((user?.preferredSports ?? []) as SportKey[]);

  const updateMutation = useMutation({
    mutationFn: () => usersApi.updateMe({ name, skillLevel, preferredSports }),
    onSuccess: (res) => {
      updateUser(res.data.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditMode(false);
    },
    onError: () => Alert.alert('خطأ', 'تعذّر حفظ التغييرات'),
  });

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  const toggleSport = (sport: SportKey) => {
    setPreferredSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  };

  const initials = (user?.name ?? 'لاعب').split(' ').map((w) => w[0]).join('').slice(0, 2);
  const planLabel: Record<string, string> = { free: 'مجاني', primer: 'برايمر', pro: 'برو' };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SafeAreaView>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={[Typography.h1, { color: '#fff' }]}>{initials}</Text>
            </View>

            {!editMode ? (
              <>
                <Text style={[Typography.h2, { color: Colors.text.primary, marginTop: Spacing.md }]}>
                  {user?.name}
                </Text>
                <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>{user?.phone}</Text>
                <View style={styles.planBadge}>
                  <Text style={[Typography.labelSm, { color: Colors.brand.primary }]}>
                    ✨ {planLabel[user?.plan ?? 'free'] ?? user?.plan}
                  </Text>
                </View>
              </>
            ) : (
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.nameInput}
                placeholder="اسمك"
                placeholderTextColor={Colors.text.tertiary}
                textAlign="center"
              />
            )}

            <TouchableOpacity
              onPress={() => { if (!editMode) { setName(user?.name ?? ''); setEditMode(true); } else updateMutation.mutate(); }}
              style={styles.editBtn}
            >
              {updateMutation.isPending
                ? <Text style={[Typography.labelMd, { color: Colors.text.tertiary }]}>جاري الحفظ...</Text>
                : <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>
                    {editMode ? 'حفظ' : 'تعديل الملف'}
                  </Text>
              }
            </TouchableOpacity>
            {editMode && (
              <TouchableOpacity onPress={() => setEditMode(false)} style={[styles.editBtn, { marginTop: 4 }]}>
                <Text style={[Typography.labelMd, { color: Colors.text.tertiary }]}>إلغاء</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.body}>
            {/* Quick Stats */}
            <GlassCard style={styles.statsRow}>
              <StatChip icon="⭐" value={String(user?.points ?? 0)} label="نقاط" onPress={() => router.push('/points')} />
              <View style={styles.statDivider} />
              <StatChip icon="📋" value="حجوزاتي" label="السجل" onPress={() => router.push('/(tabs)/bookings')} />
              <View style={styles.statDivider} />
              <StatChip icon="🔔" value="الإشعارات" label="البريد" onPress={() => router.push('/notifications')} />
            </GlassCard>

            {/* Skill Level */}
            <Text style={[Typography.h3, styles.sectionTitle]}>مستوى اللعب</Text>
            <View style={styles.skillGrid}>
              {SKILL_LEVELS.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => editMode && setSkillLevel(s.key)}
                  style={[
                    styles.skillChip,
                    skillLevel === s.key && styles.skillChipActive,
                    !editMode && { opacity: skillLevel === s.key ? 1 : 0.5 },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                  <Text style={[Typography.labelMd, { color: skillLevel === s.key ? Colors.brand.primary : Colors.text.secondary }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preferred Sports */}
            <Text style={[Typography.h3, styles.sectionTitle]}>الرياضات المفضلة</Text>
            <View style={styles.sportsGrid}>
              {SPORTS_LIST.map((s) => {
                const selected = preferredSports.includes(s.key);
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => editMode && toggleSport(s.key)}
                    style={[
                      styles.sportChip,
                      selected && styles.sportChipActive,
                      !editMode && !selected && { opacity: 0.4 },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
                    <Text style={[Typography.labelSm, { color: selected ? Colors.brand.primary : Colors.text.secondary }]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Settings section */}
            <Text style={[Typography.h3, styles.sectionTitle]}>الإعدادات</Text>
            <GlassCard style={styles.settingsCard}>
              <SettingRow icon="📍" label="تحديث الموقع" onPress={() => {}} />
              <View style={styles.settingDivider} />
              <SettingRow icon="🔔" label="إعدادات الإشعارات" onPress={() => {}} />
              <View style={styles.settingDivider} />
              <SettingRow icon="🔒" label="الخصوصية والأمان" onPress={() => {}} />
              <View style={styles.settingDivider} />
              <SettingRow
                icon="🚪"
                label="تسجيل الخروج"
                onPress={handleLogout}
                labelColor={Colors.error}
              />
            </GlassCard>

            <View style={{ height: 100 }} />
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

function StatChip({ icon, value, label, onPress }: { icon: string; value: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.statChip}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={[Typography.numericMd, { color: Colors.text.primary }]}>{value}</Text>
      <Text style={[Typography.labelSm, { color: Colors.text.tertiary }]}>{label}</Text>
    </TouchableOpacity>
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
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.brand.light,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.brand.border,
  },
  planBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary + '22',
    borderWidth: 1, borderColor: Colors.brand.border,
  },
  editBtn: { marginTop: Spacing.md },
  nameInput: {
    marginTop: Spacing.md,
    fontSize: 24, fontWeight: '700',
    color: Colors.text.primary,
    borderBottomWidth: 1.5, borderBottomColor: Colors.brand.primary,
    paddingBottom: 6, paddingHorizontal: Spacing.xl,
    textAlign: 'center',
  },
  body: { paddingHorizontal: Spacing.xl },
  statsRow: { flexDirection: 'row', padding: Spacing.md, marginBottom: Spacing.xl, marginTop: Spacing.xl },
  statChip: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: Spacing.sm },
  statDivider: { width: 1, backgroundColor: Colors.border.default },
  sectionTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.md, marginTop: Spacing.sm,
  },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.xl },
  skillChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.border.default, backgroundColor: Colors.background.secondary,
    minWidth: '45%',
  },
  skillChipActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.light,
  },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.xl },
  sportChip: {
    flexDirection: 'column', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.border.default, backgroundColor: Colors.background.secondary,
    minWidth: '30%', flex: 1,
  },
  sportChipActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.light,
  },
  settingsCard: { padding: 0, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md + 2,
  },
  settingDivider: { height: 1, backgroundColor: Colors.border.default, marginHorizontal: Spacing.lg },
});
