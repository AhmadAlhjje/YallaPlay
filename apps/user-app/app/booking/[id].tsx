import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../src/api/bookings.api';
import { GlassCard } from '../../src/components/GlassCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { formatTimeRange } from '../../src/lib/time';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'معلّق',    color: Colors.warning,       bg: Colors.warningBg,  icon: '⏳' },
  confirmed: { label: 'مؤكّد',    color: Colors.success,       bg: Colors.successBg,  icon: '✅' },
  completed: { label: 'مكتمل',    color: Colors.info,          bg: Colors.infoBg,     icon: '🏁' },
  cancelled: { label: 'ملغي',     color: Colors.error,         bg: Colors.errorBg,    icon: '❌' },
  no_show:   { label: 'لم يحضر', color: Colors.text.tertiary, bg: Colors.background.secondary, icon: '👻' },
};

const CANCEL_REASONS = [
  'تغيير في الخطط',
  'ظروف طارئة',
  'المكان غير مناسب',
  'خطأ في الحجز',
  'سبب آخر',
];

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason]       = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getById(id),
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => bookingsApi.cancel(id, { reason }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['myBookings'] });
      setShowCancelModal(false);
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر إلغاء الحجز');
    },
  });

  const shareMutation = useMutation({
    mutationFn: () => bookingsApi.markSharedWhatsapp(id),
  });

  const booking = data?.data?.data;

  if (isLoading || !booking) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>جاري التحميل...</Text>
      </View>
    );
  }

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const canCancel = ['pending', 'pending_payment', 'confirmed'].includes(booking.status);
  const ref = booking.bookingRef ?? booking._id.slice(-8).toUpperCase();

  const handleShareWhatsapp = () => {
    shareMutation.mutate();
    const text = `حجزت ملعب ${booking.facility?.name} بتاريخ ${booking.date} الساعة ${formatTimeRange(booking.startTime, booking.endTime)} 🏟️`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => Alert.alert('تنبيه', 'تطبيق واتساب غير مثبّت'));
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
          </TouchableOpacity>
          <Text style={[Typography.h3, { color: Colors.text.primary }]}>تفاصيل الحجز</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.xl }}>
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '44' }]}>
            <Text style={{ fontSize: 20 }}>{status.icon}</Text>
            <Text style={[Typography.labelLg, { color: status.color }]}>{status.label}</Text>
          </View>

          {/* QR Code (only for pending/confirmed) */}
          {(booking.status === 'pending' || booking.status === 'confirmed') && booking.qrToken && (
            <GlassCard style={styles.qrCard}>
              <Text style={[Typography.labelMd, { color: Colors.text.secondary, marginBottom: Spacing.lg }]}>
                أرِ هذا الرمز للمسؤول
              </Text>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={booking.qrToken}
                  size={180}
                  backgroundColor="transparent"
                  color={Colors.text.primary}
                />
              </View>
              <Text style={[Typography.numericLg, { color: Colors.brand.primary, marginTop: Spacing.lg, letterSpacing: 4 }]}>
                {ref}
              </Text>
            </GlassCard>
          )}

          {/* Booking Details */}
          <GlassCard style={styles.detailCard}>
            <Text style={[Typography.h3, { color: Colors.text.primary, marginBottom: Spacing.lg }]}>
              {booking.facility?.name ?? '—'}
            </Text>
            <DetailRow icon="📅" label="التاريخ" value={booking.date} />
            <DetailRow icon="🕐" label="الوقت" value={formatTimeRange(booking.startTime, booking.endTime)} />
            {booking.sport && <DetailRow icon="🏟️" label="الرياضة" value={booking.sport} />}
            <DetailRow icon="💵" label="طريقة الدفع" value={paymentLabel(booking.paymentMethod)} />
            <View style={styles.divider} />
            <DetailRow icon="💰" label="السعر" value={`${booking.price} ر.س`} />
            {booking.pointsEarned > 0 && (
              <DetailRow icon="⭐" label="النقاط المكتسبة" value={`+${booking.pointsEarned} نقطة`} />
            )}
          </GlassCard>

          {/* Facility Address */}
          {booking.facility?.address && (
            <GlassCard style={[styles.detailCard, { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }]}>
              <View style={styles.locationIcon}>
                <Ionicons name="location-sharp" size={14} color={Colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.labelMd, { color: Colors.text.secondary }]}>العنوان</Text>
                <Text style={[Typography.bodyMd, { color: Colors.text.primary, marginTop: 2 }]}>
                  {booking.facility.address}
                </Text>
              </View>
            </GlassCard>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleShareWhatsapp} style={styles.whatsappBtn}>
              <Text style={{ fontSize: 18 }}>📱</Text>
              <Text style={[Typography.labelMd, { color: '#25D366' }]}>واتساب</Text>
            </TouchableOpacity>

            {canCancel && (
              <TouchableOpacity
                onPress={() => setShowCancelModal(true)}
                style={styles.cancelBtn}
              >
                <Text style={[Typography.labelMd, { color: Colors.error }]}>إلغاء الحجز</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Cancel Modal */}
      {showCancelModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowCancelModal(false)} />
          <View style={[styles.modal, { paddingBottom: insets.bottom + Spacing.xl }]}>
            <Text style={[Typography.h3, { color: Colors.text.primary, marginBottom: Spacing.sm }]}>
              إلغاء الحجز
            </Text>
            {booking.status === 'confirmed' ? (
              <View style={styles.cancelWarning}>
                <Ionicons name="warning-outline" size={18} color={Colors.warning} />
                <Text style={[Typography.bodyMd, { color: Colors.warning, flex: 1 }]}>
                  ستفقد مبلغ الحجز بشكل نهائي، لكن ستحتفظ بنقطة واحدة تعويضاً
                </Text>
              </View>
            ) : (
              <Text style={[Typography.bodyMd, { color: Colors.text.secondary, marginBottom: Spacing.xl }]}>
                سيتم إلغاء الحجز. اختر سبب الإلغاء:
              </Text>
            )}
            {CANCEL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setCancelReason(reason)}
                style={[styles.reasonOption, cancelReason === reason && styles.reasonActive]}
              >
                <View style={[styles.radio, cancelReason === reason && styles.radioActive]}>
                  {cancelReason === reason && <View style={styles.radioDot} />}
                </View>
                <Text style={[Typography.bodyMd, { color: Colors.text.primary }]}>{reason}</Text>
              </TouchableOpacity>
            ))}
            <PrimaryButton
              label="تأكيد الإلغاء"
              onPress={() => {
                if (!cancelReason) { Alert.alert('', 'اختر سبب الإلغاء'); return; }
                cancelMutation.mutate(cancelReason);
              }}
              loading={cancelMutation.isPending}
              style={{ marginTop: Spacing.xl }}
            />
            <TouchableOpacity onPress={() => setShowCancelModal(false)} style={styles.dismissBtn}>
              <Text style={[Typography.labelMd, { color: Colors.text.tertiary }]}>رجوع</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
      <Text style={[Typography.bodyMd, { color: Colors.text.tertiary }]}>{icon} {label}</Text>
      <Text style={[Typography.labelMd, { color: Colors.text.primary }]}>{value}</Text>
    </View>
  );
}

function paymentLabel(method: string): string {
  const m: Record<string, string> = { cash: 'كاش', card: 'بطاقة', apple_pay: 'Apple Pay' };
  return m[method] ?? method;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  center: { alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    alignSelf: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.full, borderWidth: 1, marginBottom: Spacing.xl,
  },
  qrCard: { alignItems: 'center', padding: Spacing.xl, marginBottom: Spacing.lg },
  qrWrapper: {
    padding: Spacing.lg, borderRadius: Radius.lg,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  detailCard: { padding: Spacing.xl, marginBottom: Spacing.md },
  locationIcon: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  divider: { height: 1, backgroundColor: Colors.border.default, marginVertical: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  whatsappBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: '#25D36655',
    backgroundColor: '#25D36618',
  },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.error + '55',
    backgroundColor: Colors.errorBg,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.border.default,
  },
  reasonOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  reasonActive: { backgroundColor: Colors.brand.light },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border.default,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.brand.primary },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.brand.primary },
  dismissBtn: { alignItems: 'center', paddingVertical: Spacing.lg },
  cancelWarning: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warningBg, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
});
