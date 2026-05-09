import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

export default function OwnerPhoneScreen() {
  const [phone, setPhone] = useState('+963');
  const [loading, setLoading] = useState(false);
  const { sendOtp } = useAuthStore();

  const normalized = phone.replace(/\s/g, '');
  const isValid = /^\+963\d{9}$/.test(normalized);

  const handleSend = async () => {
    if (!isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('رقم غير صحيح', 'أدخل رقم سوري صحيح (+963XXXXXXXXX)');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(normalized);
      router.push({ pathname: '/(auth)/otp', params: { phone: normalized } });
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0E1A', '#0D1535', '#0A0E1A']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}
        >
          <Text style={[Typography.h1, { color: Colors.text.primary, textAlign: 'center' }]}>رقم الجوال</Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing.sm }]}>
            سنرسل رمز التحقق لتسجيل دخولك كمالك ملعب
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              value={phone}
              onChangeText={(t) => {
                if (!t.startsWith('+963')) { setPhone('+963'); return; }
                setPhone(t.replace(/[^\d+]/g, ''));
              }}
              keyboardType="phone-pad"
              maxLength={13}
              style={styles.input}
              placeholderTextColor={Colors.text.tertiary}
              selectionColor={Colors.brand.primary}
            />
            {isValid && <Text style={styles.checkmark}>✓</Text>}
          </View>

          <PrimaryButton
            label="إرسال الرمز"
            onPress={handleSend}
            loading={loading}
            disabled={!isValid}
            style={{ marginTop: Spacing.xl }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  safe: { flex: 1, paddingHorizontal: Spacing.xl },
  backBtn: { paddingTop: Spacing.lg },
  content: { flex: 1, justifyContent: 'center', gap: Spacing.xl },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.glass.subtle,
    borderWidth: 1.5, borderColor: Colors.glass.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  input: {
    flex: 1, color: Colors.text.primary,
    fontSize: 22, fontWeight: '600', letterSpacing: 2,
    textAlign: 'center',
  },
  checkmark: { color: Colors.success, fontSize: 20 },
});
