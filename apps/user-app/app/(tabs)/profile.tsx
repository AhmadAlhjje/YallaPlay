import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth.store';
import { usersApi } from '../../src/api/users.api';
import { Colors, Spacing, Radius } from '../../src/theme';

const SKILL_LEVELS = [
  { key: 'beginner',     label: 'مبتدئ' },
  { key: 'intermediate', label: 'متوسط' },
  { key: 'pro',          label: 'محترف' },
] as const;

const SPORTS_LIST = [
  { key: 'football',   label: 'كرة القدم' },
  { key: 'basketball', label: 'كرة السلة' },
  { key: 'tennis',     label: 'تنس' },
  { key: 'volleyball', label: 'كرة الطائرة' },
  { key: 'padel',      label: 'بادل' },
  { key: 'squash',     label: 'سكواش' },
  { key: 'badminton',  label: 'ريشة طائرة' },
  { key: 'swimming',   label: 'سباحة' },
] as const;

type SkillKey = typeof SKILL_LEVELS[number]['key'];
type SportKey = typeof SPORTS_LIST[number]['key'];

const PLAN_LABEL: Record<string, string> = {
  free: 'مجاني', primer: 'برايمر', pro: 'برو', custom: 'مخصص',
};

export default function ProfileTab() {
  const { user, updateUser, logout } = useAuthStore();

  const [editMode, setEditMode]         = useState(false);
  const [logoutOpen, setLogoutOpen]     = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [name, setName]                 = useState(user?.name ?? '');
  const [skillLevel, setSkill]          = useState<SkillKey>((user?.skillLevel as SkillKey) ?? 'beginner');
  const [preferredSports, setSports]    = useState<SportKey[]>((user?.preferredSports ?? []) as SportKey[]);

  const initials = (user?.name ?? 'لاعب')
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const updateMutation = useMutation({
    mutationFn: () => usersApi.updateMe({ name, skillLevel, preferredSports }),
    onSuccess: (res) => {
      updateUser(res.data.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditMode(false);
    },
    onError: async (err: any) => {
      const status = err?.response?.status;
      if (status === 404) {
        Alert.alert(
          'جلسة منتهية',
          'انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.',
          [{ text: 'تسجيل الدخول', onPress: async () => { await logout(); router.replace('/(auth)/welcome'); } }],
          { cancelable: false },
        );
      } else if (status === 401) {
        await logout();
        router.replace('/(auth)/welcome');
      } else {
        Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر حفظ التغييرات');
      }
    },
  });

  const openEdit = () => {
    setName(user?.name ?? '');
    setSkill((user?.skillLevel as SkillKey) ?? 'beginner');
    setSports((user?.preferredSports ?? []) as SportKey[]);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setName(user?.name ?? '');
    setSkill((user?.skillLevel as SkillKey) ?? 'beginner');
    setSports((user?.preferredSports ?? []) as SportKey[]);
    setEditMode(false);
  };

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      await logout();
      router.replace('/(auth)/welcome');
    } finally {
      setLogoutLoading(false);
      setLogoutOpen(false);
    }
  };

  const toggleSport = (key: SportKey) =>
    setSports((prev) => prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ── Green header ───────────────────────────────── */}
          <View style={styles.header}>
            <SafeAreaView edges={['top']}>
              {/* Top row */}
              <View style={styles.headerTopRow}>
                <Text style={styles.headerScreenTitle}>الملف الشخصي</Text>
                {!editMode ? (
                  <TouchableOpacity onPress={openEdit} style={styles.headerEditBtn}>
                    <Text style={styles.headerEditText}>تعديل</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={cancelEdit} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>إلغاء</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateMutation.mutate()}
                      style={styles.saveBtn}
                      disabled={updateMutation.isPending}
                    >
                      <Text style={styles.saveBtnText}>
                        {updateMutation.isPending ? 'حفظ...' : 'حفظ'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </View>

              {/* Name */}
              {editMode ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.nameInput}
                  placeholder="اسمك الكامل"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  textAlign="center"
                  maxLength={50}
                />
              ) : (
                <Text style={styles.userName}>{user?.name}</Text>
              )}
              <Text style={styles.userPhone}>{user?.phone}</Text>

              {/* Plan badge */}
              <View style={styles.planBadge}>
                <Text style={styles.planText}>{PLAN_LABEL[user?.plan ?? 'free']}</Text>
              </View>
            </SafeAreaView>
          </View>

          {/* ── White body ─────────────────────────────────── */}
          <View style={styles.body}>

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statItem} onPress={() => router.push('/points')}>
                <Text style={styles.statValue}>{user?.points ?? 0}</Text>
                <Text style={styles.statLabel}>نقطة</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(tabs)/bookings')}>
                <Text style={styles.statValue}>حجوزاتي</Text>
                <Text style={styles.statLabel}>السجل</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem} onPress={() => router.push('/notifications')}>
                <Text style={styles.statValue}>الإشعارات</Text>
                <Text style={styles.statLabel}>المركز</Text>
              </TouchableOpacity>
            </View>

            {/* Skill level */}
            <Section title="مستوى اللعب">
              <View style={styles.chipRow}>
                {SKILL_LEVELS.map((s) => {
                  const active = skillLevel === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => editMode && setSkill(s.key)}
                      activeOpacity={editMode ? 0.7 : 1}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!editMode && (
                <Text style={styles.editHint}>اضغط على "تعديل" لتغيير المستوى</Text>
              )}
            </Section>

            {/* Preferred sports */}
            <Section title="الرياضات المفضلة">
              <View style={styles.sportsWrap}>
                {SPORTS_LIST.map((sp) => {
                  const selected = preferredSports.includes(sp.key);
                  return (
                    <TouchableOpacity
                      key={sp.key}
                      style={[
                        styles.sportTag,
                        selected && styles.sportTagActive,
                        !editMode && !selected && styles.sportTagDim,
                      ]}
                      onPress={() => editMode && toggleSport(sp.key)}
                      activeOpacity={editMode ? 0.7 : 1}
                    >
                      <Text style={[styles.sportTagText, selected && styles.sportTagTextActive]}>
                        {sp.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Section>

            {/* Navigation links */}
            <Section title="الحساب">
              <View style={styles.linkList}>
                <LinkRow label="الحجوزات والسجل" onPress={() => router.push('/(tabs)/bookings')} />
                <Divider />
                <LinkRow label="قائمة الانتظار" onPress={() => router.push('/(tabs)/waitlist')} />
                <Divider />
                <LinkRow label="النقاط والمكافآت" onPress={() => router.push('/points')} />
                <Divider />
                <LinkRow label="الإشعارات" onPress={() => router.push('/notifications')} />
              </View>
            </Section>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={logoutOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutOpen(false)}
      >
        <View style={styles.logoutBackdrop}>
          <View style={styles.logoutCard}>
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out" size={22} color={Colors.error} />
            </View>
            <Text style={styles.logoutTitle}>تسجيل الخروج</Text>
            <Text style={styles.logoutDesc}>هل أنت متأكد من تسجيل الخروج؟</Text>

            <View style={styles.logoutActions}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setLogoutOpen(false)}
                disabled={logoutLoading}
              >
                <Text style={styles.logoutCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                onPress={confirmLogout}
                disabled={logoutLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.logoutConfirmText}>
                  {logoutLoading ? 'جارٍ الخروج...' : 'تسجيل الخروج'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.linkRow} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.linkArrow}>›</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.linkDivider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Header ────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  headerScreenTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerEditText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  editActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cancelBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
  },
  saveBtnText: { color: Colors.brand.primary, fontSize: 13, fontWeight: '700' },

  avatarWrapper: { alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },

  userName:  { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  userPhone: { color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', marginTop: 4 },
  nameInput: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    paddingBottom: 6,
    paddingHorizontal: Spacing.xl,
    marginBottom: 4,
  },
  planBadge: {
    alignSelf: 'center',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  planText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  // ── Body ──────────────────────────────────────────────────
  body: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8FAFC',
    paddingTop: Spacing.xl,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg, gap: 2 },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  statLabel: { fontSize: 11, color: Colors.text.tertiary },
  statDivider: { width: 1, backgroundColor: Colors.border.default, marginVertical: 12 },

  // Section
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    textAlign: 'right',
  },

  // Skill chips
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    height: 42,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary },
  chipTextActive: { color: '#FFFFFF' },
  editHint: { fontSize: 11, color: Colors.text.tertiary, textAlign: 'right', marginTop: 8 },

  // Sports tags
  sportsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: '#FFFFFF',
  },
  sportTagActive: {
    backgroundColor: Colors.brand.light,
    borderColor: Colors.brand.primary,
  },
  sportTagDim: { opacity: 0.4 },
  sportTagText: { fontSize: 13, fontWeight: '500', color: Colors.text.secondary },
  sportTagTextActive: { color: Colors.brand.dark, fontWeight: '700' },

  // Link list
  linkList: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  linkLabel: { fontSize: 15, color: Colors.text.primary, textAlign: 'right' },
  linkArrow: { fontSize: 20, color: Colors.text.tertiary },
  linkDivider: { height: 1, backgroundColor: Colors.border.default, marginHorizontal: Spacing.lg },

  // Logout
  logoutBtn: {
    marginHorizontal: Spacing.xl,
    marginTop: 4,
    height: 50,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  logoutText: { color: Colors.error, fontSize: 15, fontWeight: '700' },

  // Logout modal
  logoutBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,14,26,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoutCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  logoutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoutTitle: { fontSize: 16, fontWeight: '800', color: Colors.text.primary },
  logoutDesc: { fontSize: 13, color: Colors.text.secondary, marginTop: 6, textAlign: 'center' },
  logoutActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.lg,
    width: '100%',
  },
  logoutCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelText: { color: Colors.text.secondary, fontSize: 14, fontWeight: '600' },
  logoutConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutConfirmText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
