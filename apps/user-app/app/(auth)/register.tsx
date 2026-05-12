import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Spacing, Radius } from '../../src/theme';

const SKILL_LEVELS = [
  { key: 'beginner',     label: 'مبتدئ' },
  { key: 'intermediate', label: 'متوسط' },
  { key: 'pro',          label: 'محترف' },
] as const;

const SPORTS = [
  { key: 'football',   label: 'كرة القدم',  icon: '⚽' },
  { key: 'basketball', label: 'كرة السلة',  icon: '🏀' },
  { key: 'tennis',     label: 'تنس',        icon: '🎾' },
  { key: 'volleyball', label: 'كرة الطائرة',icon: '🏐' },
  { key: 'padel',      label: 'بادل',       icon: '🏓' },
  { key: 'squash',     label: 'سكواش',      icon: '🎯' },
  { key: 'badminton',  label: 'ريشة طائرة', icon: '🏸' },
  { key: 'swimming',   label: 'سباحة',      icon: '🏊' },
] as const;

export default function RegisterScreen() {
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(auth)/welcome');
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('+963');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [skillLevel, setSkill]    = useState<string>('beginner');
  const [sports, setSports]       = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const { register } = useAuthStore();

  const isPhoneValid = /^\+963\d{9}$/.test(phone);
  const canSubmit    = name.trim().length >= 2 && isPhoneValid && password.length >= 6;

  const toggleSport = (key: string) => {
    setSports((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleRegister = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { requiresOtp } = await register(name.trim(), phone, password, skillLevel, sports);
      if (requiresOtp) {
        router.replace({ pathname: '/(auth)/otp', params: { phone } });
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        Alert.alert(
          'الرقم مسجل مسبقاً',
          'هذا الرقم لديه حساب بالفعل. هل تريد تسجيل الدخول؟',
          [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'تسجيل الدخول', onPress: () => router.replace('/(auth)/login') },
          ],
        );
      } else {
        Alert.alert('خطأ في إنشاء الحساب', err?.response?.data?.message ?? 'حدث خطأ، يرجى المحاولة مجدداً');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Green header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>→ رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إنشاء حساب</Text>
          <Text style={styles.headerSub}>انضم إلى مجتمع يلا بلاي</Text>
        </SafeAreaView>
      </View>

      {/* White body */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.body}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>الاسم الكامل</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="أدخل اسمك الكامل"
              placeholderTextColor={Colors.text.tertiary}
              selectionColor={Colors.brand.primary}
              textAlign="right"
              autoFocus
              maxLength={50}
            />
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>رقم الهاتف</Text>
            <TextInput
              style={[styles.input, isPhoneValid && styles.inputValid]}
              value={phone}
              onChangeText={(t) => { if (t.startsWith('+963')) setPhone(t); }}
              keyboardType="phone-pad"
              maxLength={13}
              placeholder="+963xxxxxxxxx"
              placeholderTextColor={Colors.text.tertiary}
              selectionColor={Colors.brand.primary}
              textAlign="left"
            />
            <Text style={styles.hint}>مثال: +963912345678</Text>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                placeholder="6 أحرف على الأقل"
                placeholderTextColor={Colors.text.tertiary}
                selectionColor={Colors.brand.primary}
                textAlign="right"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Skill level */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>المستوى الرياضي</Text>
            <View style={styles.chipRow}>
              {SKILL_LEVELS.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.chip, skillLevel === s.key && styles.chipActive]}
                  onPress={() => setSkill(s.key)}
                >
                  <Text style={[styles.chipText, skillLevel === s.key && styles.chipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preferred sports */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>الرياضات المفضلة (اختياري)</Text>
            <View style={styles.sportsGrid}>
              {SPORTS.map((sp) => {
                const selected = sports.includes(sp.key);
                return (
                  <TouchableOpacity
                    key={sp.key}
                    style={[styles.sportCard, selected && styles.sportCardActive]}
                    onPress={() => toggleSport(sp.key)}
                  >
                    <Text style={styles.sportIcon}>{sp.icon}</Text>
                    <Text style={[styles.sportLabel, selected && styles.sportLabelActive]}>
                      {sp.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={!canSubmit || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </Text>
          </TouchableOpacity>

          {/* Login link */}
          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.switchText}>
              لديك حساب بالفعل؟{' '}
              <Text style={styles.switchLink}>تسجيل الدخول</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.primary },

  header: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl + 24,
  },
  backBtn: { paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 15 },
  headerTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 4 },

  body: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  form: {
    padding: Spacing.xl,
    paddingTop: Spacing.xl + 4,
    gap: Spacing.xl,
    paddingBottom: 40,
  },

  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, textAlign: 'right' },
  hint:  { fontSize: 12, color: Colors.text.tertiary, textAlign: 'right' },

  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
  },
  inputValid: {
    borderColor: Colors.brand.border,
    backgroundColor: Colors.brand.light,
  },

  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    height: 52,
  },
  eyeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Skill level chips
  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary },
  chipTextActive: { color: '#FFFFFF' },

  // Sports grid
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sportCard: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sportCardActive: {
    backgroundColor: Colors.brand.light,
    borderColor: Colors.brand.primary,
  },
  sportIcon:  { fontSize: 22 },
  sportLabel: { fontSize: 10, color: Colors.text.secondary, textAlign: 'center' },
  sportLabelActive: { color: Colors.brand.dark, fontWeight: '600' },

  submitBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  switchRow: { alignItems: 'center', paddingVertical: Spacing.sm },
  switchText: { fontSize: 14, color: Colors.text.secondary },
  switchLink: { color: Colors.brand.primary, fontWeight: '700' },
});
