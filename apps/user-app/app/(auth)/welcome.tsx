import React from 'react';
import {
  View, Text, StyleSheet, Dimensions, ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Colors, Typography, Spacing } from '../../src/theme';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      {/* Background — dark gradient with faint sport imagery */}
      <LinearGradient
        colors={[Colors.background.primary, '#0D1535', Colors.background.primary]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow orbs for depth */}
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      <SafeAreaView style={styles.safe}>
        {/* Logo / Brand */}
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Text style={{ fontSize: 48 }}>⚽</Text>
          </View>
          <Text style={[Typography.displayLg, styles.appName]}>يلا بلاي</Text>
          <Text style={[Typography.bodyLg, styles.tagline]}>
            احجز ملعبك المفضل في ثوانٍ
          </Text>
        </View>

        {/* Feature pills */}
        <View style={styles.features}>
          {[
            { icon: '🏟', text: 'ملاعب قريبة منك' },
            { icon: '⚡', text: 'حجز فوري بنقرة واحدة' },
            { icon: '🏆', text: 'نقاط مكافآت مع كل حجز' },
          ].map((f) => (
            <View key={f.text} style={styles.featurePill}>
              <Text style={{ fontSize: 20 }}>{f.icon}</Text>
              <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <PrimaryButton
            label="ابدأ الآن"
            onPress={() => router.push('/(auth)/phone')}
            style={styles.cta}
          />
          <Text style={[Typography.bodySm, styles.terms]}>
            بالمتابعة توافق على{' '}
            <Text style={{ color: Colors.brand.primary }}>شروط الاستخدام</Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: Spacing.xl },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.12,
  },
  orbTop: {
    top: -80,
    right: -60,
    backgroundColor: Colors.brand.primary,
  },
  orbBottom: {
    bottom: -60,
    left: -80,
    backgroundColor: Colors.brand.secondary,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: height * 0.1,
  },
  logoIcon: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: Colors.glass.medium,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  appName: {
    color: Colors.text.primary,
    textAlign: 'center',
  },
  tagline: {
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  features: {
    gap: Spacing.md,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.glass.subtle,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  ctas: { paddingBottom: Spacing.xl },
  cta: { marginBottom: Spacing.md },
  terms: {
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
