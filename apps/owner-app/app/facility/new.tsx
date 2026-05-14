import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, Switch, Modal, FlatList, Image, ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { facilitiesApi } from '../../src/api/facilities.api';
import { GlassCard } from '../../src/components/GlassCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const SPORTS_LIST = [
  { key: 'football',   label: 'كرة القدم',   emoji: '⚽' },
  { key: 'basketball', label: 'كرة السلة',   emoji: '🏀' },
  { key: 'tennis',     label: 'تنس',          emoji: '🎾' },
  { key: 'volleyball', label: 'كرة الطائرة', emoji: '🏐' },
  { key: 'padel',      label: 'بادل',         emoji: '🏓' },
  { key: 'squash',     label: 'إسكواش',       emoji: '🎱' },
];

// Starts from Saturday per regional convention
const DAYS = [
  { key: 'saturday',  label: 'السبت' },
  { key: 'sunday',    label: 'الأحد' },
  { key: 'monday',    label: 'الاثنين' },
  { key: 'tuesday',   label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday',  label: 'الخميس' },
  { key: 'friday',    label: 'الجمعة' },
];

// 30-minute intervals in 12-hour display, stored as 24h internally
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const period = h < 12 ? 'ص' : 'م';
  return {
    time24: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    label:  `${h12}:${String(m).padStart(2, '0')} ${period}`,
  };
});

const DEFAULT_HOURS = DAYS.reduce(
  (acc, d) => ({ ...acc, [d.key]: { open: '06:00', close: '23:00', isClosed: false } }),
  {} as Record<string, { open: string; close: string; isClosed: boolean }>,
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const to12h = (time24: string) => {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${h < 12 ? 'ص' : 'م'}`;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type TimePickerTarget =
  | 'morningFrom' | 'morningTo'
  | 'eveningFrom' | 'eveningTo'
  | `hours_${string}_open` | `hours_${string}_close`;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NewFacilityScreen() {
  const qc = useQueryClient();

  // Basic info
  const [name, setName]               = useState('');
  const [address, setAddress]         = useState('');
  const [description, setDescription] = useState('');
  const [slotDuration, setSlotDuration] = useState('60');
  const [sports, setSports]           = useState<string[]>([]);

  // Facility images (up to 6, uploaded on save)
  const [images, setImages]             = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  // QR image (stored as local URI; uploaded to server on save)
  const [qrUri, setQrUri]         = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Pricing
  const [morningEnabled, setMorningEnabled] = useState(true);
  const [morningFrom,    setMorningFrom]    = useState('06:00');
  const [morningTo,      setMorningTo]      = useState('14:00');
  const [morningPrice,   setMorningPrice]   = useState('');
  const [morningDeposit, setMorningDeposit] = useState('');

  const [eveningEnabled, setEveningEnabled] = useState(true);
  const [eveningFrom,    setEveningFrom]    = useState('14:00');
  const [eveningTo,      setEveningTo]      = useState('23:00');
  const [eveningPrice,   setEveningPrice]   = useState('');
  const [eveningDeposit, setEveningDeposit] = useState('');

  // Location
  const [coords, setCoords]               = useState<{ lat: number; lon: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Working hours
  const [hours, setHours] = useState(DEFAULT_HOURS);

  // Time picker modal
  const [pickerVisible, setPickerVisible]   = useState(false);
  const [pickerTarget,  setPickerTarget]    = useState<TimePickerTarget | null>(null);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (dto: any) => facilitiesApi.create(dto),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-facilities'] });
      router.back();
    },
    onError: (err: any) =>
      Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر حفظ الملعب'),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const pickFacilityImages = async () => {
    if (images.length >= 6) {
      Alert.alert('', 'الحد الأقصى 6 صور');
      return;
    }
    setImagesLoading(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('الإذن مرفوض', 'يرجى السماح بالوصول إلى معرض الصور');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 6 - images.length,
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.map((a) => a.uri);
        setImages((prev) => [...prev, ...uris].slice(0, 6));
      }
    } finally {
      setImagesLoading(false);
    }
  };

  const removeFacilityImage = (index: number) =>
    setImages((prev) => prev.filter((_, i) => i !== index));

  const pickQrImage = async () => {
    setQrLoading(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('الإذن مرفوض', 'يرجى السماح بالوصول إلى معرض الصور');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setQrUri(result.assets[0].uri);
      }
    } finally {
      setQrLoading(false);
    }
  };

  const handleUseMyLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('الإذن مرفوض', 'يرجى السماح بالوصول إلى موقعك الجغرافي');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch {
      Alert.alert('خطأ', 'تعذّر الحصول على موقعك الجغرافي');
    } finally {
      setLocationLoading(false);
    }
  };

  const openPicker = useCallback((target: TimePickerTarget) => {
    setPickerTarget(target);
    setPickerVisible(true);
  }, []);

  const onPickTime = useCallback((time24: string) => {
    if (!pickerTarget) return;
    if (pickerTarget === 'morningFrom')  setMorningFrom(time24);
    else if (pickerTarget === 'morningTo')   setMorningTo(time24);
    else if (pickerTarget === 'eveningFrom') setEveningFrom(time24);
    else if (pickerTarget === 'eveningTo')   setEveningTo(time24);
    else {
      // hours_{day}_{open|close}
      const [, day, field] = pickerTarget.split('_');
      setHours((prev) => ({
        ...prev,
        [day]: { ...prev[day], [field]: time24 },
      }));
    }
    setPickerVisible(false);
  }, [pickerTarget]);

  const toggleSport = (s: string) =>
    setSports((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSave = async () => {
    if (!name.trim())    { Alert.alert('', 'اسم الملعب مطلوب');  return; }
    if (!address.trim()) { Alert.alert('', 'العنوان مطلوب');      return; }
    if (sports.length === 0) { Alert.alert('', 'اختر رياضة واحدة على الأقل'); return; }

    const pricingSchedule: { label: string; from: string; to: string; price: number; deposit?: number }[] = [];
    let defaultPrice = 0;

    if (morningEnabled) {
      const p = Number(morningPrice);
      if (!p || p <= 0) { Alert.alert('', 'أدخل سعر الفترة الصباحية'); return; }
      const d = Number(morningDeposit);
      pricingSchedule.push({ label: 'morning', from: morningFrom, to: morningTo, price: p, ...(d > 0 ? { deposit: d } : {}) });
      defaultPrice = p;
    }
    if (eveningEnabled) {
      const p = Number(eveningPrice);
      if (!p || p <= 0) { Alert.alert('', 'أدخل سعر الفترة المسائية'); return; }
      const d = Number(eveningDeposit);
      pricingSchedule.push({ label: 'evening', from: eveningFrom, to: eveningTo, price: p, ...(d > 0 ? { deposit: d } : {}) });
      if (!defaultPrice) defaultPrice = p;
    }
    if (pricingSchedule.length === 0) {
      Alert.alert('', 'فعّل فترة تسعيرة واحدة على الأقل'); return;
    }

    // Upload facility images first
    let uploadedImages: string[] = [];
    if (images.length > 0) {
      const BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? '';
      const results = await Promise.allSettled(
        images.map((uri) => facilitiesApi.uploadImage(uri)),
      );
      uploadedImages = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => `${BASE}${r.value.data.data.url}`);
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0)
        Alert.alert('تنبيه', `تعذّر رفع ${failed} صورة، ستُضاف الباقي`);
    }

    // Upload QR image
    let shamCashQrUrl: string | undefined;
    if (qrUri) {
      try {
        const BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? '';
        const { data } = await facilitiesApi.uploadQr(qrUri);
        shamCashQrUrl = `${BASE}${data.data.url}`;
      } catch {
        Alert.alert('خطأ', 'تعذّر رفع صورة QR، يمكنك إضافتها لاحقاً من شاشة التعديل');
      }
    }

    const operatingHours: Record<string, { open: string; close: string } | null> = {};
    for (const [day, val] of Object.entries(hours)) {
      operatingHours[day] = val.isClosed ? null : { open: val.open, close: val.close };
    }

    const dto: any = {
      name:                name.trim(),
      address:             address.trim(),
      description:         description.trim() || undefined,
      images:              uploadedImages,
      shamCashQr:          shamCashQrUrl,
      pricePerSlot:        defaultPrice,
      pricingSchedule,
      slotDurationMinutes: Number(slotDuration),
      sports,
      operatingHours,
    };

    if (coords) {
      dto.location = { type: 'Point', coordinates: [coords.lon, coords.lat] };
    }

    saveMutation.mutate(dto);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
          </TouchableOpacity>
          <Text style={[Typography.h3, { color: Colors.text.primary }]}>ملعب جديد</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── المعلومات الأساسية ─────────────────────────────────── */}
          <SectionTitle title="المعلومات الأساسية" />
          <GlassCard style={styles.card}>
            <Field label="اسم الملعب *" value={name} onChangeText={setName} placeholder="مثال: ملعب الفردوس" />
            <Divider />
            <Field label="العنوان *" value={address} onChangeText={setAddress} placeholder="الحي، المدينة" />
            <Divider />
            <Field label="وصف الملعب" value={description} onChangeText={setDescription} placeholder="وصف مختصر عن الملعب..." multiline />
          </GlassCard>

          {/* ── صور الملعب ────────────────────────────────────────── */}
          <SectionTitle title={`صور الملعب (${images.length}/6)`} />
          <GlassCard style={styles.card}>
            <View style={styles.imagesGrid}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.imageThumbnailWrap}>
                  <Image source={{ uri }} style={styles.imageThumbnail} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.imageRemoveBtn}
                    onPress={() => removeFacilityImage(idx)}
                  >
                    <Text style={styles.imageRemoveBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 6 && (
                <TouchableOpacity
                  style={styles.imageAddBtn}
                  onPress={pickFacilityImages}
                  disabled={imagesLoading}
                >
                  {imagesLoading
                    ? <ActivityIndicator color={Colors.brand.primary} />
                    : <>
                        <Text style={styles.imageAddIcon}>📸</Text>
                        <Text style={styles.imageAddLabel}>
                          {images.length === 0 ? 'أضف صوراً' : 'أضف المزيد'}
                        </Text>
                      </>
                  }
                </TouchableOpacity>
              )}
            </View>
            <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }}>
              <Text style={styles.imagesHint}>الحد الأقصى 6 صور · JPG أو PNG · حجم أقصى 8 ميغا للصورة</Text>
            </View>
          </GlassCard>

          {/* ── QR شام كاش ────────────────────────────────────────── */}
          <SectionTitle title="QR شام كاش" />
          <GlassCard style={styles.card}>
            <View style={styles.qrSection}>
              {qrUri ? (
                <View style={styles.qrPreviewWrap}>
                  <Image source={{ uri: qrUri }} style={styles.qrPreview} resizeMode="contain" />
                  <TouchableOpacity style={styles.qrChangeBtn} onPress={pickQrImage}>
                    <Text style={styles.qrChangeBtnText}>تغيير الصورة</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.qrPickBtn} onPress={pickQrImage} disabled={qrLoading}>
                  {qrLoading
                    ? <ActivityIndicator color={Colors.brand.primary} />
                    : <>
                        <Text style={styles.qrPickIcon}>📷</Text>
                        <Text style={styles.qrPickLabel}>ارفع صورة QR شام كاش</Text>
                        <Text style={styles.qrPickHint}>اضغط لاختيار صورة من المعرض</Text>
                      </>
                  }
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>

          {/* ── التسعيرة ──────────────────────────────────────────── */}
          <SectionTitle title="التسعيرة" />
          <GlassCard style={styles.card}>
            {/* صباحي */}
            <View style={styles.pricingHeader}>
              <Switch
                value={morningEnabled}
                onValueChange={setMorningEnabled}
                trackColor={{ true: Colors.brand.primary + '66', false: Colors.glass.border }}
                thumbColor={morningEnabled ? Colors.brand.primary : Colors.text.tertiary}
              />
              <Text style={styles.pricingLabel}>🌅 فترة صباحية</Text>
            </View>
            {morningEnabled && (
              <View style={styles.pricingBody}>
                <View style={styles.timeRangeRow}>
                  <Text style={styles.timeRangeLabel}>من</Text>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker('morningFrom')}>
                    <Text style={styles.timeBtnText}>{to12h(morningFrom)}</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeRangeLabel}>إلى</Text>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker('morningTo')}>
                    <Text style={styles.timeBtnText}>{to12h(morningTo)}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.priceInputWrap}>
                  <TextInput
                    value={morningPrice}
                    onChangeText={setMorningPrice}
                    placeholder="السعر (ل.س)"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    style={styles.priceInput}
                    textAlign="right"
                  />
                  <Text style={styles.priceUnit}>ل.س / حصة</Text>
                </View>
                <View style={styles.priceInputWrap}>
                  <TextInput
                    value={morningDeposit}
                    onChangeText={setMorningDeposit}
                    placeholder="العربون (اختياري)"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    style={[styles.priceInput, styles.depositInput]}
                    textAlign="right"
                  />
                  <Text style={styles.priceUnit}>ل.س عربون</Text>
                </View>
              </View>
            )}

            <Divider />

            {/* مسائي */}
            <View style={styles.pricingHeader}>
              <Switch
                value={eveningEnabled}
                onValueChange={setEveningEnabled}
                trackColor={{ true: Colors.brand.primary + '66', false: Colors.glass.border }}
                thumbColor={eveningEnabled ? Colors.brand.primary : Colors.text.tertiary}
              />
              <Text style={styles.pricingLabel}>🌆 فترة مسائية</Text>
            </View>
            {eveningEnabled && (
              <View style={styles.pricingBody}>
                <View style={styles.timeRangeRow}>
                  <Text style={styles.timeRangeLabel}>من</Text>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker('eveningFrom')}>
                    <Text style={styles.timeBtnText}>{to12h(eveningFrom)}</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeRangeLabel}>إلى</Text>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker('eveningTo')}>
                    <Text style={styles.timeBtnText}>{to12h(eveningTo)}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.priceInputWrap}>
                  <TextInput
                    value={eveningPrice}
                    onChangeText={setEveningPrice}
                    placeholder="السعر (ل.س)"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    style={styles.priceInput}
                    textAlign="right"
                  />
                  <Text style={styles.priceUnit}>ل.س / حصة</Text>
                </View>
                <View style={styles.priceInputWrap}>
                  <TextInput
                    value={eveningDeposit}
                    onChangeText={setEveningDeposit}
                    placeholder="العربون (اختياري)"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    style={[styles.priceInput, styles.depositInput]}
                    textAlign="right"
                  />
                  <Text style={styles.priceUnit}>ل.س عربون</Text>
                </View>
              </View>
            )}
          </GlassCard>

          {/* ── مدة الحصة ─────────────────────────────────────────── */}
          <SectionTitle title="مدة الحصة" />
          <GlassCard style={styles.card}>
            <View style={styles.durationRow}>
              {['30', '60', '90', '120'].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setSlotDuration(d)}
                  style={[styles.durationChip, slotDuration === d && styles.durationChipActive]}
                >
                  <Text style={[
                    styles.durationChipText,
                    { color: slotDuration === d ? Colors.brand.primary : Colors.text.tertiary },
                  ]}>
                    {d} د
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* ── الرياضات ──────────────────────────────────────────── */}
          <SectionTitle title="الرياضات المتاحة *" />
          <View style={styles.sportsGrid}>
            {SPORTS_LIST.map((s) => {
              const selected = sports.includes(s.key);
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => toggleSport(s.key)}
                  style={[styles.sportChip, selected && styles.sportChipActive]}
                >
                  <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                  <Text style={[styles.sportChipText, { color: selected ? Colors.brand.primary : Colors.text.secondary }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── الموقع الجغرافي ───────────────────────────────────── */}
          <SectionTitle title="الموقع الجغرافي" />
          <GlassCard style={styles.card}>
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={handleUseMyLocation}
              disabled={locationLoading}
            >
              {locationLoading
                ? <ActivityIndicator size="small" color={Colors.brand.primary} />
                : <Text style={styles.locationBtnIcon}>📍</Text>
              }
              <Text style={styles.locationBtnText}>
                {locationLoading ? 'جاري تحديد موقعك...' : 'استخدم موقعي الحالي'}
              </Text>
            </TouchableOpacity>

            {coords && (
              <>
                <Divider />
                <View style={styles.coordsCard}>
                  <Text style={styles.coordsTitle}>✅ تم تحديد الموقع</Text>
                  <View style={styles.coordsRow}>
                    <View style={styles.coordItem}>
                      <Text style={styles.coordLabel}>خط العرض</Text>
                      <Text style={styles.coordValue}>{coords.lat.toFixed(6)}</Text>
                    </View>
                    <View style={styles.coordDivider} />
                    <View style={styles.coordItem}>
                      <Text style={styles.coordLabel}>خط الطول</Text>
                      <Text style={styles.coordValue}>{coords.lon.toFixed(6)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setCoords(null)} style={styles.coordsClear}>
                    <Text style={styles.coordsClearText}>حذف الموقع</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!coords && (
              <>
                <Divider />
                <View style={styles.locationHint}>
                  <Text style={styles.locationHintText}>
                    اضغط الزر أعلاه لتحديد موقع الملعب تلقائياً من موقعك الحالي
                  </Text>
                </View>
              </>
            )}
          </GlassCard>

          {/* ── ساعات العمل ───────────────────────────────────────── */}
          <SectionTitle title="ساعات العمل" />
          <GlassCard style={styles.card}>
            {DAYS.map((day, i) => (
              <View key={day.key}>
                {i > 0 && <Divider />}
                <View style={styles.hourRow}>
                  <Switch
                    value={!hours[day.key]?.isClosed}
                    onValueChange={(v) =>
                      setHours((prev) => ({ ...prev, [day.key]: { ...prev[day.key], isClosed: !v } }))
                    }
                    trackColor={{ true: Colors.brand.primary + '66', false: Colors.glass.border }}
                    thumbColor={!hours[day.key]?.isClosed ? Colors.brand.primary : Colors.text.tertiary}
                  />
                  <Text style={styles.dayLabel}>{day.label}</Text>

                  {!hours[day.key]?.isClosed ? (
                    <View style={styles.dayTimeRow}>
                      <TouchableOpacity
                        style={styles.timeBtn}
                        onPress={() => openPicker(`hours_${day.key}_open`)}
                      >
                        <Text style={styles.timeBtnText}>{to12h(hours[day.key].open)}</Text>
                      </TouchableOpacity>
                      <Text style={styles.timeSep}>–</Text>
                      <TouchableOpacity
                        style={styles.timeBtn}
                        onPress={() => openPicker(`hours_${day.key}_close`)}
                      >
                        <Text style={styles.timeBtnText}>{to12h(hours[day.key].close)}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.closedBadge}>
                      <Text style={styles.closedBadgeText}>مغلق</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </GlassCard>

          <PrimaryButton
            label={saveMutation.isPending ? 'جاري الحفظ...' : 'إضافة الملعب'}
            onPress={handleSave}
            loading={saveMutation.isPending}
            style={{ marginTop: Spacing.xl }}
          />
        </ScrollView>
      </SafeAreaView>

      {/* ── Time Picker Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>اختر الوقت</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <Text style={styles.pickerClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={TIME_OPTIONS}
            keyExtractor={(item) => item.time24}
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={TIME_OPTIONS.findIndex(
              (t) => t.time24 === (pickerTarget === 'morningFrom' ? morningFrom
                : pickerTarget === 'morningTo'   ? morningTo
                : pickerTarget === 'eveningFrom' ? eveningFrom
                : pickerTarget === 'eveningTo'   ? eveningTo
                : pickerTarget?.startsWith('hours_')
                  ? hours[pickerTarget.split('_')[1]]?.[pickerTarget.split('_')[2] as 'open' | 'close']
                  : '06:00')
            ) || 0}
            getItemLayout={(_, index) => ({ length: 52, offset: 52 * index, index })}
            renderItem={({ item }) => {
              const current =
                pickerTarget === 'morningFrom' ? morningFrom
                : pickerTarget === 'morningTo'   ? morningTo
                : pickerTarget === 'eveningFrom' ? eveningFrom
                : pickerTarget === 'eveningTo'   ? eveningTo
                : pickerTarget?.startsWith('hours_')
                  ? hours[pickerTarget.split('_')[1]]?.[pickerTarget.split('_')[2] as 'open' | 'close']
                  : null;
              const isSelected = item.time24 === current;
              return (
                <TouchableOpacity
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                  onPress={() => onPickTime(item.time24)}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                    {item.label}
                  </Text>
                  {isSelected && <Text style={styles.pickerCheck}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <Text style={[Typography.h3, styles.sectionTitle]}>{title}</Text>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.glass.border }} />;
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={[styles.fieldInput, multiline && { height: 72, textAlignVertical: 'top' }]}
        textAlign="right"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  safe:      { flex: 1 },
  scroll:    { paddingHorizontal: Spacing.xl, paddingBottom: 120 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },

  sectionTitle: { color: Colors.text.primary, marginTop: Spacing.xl, marginBottom: Spacing.md },
  card:         { overflow: 'visible' },

  // Field
  field:      { padding: Spacing.lg },
  fieldLabel: { fontSize: 12, color: Colors.text.tertiary, marginBottom: 4, textAlign: 'right' },
  fieldInput: { color: Colors.text.primary, fontSize: 15, paddingVertical: 4 },

  // QR
  qrSection: { padding: Spacing.lg, alignItems: 'center' },
  qrPickBtn: {
    width: '100%', height: 140, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.glass.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.glass.subtle,
  },
  qrPickIcon:  { fontSize: 32 },
  qrPickLabel: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  qrPickHint:  { fontSize: 12, color: Colors.text.tertiary },
  qrPreviewWrap: { alignItems: 'center', gap: 12 },
  qrPreview:  { width: 160, height: 160, borderRadius: Radius.md, backgroundColor: Colors.glass.subtle },
  qrChangeBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.brand.primary,
  },
  qrChangeBtnText: { color: Colors.brand.primary, fontSize: 13, fontWeight: '600' },

  // Pricing
  pricingHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg,
  },
  pricingLabel: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, flex: 1, textAlign: 'right' },
  pricingBody:  { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  timeRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'flex-end' },
  timeRangeLabel: { fontSize: 13, color: Colors.text.secondary },
  timeBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md,
    backgroundColor: Colors.brand.primary + '15', borderWidth: 1.5,
    borderColor: Colors.brand.primary + '44',
  },
  timeBtnText:  { fontSize: 14, fontWeight: '700', color: Colors.brand.primary },
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    justifyContent: 'flex-end',
  },
  priceInput: {
    flex: 1, height: 44, borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.glass.border, paddingHorizontal: Spacing.md,
    color: Colors.text.primary, fontSize: 15,
    backgroundColor: Colors.glass.subtle,
  },
  priceUnit:    { fontSize: 13, color: Colors.text.tertiary, minWidth: 60 },
  depositInput: { borderColor: Colors.warning + '66', borderStyle: 'dashed' },

  // Duration
  durationRow: {
    flexDirection: 'row', gap: 10, padding: Spacing.lg,
    justifyContent: 'center',
  },
  durationChip: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.glass.border,
    backgroundColor: Colors.glass.subtle, alignItems: 'center',
  },
  durationChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary + '15' },
  durationChipText:   { fontSize: 13, fontWeight: '600' },

  // Sports
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.sm },
  sportChip:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.glass.subtle,
    flex: 1, minWidth: '45%',
  },
  sportChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary + '15' },
  sportChipText:   { fontSize: 13, fontWeight: '500' },

  // Location
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, justifyContent: 'center',
  },
  locationBtnIcon: { fontSize: 20 },
  locationBtnText: { fontSize: 15, fontWeight: '600', color: Colors.brand.primary },
  locationHint:    { padding: Spacing.lg },
  locationHintText: { fontSize: 13, color: Colors.text.tertiary, textAlign: 'center' },
  coordsCard:  { padding: Spacing.lg, gap: Spacing.md },
  coordsTitle: { fontSize: 14, fontWeight: '700', color: '#22c55e', textAlign: 'center' },
  coordsRow:   { flexDirection: 'row', alignItems: 'center' },
  coordItem:   { flex: 1, alignItems: 'center', gap: 4 },
  coordLabel:  { fontSize: 11, color: Colors.text.tertiary },
  coordValue:  { fontSize: 13, fontWeight: '600', color: Colors.text.primary },
  coordDivider: { width: 1, height: 32, backgroundColor: Colors.glass.border },
  coordsClear:  { alignItems: 'center', paddingTop: 4 },
  coordsClearText: { fontSize: 12, color: Colors.text.tertiary },

  // Hours
  hourRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  dayLabel:   { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text.primary, textAlign: 'right' },
  dayTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeSep:    { color: Colors.text.tertiary, fontSize: 14 },
  closedBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.sm, backgroundColor: Colors.glass.subtle,
  },
  closedBadgeText: { fontSize: 12, color: Colors.text.tertiary },

  // Time Picker Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '55%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  pickerClose: { fontSize: 18, color: Colors.text.tertiary, padding: 4 },
  pickerList:  { flexGrow: 0 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, height: 52,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border + '80',
  },
  pickerItemActive:     { backgroundColor: Colors.brand.primary + '12' },
  pickerItemText:       { fontSize: 16, color: Colors.text.secondary },
  pickerItemTextActive: { color: Colors.brand.primary, fontWeight: '700' },
  pickerCheck:          { fontSize: 16, color: Colors.brand.primary, fontWeight: '700' },

  // Facility Images
  imagesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    padding: Spacing.lg, paddingBottom: Spacing.md,
  },
  imageThumbnailWrap: {
    width: 96, height: 96, borderRadius: Radius.md, overflow: 'hidden',
    position: 'relative',
  },
  imageThumbnail: { width: '100%', height: '100%' },
  imageRemoveBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  imageRemoveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', lineHeight: 14 },
  imageAddBtn: {
    width: 96, height: 96, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.brand.primary + '55', borderStyle: 'dashed',
    backgroundColor: Colors.brand.primary + '08',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  imageAddIcon:  { fontSize: 24 },
  imageAddLabel: { fontSize: 11, color: Colors.brand.primary, fontWeight: '600', textAlign: 'center' },
  imagesHint: {
    fontSize: 12, color: Colors.text.tertiary,
    textAlign: 'center', paddingBottom: Spacing.sm,
  },
});
