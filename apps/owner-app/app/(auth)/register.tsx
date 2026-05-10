import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Spacing, Radius } from '../../src/theme';

export default function OwnerRegisterScreen() {
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(auth)/welcome');

  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('+963');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { register } = useAuthStore();

  const isPhoneValid = /^\+963\d{9}$/.test(phone);
  const canSubmit    = name.trim().length >= 2 && isPhoneValid && password.length >= 6;

  const handleRegister = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await register(name.trim(), phone, password);
      router.replace('/(tabs)');
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
      } else if (err?.message === 'ليس حساب مالك ملعب') {
        Alert.alert('خطأ', 'هذا الرقم مسجل كحساب لاعب. يرجى استخدام رقم آخر.');
      } else {
        Alert.alert('خطأ في إنشاء الحساب', err?.response?.data?.message ?? 'حدث خطأ، يرجى المحاولة مجدداً');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>→ رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إنشاء حساب مالك</Text>
          <Text style={styles.headerSub}>سجّل ملعبك على يلا بلاي</Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>🏟️</Text>
            <Text style={styles.infoText}>
              هذا الحساب مخصص لأصحاب الملاعب فقط. إذا كنت لاعباً، استخدم تطبيق يلا بلاي للاعبين.
            </Text>
          </View>

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

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                placeholder="6 أحرف على الأقل"
                placeholderTextColor={Colors.text.tertiary}
                selectionColor={Colors.brand.primary}
                textAlign="right"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

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

          <TouchableOpacity style={styles.switchRow} onPress={() => router.replace('/(auth)/login')}>
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
  backBtn:     { paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  backText:    { color: 'rgba(255,255,255,0.85)', fontSize: 15 },
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

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.brand.border + '40',
  },
  infoIcon: { fontSize: 20 },
  infoText: { flex: 1, fontSize: 13, color: Colors.brand.dark ?? Colors.brand.secondary, textAlign: 'right', lineHeight: 20 },

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

  passwordRow:   { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: {
    position: 'absolute',
    left: Spacing.md,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  eyeIcon: { fontSize: 18 },

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
