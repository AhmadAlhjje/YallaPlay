import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../src/api/bookings.api';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

type ScanState = 'idle' | 'scanning' | 'loading' | 'success' | 'error';

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending:   'معلّق',
  confirmed: 'مؤكّد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export default function ScannerTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState]       = useState<ScanState>('idle');
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [errorMsg, setErrorMsg]         = useState('');
  const scanLockRef                     = useRef(false);
  const scanLineAnim                    = useRef(new Animated.Value(0)).current;
  const qc                              = useQueryClient();

  // Animate scan line
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const confirmMutation = useMutation({
    mutationFn: (qrToken: string) => bookingsApi.confirmQr(qrToken),
    onSuccess: (res) => {
      const booking = res.data.data;
      setConfirmedBooking(booking);
      setScanState('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['pending-bookings'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'رمز غير صحيح أو منتهي الصلاحية';
      setErrorMsg(msg);
      setScanState('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanLockRef.current || scanState === 'loading') return;
    scanLockRef.current = true;
    setScanState('loading');
    confirmMutation.mutate(data);
  };

  const resetScanner = () => {
    setScanState('idle');
    setConfirmedBooking(null);
    setErrorMsg('');
    setTimeout(() => { scanLockRef.current = false; }, 500);
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>جاري التحقق من صلاحيات الكاميرا...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 52, marginBottom: Spacing.xl }}>📷</Text>
        <Text style={[Typography.h3, { color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.md }]}>
          الكاميرا مطلوبة لمسح QR
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={[Typography.labelLg, { color: Colors.brand.primary }]}>منح الإذن</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 220],
  });

  return (
    <View style={styles.container}>
      {/* Camera fills screen */}
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanState === 'idle' ? handleBarCodeScanned : undefined}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        <LinearGradient colors={['rgba(10,14,26,0.85)', 'transparent']} style={styles.topGradient} />

        <SafeAreaView style={styles.topBar}>
          <Text style={[Typography.h3, { color: '#fff' }]}>مسح رمز QR</Text>
          <Text style={[Typography.bodyMd, { color: 'rgba(255,255,255,0.7)' }]}>
            وجّه الكاميرا نحو رمز الحجز
          </Text>
        </SafeAreaView>

        {/* Viewfinder */}
        <View style={styles.viewfinderWrapper}>
          <View style={styles.viewfinder}>
            {/* Corner marks */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Scan line */}
            {scanState === 'idle' && (
              <Animated.View
                style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
              />
            )}

            {/* Loading state */}
            {scanState === 'loading' && (
              <View style={styles.scanStateOverlay}>
                <Text style={{ fontSize: 40 }}>⏳</Text>
                <Text style={[Typography.labelLg, { color: '#fff', marginTop: Spacing.md }]}>جاري التحقق...</Text>
              </View>
            )}
          </View>
        </View>

        <LinearGradient colors={['transparent', 'rgba(10,14,26,0.9)']} style={styles.bottomGradient} />
      </View>

      {/* Success Sheet */}
      {scanState === 'success' && confirmedBooking && (
        <View style={styles.resultSheet}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} />
          <View style={styles.resultContent}>
            <View style={[styles.resultIcon, { backgroundColor: Colors.successBg }]}>
              <Text style={{ fontSize: 40 }}>✅</Text>
            </View>
            <Text style={[Typography.h2, { color: Colors.success, marginTop: Spacing.lg }]}>تم التأكيد!</Text>

            <GlassCard style={styles.bookingCard}>
              <BookingDetail icon="👤" label="اللاعب"  value={confirmedBooking.user?.name ?? '—'} />
              <BookingDetail icon="📅" label="التاريخ" value={confirmedBooking.date} />
              <BookingDetail icon="🕐" label="الوقت"   value={`${confirmedBooking.startTime} – ${confirmedBooking.endTime}`} />
              <BookingDetail icon="💵" label="السعر"   value={`${confirmedBooking.price} ر.س`} />
              <BookingDetail icon="💳" label="الدفع"   value={confirmedBooking.paymentMethod === 'cash' ? 'كاش' : confirmedBooking.paymentMethod} />
            </GlassCard>

            <TouchableOpacity onPress={resetScanner} style={styles.scanAgainBtn}>
              <LinearGradient colors={Colors.brand.gradient} style={styles.scanAgainGrad}>
                <Text style={[Typography.labelLg, { color: '#fff' }]}>مسح حجز آخر</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Error Sheet */}
      {scanState === 'error' && (
        <View style={styles.resultSheet}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} />
          <View style={styles.resultContent}>
            <View style={[styles.resultIcon, { backgroundColor: Colors.errorBg }]}>
              <Text style={{ fontSize: 40 }}>❌</Text>
            </View>
            <Text style={[Typography.h2, { color: Colors.error, marginTop: Spacing.lg }]}>فشل التأكيد</Text>
            <Text style={[Typography.bodyMd, { color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing.sm }]}>
              {errorMsg}
            </Text>
            <TouchableOpacity onPress={resetScanner} style={[styles.scanAgainBtn, { marginTop: Spacing.xl }]}>
              <View style={[styles.scanAgainGrad, { backgroundColor: Colors.glass.medium }]}>
                <Text style={[Typography.labelLg, { color: Colors.text.primary }]}>حاول مجدداً</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function BookingDetail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
      <Text style={[Typography.bodyMd, { color: Colors.text.tertiary }]}>{icon} {label}</Text>
      <Text style={[Typography.labelMd, { color: Colors.text.primary }]}>{value}</Text>
    </View>
  );
}

const VIEWFINDER_SIZE = 240;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.primary },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 160 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 60 },
  viewfinderWrapper: { alignItems: 'center', justifyContent: 'center' },
  viewfinder: {
    width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: Colors.brand.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 4 },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: Colors.brand.primary,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6,
  },
  scanStateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,14,26,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  permBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary + '18',
  },
  resultSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden',
    borderTopWidth: 1, borderTopColor: Colors.glass.border,
    maxHeight: '80%',
  },
  resultContent: { padding: Spacing.xl, alignItems: 'center' },
  resultIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  bookingCard: { width: '100%', padding: Spacing.lg, marginTop: Spacing.xl },
  scanAgainBtn: { width: '100%', marginTop: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden' },
  scanAgainGrad: { paddingVertical: 16, alignItems: 'center' },
});
