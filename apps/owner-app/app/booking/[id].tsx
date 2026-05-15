import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { bookingsApi } from '../../src/api/bookings.api';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { formatTimeRange } from '../../src/lib/time';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'بانتظار التأكيد',
  confirmed: 'مؤكّد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  no_show: 'لم يحضر',
};
const STATUS_COLORS: Record<string, string> = {
  pending_payment: Colors.warning,
  confirmed: Colors.success,
  completed: Colors.info,
  cancelled: Colors.error,
  no_show: Colors.text.tertiary,
};
const STATUS_ICONS: Record<string, string> = {
  pending_payment: 'time-outline',
  confirmed: 'checkmark-circle-outline',
  completed: 'flag-outline',
  cancelled: 'close-circle-outline',
  no_show: 'person-remove-outline',
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['booking-detail', id],
    queryFn: () => bookingsApi.getById(id!),
    enabled: !!id,
  });

  const booking = data?.data?.data ?? data?.data;

  const confirmMutation = useMutation({
    mutationFn: () => bookingsApi.confirmManual(id!),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['booking-detail', id] });
      qc.invalidateQueries({ queryKey: ['owner-bookings'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
    },
    onError: (err: any) =>
      Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر التأكيد'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancel(id!, 'إلغاء من المالك'),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['booking-detail', id] });
      qc.invalidateQueries({ queryKey: ['owner-bookings'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
      router.back();
    },
    onError: (err: any) =>
      Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر الإلغاء'),
  });

  const confirmCancel = () => {
    const name = booking?.guestName ?? booking?.user?.name ?? 'هذا الحجز';
    Alert.alert('إلغاء الحجز', `هل تريد إلغاء حجز ${name}؟`, [
      { text: 'رجوع', style: 'cancel' },
      {
        text: 'نعم، إلغاء',
        style: 'destructive',
        onPress: () => cancelMutation.mutate(),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.brand.primary} size="large" />
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>⚠️</Text>
        <Text style={[Typography.h3, { color: Colors.text.secondary }]}>تعذّر تحميل الحجز</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnLg}>
          <Text style={styles.backBtnLgText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[booking.status] ?? Colors.text.secondary;
  const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;
  const statusIcon  = STATUS_ICONS[booking.status] ?? 'help-circle-outline';
  const isPending   = booking.status === 'pending_payment';
  const isOwnerAdded = booking.source === 'owner';
  const displayName  = booking.guestName ?? booking.user?.name ?? 'لاعب';
  const displayPhone = booking.guestPhone ?? booking.user?.phone;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={[Typography.h3, { color: Colors.text.primary }]}>تفاصيل الحجز</Text>
        <View style={{ width: 38 }} />
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Banner ───────────────────────────────────── */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '18', borderColor: statusColor + '44' }]}>
          <Ionicons name={statusIcon as any} size={28} color={statusColor} />
          <View style={{ flex: 1 }}>
            <Text style={[Typography.labelLg, { color: statusColor }]}>{statusLabel}</Text>
            {isOwnerAdded && (
              <Text style={[Typography.bodySm, { color: statusColor + 'BB' }]}>حجز يدوي من المالك</Text>
            )}
          </View>
          <Text style={[Typography.numericSm, { color: statusColor }]}>
            #{(booking.bookingRef ?? booking._id?.slice(-6) ?? '').toUpperCase()}
          </Text>
        </View>

        {/* ── Person Info ─────────────────────────────────────── */}
        <SectionTitle icon="person-outline" title="بيانات الشخص" />
        <GlassCard style={styles.card}>
          <InfoRow icon="person" label="الاسم" value={displayName} />
          {displayPhone && <InfoRow icon="call" label="الهاتف" value={displayPhone} />}
          {booking.user?.phone && booking.guestPhone && booking.user.phone !== displayPhone && (
            <InfoRow icon="phone-portrait" label="هاتف التطبيق" value={booking.user.phone} />
          )}
        </GlassCard>

        {/* ── Booking Info ─────────────────────────────────────── */}
        <SectionTitle icon="calendar-outline" title="تفاصيل الحجز" />
        <GlassCard style={styles.card}>
          <InfoRow icon="calendar"   label="التاريخ" value={booking.date} />
          <InfoRow icon="time"       label="الوقت"   value={formatTimeRange(booking.startTime, booking.endTime)} />
          <InfoRow icon="football"   label="الرياضة" value={({ football: 'كرة قدم', basketball: 'كرة سلة', tennis: 'تنس', padel: 'بادل', volleyball: 'كرة طائرة', handball: 'كرة يد', badminton: 'ريشة طائرة', squash: 'اسكواش', swimming: 'سباحة', cricket: 'كريكيت' } as Record<string, string>)[booking.sport] ?? booking.sport ?? '—'} />
          <InfoRow icon="storefront" label="الملعب"  value={booking.facilityId?.name ?? '—'} />
        </GlassCard>

        {/* ── Payment Info ─────────────────────────────────────── */}
        <SectionTitle icon="cash-outline" title="تفاصيل الدفع" />
        <GlassCard style={styles.card}>
          <InfoRow icon="cash" label="سعر الحجز" value={`${booking.totalPrice ?? 0} ل.س`} highlight />
          {(booking.depositPaid ?? 0) > 0 && (
            <InfoRow icon="wallet" label="العربون المدفوع" value={`${booking.depositPaid} ل.س`} />
          )}
          <InfoRow
            icon="card"
            label="طريقة الدفع"
            value={{ qr_cash: 'كاش - QR', stc_pay: 'STC Pay', mada: 'مدى', points: 'نقاط' }[booking.paymentMethod as string] ?? booking.paymentMethod}
          />
        </GlassCard>

        {/* ── Payment Screenshot ───────────────────────────────── */}
        {booking.paymentScreenshot && (
          <>
            <SectionTitle icon="image-outline" title="إيصال الدفع" />
            <GlassCard style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
              <Image
                source={{ uri: booking.paymentScreenshot }}
                style={styles.screenshot}
                resizeMode="contain"
              />
              <View style={styles.screenshotLabel}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={[Typography.labelSm, { color: Colors.success }]}>تم إرسال إيصال الدفع</Text>
              </View>
            </GlassCard>
          </>
        )}

        {/* ── Actions ──────────────────────────────────────────── */}
        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              style={styles.confirmBtn}
            >
              {confirmMutation.isPending
                ? <ActivityIndicator color={Colors.brand.primary} size="small" />
                : <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.brand.primary} />
                    <Text style={[Typography.labelLg, { color: Colors.brand.primary }]}>تأكيد الحجز</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmCancel}
              disabled={cancelMutation.isPending}
              style={styles.cancelBtn}
            >
              <Ionicons name="close-circle" size={20} color={Colors.error} />
              <Text style={[Typography.labelLg, { color: Colors.error }]}>إلغاء الحجز</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel for confirmed */}
        {booking.status === 'confirmed' && (
          <TouchableOpacity
            onPress={confirmCancel}
            disabled={cancelMutation.isPending}
            style={[styles.cancelBtn, { marginTop: Spacing.lg }]}
          >
            <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
            <Text style={[Typography.labelMd, { color: Colors.error }]}>إلغاء الحجز</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={15} color={Colors.brand.primary} />
      <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, highlight }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon} size={14} color={highlight ? Colors.brand.primary : Colors.text.tertiary} />
        <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{label}</Text>
      </View>
      <Text style={[Typography.labelMd, { color: highlight ? Colors.brand.primary : Colors.text.primary, textAlign: 'right', flex: 1 }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.md },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1.5,
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: Spacing.sm, marginTop: Spacing.lg,
  },
  sectionTitleText: { fontSize: 13, fontWeight: '700', color: Colors.brand.primary },

  card: { gap: 0, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border + '80',
  },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 90 },

  screenshot: { width: '100%', height: 240 },
  screenshotLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: Spacing.md, justifyContent: 'center',
    borderTopWidth: 1, borderTopColor: Colors.glass.border,
  },

  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  confirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.brand.primary + '55',
    backgroundColor: Colors.brand.light,
  },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.error + '55',
    backgroundColor: Colors.errorBg,
  },
  backBtnLg: {
    marginTop: Spacing.xl, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, backgroundColor: Colors.brand.primary,
  },
  backBtnLgText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
