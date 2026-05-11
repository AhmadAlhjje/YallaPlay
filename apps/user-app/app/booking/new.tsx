import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  KeyboardAvoidingView, Platform, Linking, Image as RNImage,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { bookingsApi } from '../../src/api/bookings.api';
import { GlassCard } from '../../src/components/GlassCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { formatTimeRange } from '../../src/lib/time';

type Step = 1 | 2;

export default function NewBookingScreen() {
  const {
    facilityId, facilityName, date, startTime, endTime, price, sport, shamCashQr,
  } = useLocalSearchParams<{
    facilityId: string; facilityName: string; date: string;
    startTime: string; endTime: string; price: string; sport: string; shamCashQr?: string;
  }>();

  const [step, setStep]             = useState<Step>(1);
  const [loading, setLoading]       = useState(false);
  const [bookingId, setBookingId]   = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitted, setSubmitted]   = useState(false);
  const screenshotB64 = useRef<string | null>(null);

  const totalPrice = parseFloat(price ?? '0');

  const VALID_SPORTS = ['football', 'basketball', 'tennis', 'volleyball', 'padel', 'squash', 'badminton', 'swimming'];

  const handleCreateBooking = async () => {
    if (!sport || !VALID_SPORTS.includes(sport)) {
      Alert.alert('خطأ', 'لم يتم تحديد الرياضة. ارجع واختر وقتاً مرة أخرى.');
      return;
    }
    if (!date || !startTime || !facilityId) {
      Alert.alert('خطأ', 'بيانات الحجز غير مكتملة. ارجع وحاول مرة أخرى.');
      return;
    }
    setLoading(true);
    try {
      const res = await bookingsApi.create({
        facilityId,
        date,
        startTime,
        sport: sport as any,
        paymentMethod: 'qr_cash' as any,
      });
      const booking = res.data?.data;
      setBookingId(booking._id);
      setBookingRef(booking.bookingRef ?? booking._id.slice(-8).toUpperCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(2);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errors = err?.response?.data?.errors as Array<{ field: string; message: string }> | undefined;
      const detail = errors?.map((e) => `• ${e.field}: ${e.message}`).join('\n') ?? '';
      Alert.alert(
        'خطأ في البيانات',
        `${err?.response?.data?.message ?? 'تعذّر إتمام الحجز'}${detail ? `\n\n${detail}` : ''}`,
      );
    } finally {
      setLoading(false);
    }
  };


  const pickScreenshot = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('الصلاحيات', 'يرجى منح صلاحية الوصول إلى الصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setScreenshot(asset.uri);
      screenshotB64.current = asset.base64 ?? null;
    }
  };

  const handleSubmitPayment = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const screenshotData = screenshotB64.current
        ? `data:image/jpeg;base64,${screenshotB64.current}`
        : undefined;
      await bookingsApi.markPaymentSubmitted(bookingId, screenshotData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر إرسال إشعار الدفع');
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsapp = async () => {
    if (!bookingId) return;
    try { await bookingsApi.markSharedWhatsapp(bookingId); } catch { /* ignore */ }
    const text = `حجزت ملعب ${facilityName} بتاريخ ${date} الساعة ${formatTimeRange(startTime, endTime)} 🏟️`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() =>
      Alert.alert('تنبيه', 'تطبيق واتساب غير مثبّت'),
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (step === 1 ? router.back() : setStep(1))}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'تفاصيل الحجز' : 'الدفع عبر شام كاش'}
          </Text>
          <View style={styles.stepRow}>
            {[1, 2].map((s) => (
              <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
            ))}
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* ── STEP 1: Booking Summary ───────────────────────────── */}
            {step === 1 && (
              <>
                <GlassCard style={styles.summaryCard}>
                  <Text style={styles.facilityName}>{facilityName}</Text>

                  <InfoRow icon="calendar-outline" label="التاريخ"  value={date} />
                  <InfoRow icon="time-outline"     label="الوقت"    value={formatTimeRange(startTime, endTime)} />
                  <InfoRow icon="hourglass-outline" label="المدة"   value={calcDuration(startTime, endTime)} />
                  {sport && <InfoRow icon="football-outline" label="الرياضة" value={sport} />}

                  <View style={styles.divider} />

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>الإجمالي</Text>
                    <Text style={styles.priceValue}>{totalPrice} ر.س</Text>
                  </View>
                </GlassCard>

                <View style={styles.pointsHint}>
                  <Ionicons name="star" size={14} color="#D97706" />
                  <Text style={styles.pointsHintText}>ستحصل على 5 نقاط ولاء بعد تأكيد الحجز</Text>
                </View>

                <PrimaryButton
                  label={loading ? 'جاري إنشاء الحجز...' : 'متابعة للدفع'}
                  onPress={handleCreateBooking}
                  loading={loading}
                  style={{ marginTop: Spacing.xl }}
                />
              </>
            )}

            {/* ── STEP 2: ShamCash QR + Screenshot Upload ──────────── */}
            {step === 2 && (
              <>
                {/* QR Card */}
                <View style={styles.qrCard}>
                  <Text style={styles.qrTitle}>امسح رمز شام كاش</Text>
                  <Text style={styles.qrSubtitle}>افتح تطبيق شام كاش وامسح الرمز لإتمام الدفع</Text>

                  <View style={styles.qrBox}>
                    {shamCashQr ? (
                      <QRCode
                        value={String(shamCashQr)}
                        size={190}
                        backgroundColor="white"
                        color="#111"
                      />
                    ) : (
                      <View style={styles.noQrBox}>
                        <Ionicons name="qr-code-outline" size={52} color={Colors.text.tertiary} />
                        <Text style={styles.noQrText}>لم يتم إعداد QR لهذا الملعب</Text>
                      </View>
                    )}
                  </View>

                  {bookingRef && (
                    <View style={styles.refRow}>
                      <Text style={styles.refLabel}>رقم الحجز</Text>
                      <Text style={styles.refValue}>{bookingRef}</Text>
                    </View>
                  )}
                </View>

                {/* Payment info */}
                <GlassCard style={styles.infoCard}>
                  <InfoRow icon="business-outline"  label="الملعب"  value={facilityName} />
                  <InfoRow icon="calendar-outline"  label="التاريخ" value={date} />
                  <InfoRow icon="time-outline"      label="الوقت"   value={formatTimeRange(startTime, endTime)} />
                  <View style={[styles.divider, { marginVertical: Spacing.sm }]} />
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>المبلغ المطلوب</Text>
                    <Text style={styles.priceValue}>{totalPrice} ر.س</Text>
                  </View>
                </GlassCard>

                {/* Screenshot upload — shown until payment is submitted */}
                {!submitted && (
                  <View style={styles.uploadSection}>
                    <Text style={styles.uploadTitle}>ارفع إشعار الدفع</Text>
                    <Text style={styles.uploadSubtitle}>
                      بعد الدفع عبر شام كاش، ارفع لقطة شاشة للتأكيد ليراها صاحب الملعب
                    </Text>

                    <TouchableOpacity style={styles.uploadBtn} onPress={pickScreenshot} activeOpacity={0.8}>
                      {screenshot ? (
                        <>
                          <RNImage source={{ uri: screenshot }} style={styles.previewImg} />
                          <View style={styles.previewOverlay}>
                            <Ionicons name="camera" size={20} color="#fff" />
                            <Text style={styles.previewOverlayText}>تغيير الصورة</Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View style={styles.uploadIcon}>
                            <Ionicons name="image-outline" size={28} color={Colors.brand.primary} />
                          </View>
                          <Text style={styles.uploadBtnLabel}>اختر لقطة الشاشة</Text>
                          <Text style={styles.uploadBtnHint}>PNG أو JPG من معرض الصور</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <PrimaryButton
                      label={loading ? 'جاري الإرسال...' : 'إرسال إشعار الدفع'}
                      onPress={handleSubmitPayment}
                      loading={loading}
                      style={{ marginTop: Spacing.lg }}
                    />
                  </View>
                )}

                {/* Success state — shown after payment notification is sent */}
                {submitted && (
                  <View style={styles.successCard}>
                    <View style={styles.successIcon}>
                      <Ionicons name="checkmark-circle" size={48} color={Colors.brand.primary} />
                    </View>
                    <Text style={styles.successTitle}>تم إرسال إشعار الدفع</Text>
                    <Text style={styles.successDesc}>
                      تم إشعار صاحب الملعب وسيقوم بتأكيد الحجز قريباً
                    </Text>

                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={handleShareWhatsapp} style={styles.whatsappBtn}>
                        <Text style={{ fontSize: 18 }}>📱</Text>
                        <Text style={styles.whatsappText}>شارك واتساب</Text>
                      </TouchableOpacity>
                      <PrimaryButton
                        label="تفاصيل الحجز"
                        onPress={() => { if (bookingId) router.replace(`/booking/${bookingId}`); }}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}

                <View style={{ height: 40 }} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <View style={styles.infoLeft}>
        <View style={styles.infoIconWrap}>
          <Ionicons name={icon} size={14} color={Colors.brand.primary} />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
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
  safe: { flex: 1 },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.border.default,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  stepRow: { flexDirection: 'row', gap: 6 },
  stepDot: {
    width: 28, height: 4, borderRadius: 2,
    backgroundColor: Colors.border.default,
  },
  stepDotActive: { backgroundColor: Colors.brand.primary },

  scroll: { padding: Spacing.xl, paddingBottom: 60 },

  // Step 1
  summaryCard: { padding: Spacing.xl, marginBottom: Spacing.md },
  facilityName: {
    fontSize: 18, fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'right',
    marginBottom: Spacing.lg,
  },
  divider: { height: 1, backgroundColor: Colors.border.default, marginVertical: Spacing.md },
  priceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 13, color: Colors.text.secondary, fontWeight: '500' },
  priceValue: { fontSize: 22, fontWeight: '800', color: Colors.brand.primary },

  pointsHint: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: Spacing.md,
  },
  pointsHintText: { fontSize: 13, color: '#92400E', fontWeight: '500', flex: 1, textAlign: 'right' },

  // Step 2 — QR
  qrCard: {
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border.strong,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
  },
  qrTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary, marginBottom: 4 },
  qrSubtitle: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 18 },
  qrBox: {
    padding: Spacing.xl,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border.default,
    marginBottom: Spacing.lg,
  },
  noQrBox: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center', gap: 12 },
  noQrText: { fontSize: 13, color: Colors.text.tertiary, textAlign: 'center' },
  refRow: { alignItems: 'center', gap: 4 },
  refLabel: { fontSize: 11, color: Colors.text.tertiary },
  refValue: { fontSize: 20, fontWeight: '800', color: Colors.brand.primary, letterSpacing: 3 },

  infoCard: { padding: Spacing.xl, marginBottom: Spacing.lg },

  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  infoIconWrap: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 13, color: Colors.text.secondary, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700', color: Colors.text.primary },

  // Screenshot upload
  uploadSection: { marginBottom: Spacing.lg },
  uploadTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, textAlign: 'right', marginBottom: 4 },
  uploadSubtitle: { fontSize: 12, color: Colors.text.secondary, textAlign: 'right', lineHeight: 18, marginBottom: Spacing.lg },
  uploadBtn: {
    height: 150,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 8,
  },
  uploadIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.brand.border,
  },
  uploadBtnLabel: { fontSize: 14, fontWeight: '700', color: Colors.brand.primary },
  uploadBtnHint: { fontSize: 11, color: Colors.text.tertiary },
  previewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  previewOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, gap: 6,
  },
  previewOverlayText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Success
  successCard: {
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.brand.border,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.brand.light,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary },
  successDesc: { fontSize: 13, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  actionRow: { flexDirection: 'row-reverse', gap: Spacing.md, width: '100%', alignItems: 'center', marginTop: Spacing.sm },
  whatsappBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: '#25D366' + '55',
    backgroundColor: '#25D36618',
  },
  whatsappText: { fontSize: 13, fontWeight: '600', color: '#25D366' },
});
