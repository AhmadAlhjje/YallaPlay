import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../../src/api/bookings.api';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { formatTimeRange } from '../../src/lib/time';

type ScanState = 'idle' | 'loading' | 'success' | 'error';

export default function ScannerTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState]       = useState<ScanState>('idle');
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [errorMsg, setErrorMsg]         = useState('');
  const scanLockRef                     = useRef(false);
  const scanLineAnim                    = useRef(new Animated.Value(0)).current;
  const qc                              = useQueryClient();

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
      setConfirmedBooking(res.data.data);
      setScanState('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['pending-bookings'] });
      qc.invalidateQueries({ queryKey: ['owner-bookings'] });
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message ?? 'رمز غير صحيح أو منتهي الصلاحية');
      setScanState('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanLockRef.current || scanState !== 'idle') return;
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
        <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>جاري التحقق من الكاميرا...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: Colors.background.primary }]}>
        <SafeAreaView style={{ alignItems: 'center', paddingHorizontal: Spacing.xl }}>
          <Text style={{ fontSize: 64, marginBottom: Spacing.xl }}>📷</Text>
          <Text style={[Typography.h2, { color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.md }]}>
            الكاميرا مطلوبة
          </Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing.xl }]}>
            نحتاج إذن الكاميرا لمسح رموز QR الخاصة بالحجوزات
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
            <Text style={[Typography.labelLg, { color: '#fff' }]}>السماح بالكاميرا</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 220],
  });

  // Show result screens on white background
  if (scanState === 'success' && confirmedBooking) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background.primary }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.resultPage}>
            <View style={[styles.resultIconCircle, { backgroundColor: Colors.successBg, borderColor: Colors.success + '44' }]}>
              <Text style={{ fontSize: 52 }}>✅</Text>
            </View>
            <Text style={[Typography.h1, { color: Colors.success, marginTop: Spacing.xl, textAlign: 'center' }]}>
              تم التأكيد بنجاح!
            </Text>
            <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center', marginTop: 4 }]}>
              تم تأكيد الحجز وإشعار اللاعب
            </Text>

            <View style={styles.bookingCard}>
              <BookingRow icon="👤" label="اللاعب"  value={confirmedBooking.user?.name ?? '—'} />
              <BookingRow icon="📱" label="الجوال"  value={confirmedBooking.user?.phone ?? '—'} />
              <BookingRow icon="📅" label="التاريخ" value={confirmedBooking.date ?? '—'} />
              <BookingRow icon="🕐" label="الوقت"   value={formatTimeRange(confirmedBooking.startTime ?? '', confirmedBooking.endTime ?? '')} />
              <BookingRow icon="💰" label="المبلغ"  value={`${confirmedBooking.price ?? 0} ل.س`} last />
            </View>

            <TouchableOpacity onPress={resetScanner} style={styles.scanAgainBtn}>
              <Text style={[Typography.labelLg, { color: '#fff' }]}>📱 مسح حجز آخر</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (scanState === 'error') {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background.primary }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.resultPage}>
            <View style={[styles.resultIconCircle, { backgroundColor: Colors.errorBg, borderColor: Colors.error + '44' }]}>
              <Text style={{ fontSize: 52 }}>❌</Text>
            </View>
            <Text style={[Typography.h1, { color: Colors.error, marginTop: Spacing.xl, textAlign: 'center' }]}>
              فشل التأكيد
            </Text>
            <Text style={[Typography.bodyMd, { color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl }]}>
              {errorMsg}
            </Text>
            <TouchableOpacity onPress={resetScanner} style={[styles.scanAgainBtn, { backgroundColor: Colors.glass.medium }]}>
              <Text style={[Typography.labelLg, { color: Colors.text.primary }]}>حاول مجدداً</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanState === 'idle' ? handleBarCodeScanned : undefined}
      />

      {/* Dark overlay */}
      <View style={styles.overlay}>
        <LinearGradient colors={['rgba(0,0,0,0.75)', 'transparent']} style={styles.topGradient} />

        <SafeAreaView style={styles.topBar}>
          <Text style={[Typography.h3, { color: '#fff', textAlign: 'center' }]}>مسح رمز QR</Text>
          <Text style={[Typography.bodyMd, { color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 4 }]}>
            وجّه الكاميرا نحو رمز الحجز
          </Text>
        </SafeAreaView>

        {/* Viewfinder */}
        <View style={styles.viewfinderWrapper}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {scanState === 'idle' && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
            )}

            {scanState === 'loading' && (
              <View style={styles.loadingOverlay}>
                <Text style={{ fontSize: 40 }}>⏳</Text>
                <Text style={[Typography.labelLg, { color: '#fff', marginTop: Spacing.md }]}>جاري التحقق...</Text>
              </View>
            )}
          </View>
        </View>

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.bottomGradient} />
      </View>
    </View>
  );
}

function BookingRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.bookingRow, !last && { borderBottomWidth: 1, borderBottomColor: Colors.glass.border }]}>
      <Text style={[Typography.bodyMd, { color: Colors.text.tertiary }]}>{icon}  {label}</Text>
      <Text style={[Typography.labelMd, { color: Colors.text.primary }]}>{value}</Text>
    </View>
  );
}

const VIEWFINDER_SIZE = 240;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center:    { alignItems: 'center', justifyContent: 'center' },
  overlay:   { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  topGradient:    { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl },
  viewfinderWrapper: { alignItems: 'center', justifyContent: 'center' },
  viewfinder: {
    width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE,
    backgroundColor: 'transparent', overflow: 'hidden',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: Colors.brand.primary,
  },
  cornerTL: { top: 0,    left: 0,   borderTopWidth: CORNER_WIDTH,    borderLeftWidth: CORNER_WIDTH,  borderTopLeftRadius: 4 },
  cornerTR: { top: 0,    right: 0,  borderTopWidth: CORNER_WIDTH,    borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0,   borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,  borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0,  borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 4 },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: Colors.brand.primary,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  permBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
  },
  resultPage: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl,
  },
  resultIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  bookingCard: {
    width: '100%', marginTop: Spacing.xl,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.glass.border,
    overflow: 'hidden',
  },
  bookingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  scanAgainBtn: {
    width: '100%', marginTop: Spacing.xl,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg, paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
