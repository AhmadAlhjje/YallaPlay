import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { GlassCard } from '../../src/components/GlassCard';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('+963');
  const [loading, setLoading] = useState(false);
  const { sendOtp } = useAuthStore();

  const isValid = /^\+963\d{9}$/.test(phone);

  const handleSend = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await sendOtp(phone);
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background.primary, '#0D1535', Colors.background.primary]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}
        >
          <Text style={[Typography.h1, styles.title]}>أدخل رقم هاتفك</Text>
          <Text style={[Typography.bodyMd, styles.subtitle]}>
            سنرسل لك رمز تحقق مكوّن من 6 أرقام
          </Text>

          <GlassCard style={styles.inputCard} intensity={18}>
            <Text style={[Typography.labelMd, { color: Colors.text.secondary, marginBottom: Spacing.sm }]}>
              رقم الجوال
            </Text>
            <TextInput
              value={phone}
              onChangeText={(t) => {
                // Enforce +963 prefix
                if (!t.startsWith('+963')) return;
                setPhone(t);
              }}
              keyboardType="phone-pad"
              maxLength={13}
              style={styles.input}
              placeholderTextColor={Colors.text.tertiary}
              selectionColor={Colors.brand.primary}
              textAlign="left"
              autoFocus
            />
            <View
              style={[
                styles.inputUnderline,
                { backgroundColor: isValid ? Colors.success : Colors.glass.border },
              ]}
            />
          </GlassCard>

          <Text style={[Typography.bodySm, styles.hint]}>
            مثال: +963912345678
          </Text>

          <PrimaryButton
            label="إرسال رمز التحقق"
            onPress={handleSend}
            loading={loading}
            disabled={!isValid}
            style={styles.btn}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  safe: { flex: 1, paddingHorizontal: Spacing.xl },
  back: { paddingTop: Spacing.lg },
  content: { flex: 1, justifyContent: 'center', gap: Spacing.lg },
  title: { color: Colors.text.primary, textAlign: 'right' },
  subtitle: { color: Colors.text.secondary, textAlign: 'right' },
  inputCard: { padding: Spacing.xl },
  input: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: 2,
    paddingVertical: Spacing.sm,
  },
  inputUnderline: {
    height: 2,
    borderRadius: 1,
    marginTop: Spacing.xs,
    transition: 'background-color 0.2s',
  } as any,
  hint: { color: Colors.text.tertiary, textAlign: 'right' },
  btn: { marginTop: Spacing.md },
});
