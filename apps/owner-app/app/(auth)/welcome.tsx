import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../src/theme';

const FEATURES = [
  { icon: '📱', text: 'تأكيد الحجوزات بمسح QR' },
  { icon: '📊', text: 'تحليلات الإيرادات في الوقت الفعلي' },
  { icon: '⚡', text: 'عروض فلاش لزيادة الحجوزات' },
  { icon: '🏟️', text: 'إدارة ملاعب متعددة' },
];

export default function OwnerWelcomeScreen() {
  return (
    <View style={styles.container}>
      {/* Green top half */}
      <View style={styles.top}>
        <SafeAreaView edges={['top']}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={{ fontSize: 36 }}>🏟️</Text>
            </View>
          </View>
          <Text style={styles.appName}>يلا بلاي</Text>
          <Text style={styles.tagline}>بوابة أصحاب الملاعب</Text>

          <View style={styles.chips}>
            {FEATURES.map((f) => (
              <View key={f.text} style={styles.chip}>
                <Text style={{ fontSize: 16 }}>{f.icon}</Text>
                <Text style={styles.chipText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </View>

      {/* White bottom half */}
      <View style={styles.bottom}>
        <Text style={styles.ctaTitle}>ابدأ الآن</Text>
        <Text style={styles.ctaSub}>سجّل دخولك للمتابعة</Text>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
        </TouchableOpacity>

        <Text style={styles.registerNotice}>إنشاء الحساب يتم من لوحة التحكم فقط.</Text>

        <Text style={styles.terms}>
          بتسجيل الدخول، أنت توافق على شروط الاستخدام وسياسة الخصوصية
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.primary },

  top: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl + 32,
  },
  logoRow:  { alignItems: 'center', marginTop: Spacing.xxl },
  logoBox:  {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  appName:  { color: '#FFFFFF', fontSize: 32, fontWeight: '800', textAlign: 'center', marginTop: Spacing.lg },
  tagline:  { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', marginTop: 4 },

  chips: { marginTop: Spacing.xl, gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  chipText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },

  bottom: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl + 8,
    gap: Spacing.md,
  },
  ctaTitle: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, textAlign: 'right' },
  ctaSub:   { fontSize: 14, color: Colors.text.tertiary, textAlign: 'right', marginBottom: Spacing.sm },

  loginBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  registerNotice: { fontSize: 13, color: Colors.text.secondary, textAlign: 'center' },

  terms: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'center', marginTop: Spacing.sm },
});
