import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const FEATURES = [
  { icon: '📱', text: 'تأكيد الحجوزات بمسح QR' },
  { icon: '📊', text: 'تحليلات الإيرادات في الوقت الفعلي' },
  { icon: '⚡', text: 'عروض فلاش لزيادة الحجوزات' },
  { icon: '🏟️', text: 'إدارة ملاعب متعددة' },
];

export default function OwnerWelcomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0E1A', '#0D1535', '#0A0E1A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow orb */}
      <View style={styles.orb} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Text style={{ fontSize: 40 }}>🏟️</Text>
          </View>
          <Text style={[Typography.h1, { color: Colors.text.primary, marginTop: Spacing.lg }]}>
            يلا بلاي
          </Text>
          <Text style={[Typography.bodyLg, { color: Colors.brand.primary, marginTop: 4 }]}>
            بوابة أصحاب الملاعب
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featurePill}>
              <Text style={{ fontSize: 18 }}>{f.icon}</Text>
              <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="ابدأ كمالك ملعب"
            onPress={() => router.push('/(auth)/phone')}
          />
          <Text style={[Typography.bodySm, { color: Colors.text.tertiary, textAlign: 'center', marginTop: Spacing.lg }]}>
            بتسجيل الدخول، أنت توافق على شروط الاستخدام وسياسة الخصوصية
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  orb: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.brand.glow, top: -80, alignSelf: 'center',
    opacity: 0.5,
  },
  safe: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'space-between', paddingVertical: Spacing.huge },
  logoSection: { alignItems: 'center', marginTop: Spacing.huge },
  logoIcon: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: Colors.brand.primary + '22',
    borderWidth: 1.5, borderColor: Colors.brand.primary + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  features: { gap: Spacing.md },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.glass.subtle,
    borderWidth: 1, borderColor: Colors.glass.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  actions: {},
});
