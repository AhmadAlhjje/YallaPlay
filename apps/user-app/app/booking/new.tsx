import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { bookingsApi } from '../../src/api/bookings.api';
import { GlassCard } from '../../src/components/GlassCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const PAYMENT_METHODS = [
  { key: 'cash',      label: 'كاش',      icon: '💵', desc: 'ادفع عند الوصول' },
  { key: 'card',      label: 'بطاقة',    icon: '💳', desc: 'فيزا / مدى' },
  { key: 'apple_pay', label: 'Apple Pay', icon: '🍎', desc: 'ادفع بـ Apple Pay' },
] as const;

type PaymentMethod = typeof PAYMENT_METHODS[number]['key'];
type Step = 1 | 2 | 3;

export default function NewBookingScreen() {
  const {
    facilityId, facilityName, date, startTime, endTime, price, sport,
  } = useLocalSearchParams<{
    facilityId: string; facilityName: string; date: string;
    startTime: string; endTime: string; price: string; sport: string;
  }>();

  const [step, setStep]                   = useState<Step>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading]             = useState(false);
  const [bookingId, setBookingId]         = useState<string | null>(null);
  const [qrToken, setQrToken]             = useState<string | null>(null);
  const [bookingRef, setBookingRef]       = useState<string | null>(null);

  const totalPrice = parseFloat(price ?? '0');

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.create({
        facilityId,
        date,
        startTime,
        sport: sport as any,
        paymentMethod: paymentMethod as any,
      });
      const booking = res.data?.data;
      setBookingId(booking._id);
      setQrToken(booking.qrToken);
      setBookingRef(booking.bookingRef ?? booking._id.slice(-8).toUpperCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(3);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.response?.data?.message ?? 'تعذّر إتمام الحجز';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsapp = async () => {
    if (!bookingId) return;
    try { await bookingsApi.markSharedWhatsapp(bookingId); } catch { /* ignore */ }
    const text = `حجزت ملعب ${facilityName} بتاريخ ${date} الساعة ${startTime} - ${endTime} 🏟️`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => Alert.alert('تنبيه', 'تطبيق واتساب غير مثبّت'));
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          {step < 3 && (
            <TouchableOpacity onPress={() => (step === 1 ? router.back() : setStep((s) => (s - 1) as Step))}>
              <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
            </TouchableOpacity>
          )}
          <Text style={[Typography.h3, { color: Colors.text.primary }]}>
            {step === 1 ? 'تفاصيل الحجز' : step === 2 ? 'طريقة الدفع' : 'تم الحجز!'}
          </Text>
          <View style={styles.stepRow}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
            ))}
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* STEP 1 — Booking Summary */}
            {step === 1 && (
              <>
                <GlassCard style={styles.summaryCard}>
                  <Text style={[Typography.h3, { color: Colors.text.primary, marginBottom: Spacing.lg }]}>
                    {facilityName}
                  </Text>
                  <InfoRow icon="📅" label="التاريخ" value={date} />
                  <InfoRow icon="🕐" label="الوقت" value={`${startTime} – ${endTime}`} />
                  <InfoRow icon="⏱️" label="المدة" value={calcDuration(startTime, endTime)} />
                  {sport && <InfoRow icon="🏟️" label="الرياضة" value={sport} />}
                  <View style={styles.priceDivider} />
                  <View style={styles.priceRow}>
                    <Text style={[Typography.h2, { color: Colors.brand.primary }]}>
                      {totalPrice} ر.س
                    </Text>
                    <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>الإجمالي</Text>
                  </View>
                </GlassCard>

                <GlassCard style={{ ...styles.summaryCard, backgroundColor: Colors.successBg, borderColor: Colors.success + '33' }}>
                  <Text style={[Typography.labelMd, { color: Colors.success }]}>
                    ✅ ستحصل على 5 نقاط ولاء بعد تأكيد الحجز
                  </Text>
                </GlassCard>

                <PrimaryButton
                  label="متابعة"
                  onPress={() => setStep(2)}
                  style={{ marginTop: Spacing.xl }}
                />
              </>
            )}

            {/* STEP 2 — Payment Method */}
            {step === 2 && (
              <>
                <Text style={[Typography.bodyMd, { color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing.xl }]}>
                  اختر طريقة الدفع
                </Text>
                {PAYMENT_METHODS.map((pm) => (
                  <TouchableOpacity
                    key={pm.key}
                    onPress={() => setPaymentMethod(pm.key)}
                    style={[
                      styles.paymentOption,
                      paymentMethod === pm.key && styles.paymentOptionActive,
                    ]}
                  >
                    <Text style={{ fontSize: 28 }}>{pm.icon}</Text>
                    <View style={{ flex: 1, marginHorizontal: Spacing.md }}>
                      <Text style={[Typography.labelLg, { color: Colors.text.primary }]}>{pm.label}</Text>
                      <Text style={[Typography.bodyMd, { color: Colors.text.tertiary }]}>{pm.desc}</Text>
                    </View>
                    <View style={[styles.radio, paymentMethod === pm.key && styles.radioActive]}>
                      {paymentMethod === pm.key && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                ))}

                <PrimaryButton
                  label={`تأكيد الحجز — ${totalPrice} ر.س`}
                  onPress={handleConfirm}
                  loading={loading}
                  style={{ marginTop: Spacing.xl }}
                />
              </>
            )}

            {/* STEP 3 — QR Code */}
            {step === 3 && qrToken && (
              <>
                <View style={styles.successIcon}>
                  <Text style={{ fontSize: 64 }}>🎉</Text>
                </View>

                <Text style={[Typography.h2, { color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.sm }]}>
                  تم الحجز بنجاح!
                </Text>
                <Text style={[Typography.bodyMd, { color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing.xl }]}>
                  أرِ هذا الرمز للمسؤول عند الوصول
                </Text>

                <GlassCard style={styles.qrCard}>
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value={qrToken}
                      size={200}
                      backgroundColor="transparent"
                      color={Colors.text.primary}
                    />
                  </View>
                  <Text style={[Typography.numericLg, { color: Colors.brand.primary, marginTop: Spacing.lg, letterSpacing: 4 }]}>
                    {bookingRef}
                  </Text>
                  <Text style={[Typography.labelSm, { color: Colors.text.tertiary, marginTop: 4 }]}>
                    رمز الحجز
                  </Text>
                </GlassCard>

                <InfoRow icon="📅" label="التاريخ" value={date} style={{ marginTop: Spacing.xl }} />
                <InfoRow icon="🕐" label="الوقت" value={`${startTime} – ${endTime}`} />
                <InfoRow icon="🏟️" label="الملعب" value={facilityName} />

                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={handleShareWhatsapp} style={styles.whatsappBtn}>
                    <Text style={{ fontSize: 20 }}>📱</Text>
                    <Text style={[Typography.labelMd, { color: '#25D366' }]}>شارك واتساب</Text>
                  </TouchableOpacity>
                  <PrimaryButton
                    label="تفاصيل الحجز"
                    onPress={() => { if (bookingId) router.replace(`/booking/${bookingId}`); }}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function InfoRow({ icon, label, value, style }: { icon: string; label: string; value: string; style?: any }) {
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }, style]}>
      <Text style={[Typography.bodyMd, { color: Colors.text.tertiary }]}>{icon} {label}</Text>
      <Text style={[Typography.labelMd, { color: Colors.text.primary }]}>{value}</Text>
    </View>
  );
}

function calcDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return '—';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? (m > 0 ? `${h}س ${m}د` : `${h} ساعة`) : `${m} دقيقة`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  safe: { flex: 1, paddingHorizontal: Spacing.xl },
  header: { paddingVertical: Spacing.lg, gap: Spacing.sm },
  stepRow: { flexDirection: 'row', gap: 6, marginTop: Spacing.sm },
  stepDot: {
    width: 24, height: 4, borderRadius: 2,
    backgroundColor: Colors.border.default,
  },
  stepDotActive: { backgroundColor: Colors.brand.primary },
  scroll: { paddingTop: Spacing.sm },
  summaryCard: { marginBottom: Spacing.md, padding: Spacing.xl },
  priceDivider: { height: 1, backgroundColor: Colors.border.default, marginVertical: Spacing.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
    marginBottom: Spacing.md,
  },
  paymentOptionActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.light,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border.default,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.brand.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.brand.primary },
  successIcon: { alignItems: 'center', marginBottom: Spacing.lg },
  qrCard: { padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
  qrWrapper: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl, alignItems: 'center' },
  whatsappBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: '#25D366' + '55',
    backgroundColor: '#25D36618',
  },
});
