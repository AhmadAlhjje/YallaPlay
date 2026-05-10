import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../src/theme';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      {/* Green top section */}
      <View style={styles.hero}>
        <SafeAreaView edges={['top']} style={styles.heroInner}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>⚽</Text>
          </View>
          <Text style={styles.appName}>يلا بلاي</Text>
          <Text style={styles.tagline}>احجز ملعبك المفضل في ثوانٍ</Text>

          <View style={styles.featureRow}>
            {[
              { icon: '🏟', label: 'ملاعب قريبة' },
              { icon: '⚡', label: 'حجز فوري' },
              { icon: '🏆', label: 'نقاط مكافآت' },
            ].map((f) => (
              <View key={f.label} style={styles.featureChip}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </View>

      {/* White bottom section */}
      <View style={styles.bottom}>
        <SafeAreaView edges={['bottom']} style={styles.bottomInner}>
          <Text style={styles.welcomeText}>مرحباً بك</Text>
          <Text style={styles.welcomeSub}>سجّل دخولك أو أنشئ حساباً جديداً للبدء</Text>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.registerBtnText}>إنشاء حساب جديد</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            بالمتابعة توافق على{' '}
            <Text style={{ color: Colors.brand.primary }}>شروط الاستخدام</Text>
          </Text>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.primary },

  // ── Green hero ─────────────────────────────────────────────
  hero: {
    backgroundColor: Colors.brand.primary,
    height: height * 0.52,
  },
  heroInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 48 },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  featureChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureIcon: { fontSize: 14 },
  featureLabel: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },

  // ── White bottom ───────────────────────────────────────────
  bottom: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
  },
  bottomInner: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl + 8,
    gap: Spacing.md,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  loginBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  registerBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
  },
  registerBtnText: {
    color: Colors.brand.primary,
    fontSize: 17,
    fontWeight: '600',
  },

  terms: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
});
