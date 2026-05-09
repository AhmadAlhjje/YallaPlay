import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRef = useRef<TextInput>(null);
  const { verifyOtp, sendOtp }  = useAuthStore();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) return;
    setLoading(true);
    try {
      await verifyOtp(phone, otp);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('رمز غير صحيح', err?.response?.data?.message ?? 'يرجى التحقق من الرمز وإعادة المحاولة');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await sendOtp(phone);
      setCountdown(RESEND_COOLDOWN);
      setOtp('');
    } catch {
      Alert.alert('خطأ', 'تعذّر إعادة الإرسال');
    }
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.length === OTP_LENGTH) handleVerify();
  }, [otp]);

  const digits = otp.split('');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background.primary, '#0D1535', Colors.background.primary]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}
        >
          <Text style={[Typography.h1, styles.title]}>رمز التحقق</Text>
          <Text style={[Typography.bodyMd, styles.subtitle]}>
            أدخل الرمز المرسل إلى{'\n'}
            <Text style={{ color: Colors.brand.primary, fontWeight: '600' }}>{phone}</Text>
          </Text>

          {/* OTP digit display */}
          <TouchableOpacity
            onPress={() => inputRef.current?.focus()}
            activeOpacity={1}
            style={styles.digitRow}
          >
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.digitBox,
                  digits[i] !== undefined && styles.digitBoxFilled,
                  i === digits.length && styles.digitBoxActive,
                ]}
              >
                <Text style={[Typography.h2, { color: Colors.text.primary }]}>
                  {digits[i] ?? ''}
                </Text>
              </View>
            ))}
          </TouchableOpacity>

          {/* Hidden real input */}
          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
            style={styles.hiddenInput}
            caretHidden
          />

          <PrimaryButton
            label="تحقق"
            onPress={handleVerify}
            loading={loading}
            disabled={otp.length < OTP_LENGTH}
            style={styles.btn}
          />

          <TouchableOpacity onPress={handleResend} disabled={countdown > 0} style={styles.resend}>
            <Text style={[Typography.bodyMd, { color: countdown > 0 ? Colors.text.tertiary : Colors.brand.primary }]}>
              {countdown > 0 ? `إعادة الإرسال بعد ${countdown}ث` : 'إعادة إرسال الرمز'}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  safe: { flex: 1, paddingHorizontal: Spacing.xl },
  back: { paddingTop: Spacing.lg },
  content: { flex: 1, justifyContent: 'center', gap: Spacing.xl, alignItems: 'center' },
  title: { color: Colors.text.primary, textAlign: 'center' },
  subtitle: { color: Colors.text.secondary, textAlign: 'center', lineHeight: 24 },
  digitRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  digitBox: {
    width: 50,
    height: 60,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.glass.border,
    backgroundColor: Colors.glass.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxFilled: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary + '15',
  },
  digitBoxActive: {
    borderColor: Colors.brand.primary,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  btn: { width: '100%' },
  resend: { paddingVertical: Spacing.sm },
});
