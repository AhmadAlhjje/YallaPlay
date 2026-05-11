import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { facilitiesApi } from '../../src/api/facilities.api';
import { GlassCard } from '../../src/components/GlassCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const SPORTS_LIST = [
  { key: 'football',   label: 'كرة القدم',   emoji: '⚽' },
  { key: 'basketball', label: 'كرة السلة',   emoji: '🏀' },
  { key: 'tennis',     label: 'تنس',          emoji: '🎾' },
  { key: 'volleyball', label: 'كرة الطائرة', emoji: '🏐' },
  { key: 'padel',      label: 'بادل',         emoji: '🏓' },
  { key: 'squash',     label: 'إسكواش',       emoji: '🎱' },
];

const DAYS = [
  { key: 'monday',    label: 'الاثنين' },
  { key: 'tuesday',   label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday',  label: 'الخميس' },
  { key: 'friday',    label: 'الجمعة' },
  { key: 'saturday',  label: 'السبت' },
  { key: 'sunday',    label: 'الأحد' },
];

const DEFAULT_HOURS = DAYS.reduce((acc, d) => ({
  ...acc,
  [d.key]: { open: '06:00', close: '23:00', isClosed: false },
}), {} as Record<string, { open: string; close: string; isClosed: boolean }>);

export default function FacilityEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const [name, setName]               = useState('');
  const [address, setAddress]         = useState('');
  const [phone, setPhone]             = useState('');
  const [description, setDescription] = useState('');
  const [shamCashQr, setShamCashQr]   = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [slotDuration, setSlotDuration] = useState('60');
  const [sports, setSports]           = useState<string[]>([]);
  const [hours, setHours]             = useState(DEFAULT_HOURS);
  const [latitude, setLatitude]       = useState('');
  const [longitude, setLongitude]     = useState('');
  const [maxPlayers, setMaxPlayers]   = useState('');

  const { data: facilityRes, isLoading: facilityLoading } = useQuery({
    queryKey: ['facility', id],
    queryFn: () => facilitiesApi.getById(id),
    staleTime: 300_000,
  });

  useEffect(() => {
    const f = facilityRes?.data?.data;
    if (!f) return;
    setName(f.name ?? '');
    setAddress(f.address ?? '');
    setPhone(f.phone ?? '');
    setShamCashQr(f.shamCashQr ?? '');
    setDescription(f.description ?? '');
    setPricePerHour(String(f.pricePerSlot ?? f.pricePerHour ?? ''));
    setSlotDuration(String(f.slotDurationMinutes ?? 60));
    setSports(f.sports ?? f.sport ?? []);
    if (f.operatingHours) {
      const mapped = { ...DEFAULT_HOURS };
      for (const [day, val] of Object.entries(f.operatingHours)) {
        mapped[day] = val === null
          ? { open: '06:00', close: '23:00', isClosed: true }
          : { open: (val as any).open, close: (val as any).close, isClosed: false };
      }
      setHours(mapped);
    }
    if (f.location?.coordinates) {
      setLongitude(String(f.location.coordinates[0]));
      setLatitude(String(f.location.coordinates[1]));
    }
  }, [facilityRes]);

  const saveMutation = useMutation({
    mutationFn: (dto: any) => facilitiesApi.update(id, dto),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-facilities'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر الحفظ'),
  });

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('', 'اسم الملعب مطلوب'); return; }
    if (!address.trim()) { Alert.alert('', 'العنوان مطلوب'); return; }
    if (!pricePerHour || isNaN(Number(pricePerHour))) { Alert.alert('', 'السعر غير صحيح'); return; }
    if (sports.length === 0) { Alert.alert('', 'اختر رياضة واحدة على الأقل'); return; }

    // Transform hours: isClosed:true → null (as backend expects)
    const operatingHours: Record<string, { open: string; close: string } | null> = {};
    for (const [day, val] of Object.entries(hours)) {
      operatingHours[day] = val.isClosed ? null : { open: val.open, close: val.close };
    }

    const dto: any = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim() || undefined,
      shamCashQr: shamCashQr.trim() || undefined,
      description: description.trim() || undefined,
      pricePerSlot: Number(pricePerHour),
      slotDurationMinutes: Number(slotDuration),
      sports,
      operatingHours,
    };

    if (latitude && longitude) {
      dto.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    saveMutation.mutate(dto);
  };

  const toggleSport = (s: string) =>
    setSports((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const updateHour = (day: string, field: 'open' | 'close' | 'isClosed', value: string | boolean) =>
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  if (facilityLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
          </TouchableOpacity>
          <Text style={[Typography.h3, { color: Colors.text.primary }]}>تعديل الملعب</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 120 }}>

          {/* Basic Info */}
          <SectionTitle title="المعلومات الأساسية" />
          <GlassCard style={styles.fieldCard}>
            <Field label="اسم الملعب *" value={name} onChangeText={setName} placeholder="مثال: ملعب الفردوس" />
            <Divider />
            <Field label="العنوان *" value={address} onChangeText={setAddress} placeholder="الحي، المدينة" />
            <Divider />
            <Field label="رقم الجوال" value={phone} onChangeText={setPhone} placeholder="+963XXXXXXXXX" keyboardType="phone-pad" />
            <Divider />
            <Field label="QR شام كاش" value={shamCashQr} onChangeText={setShamCashQr} placeholder="ضع نص/رابط QR" />
            <Divider />
            <Field label="وصف الملعب" value={description} onChangeText={setDescription} placeholder="وصف مختصر..." multiline />
          </GlassCard>

          {/* Pricing */}
          <SectionTitle title="التسعير والمدة" />
          <GlassCard style={styles.fieldCard}>
            <Field label="السعر لكل ساعة (ل.س) *" value={pricePerHour} onChangeText={setPricePerHour} keyboardType="numeric" placeholder="5000" />
            <Divider />
            <View style={styles.fieldRow}>
              <Text style={[Typography.labelMd, { color: Colors.text.secondary, flex: 1 }]}>مدة الوقت (دقيقة)</Text>
              <View style={styles.durationRow}>
                {['30', '60', '90', '120'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setSlotDuration(d)}
                    style={[styles.durationChip, slotDuration === d && styles.durationChipActive]}
                  >
                    <Text style={[Typography.labelSm, { color: slotDuration === d ? Colors.brand.primary : Colors.text.tertiary }]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Divider />
            <Field label="أقصى عدد لاعبين" value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="numeric" placeholder="22" />
          </GlassCard>

          {/* Sports */}
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
                  <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
                  <Text style={[Typography.labelSm, { color: selected ? Colors.brand.primary : Colors.text.secondary }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Location */}
          <SectionTitle title="الموقع الجغرافي" />
          <GlassCard style={styles.fieldCard}>
            <Field label="خط العرض (Latitude)" value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" placeholder="24.7136" />
            <Divider />
            <Field label="خط الطول (Longitude)" value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" placeholder="46.6753" />
          </GlassCard>

          {/* Operating Hours */}
          <SectionTitle title="ساعات العمل" />
          <GlassCard style={styles.fieldCard}>
            {DAYS.map((day, i) => (
              <View key={day.key}>
                {i > 0 && <Divider />}
                <View style={styles.hourRow}>
                  <Switch
                    value={!hours[day.key]?.isClosed}
                    onValueChange={(v) => updateHour(day.key, 'isClosed', !v)}
                    trackColor={{ true: Colors.brand.primary + '66', false: Colors.glass.border }}
                    thumbColor={!hours[day.key]?.isClosed ? Colors.brand.primary : Colors.text.tertiary}
                  />
                  <Text style={[Typography.labelMd, { color: Colors.text.primary, flex: 1 }]}>{day.label}</Text>
                  {!hours[day.key]?.isClosed ? (
                    <View style={styles.timeInputs}>
                      <TextInput
                        value={hours[day.key]?.open}
                        onChangeText={(v) => updateHour(day.key, 'open', v)}
                        style={styles.timeInput}
                        placeholder="06:00"
                        placeholderTextColor={Colors.text.tertiary}
                        maxLength={5}
                      />
                      <Text style={{ color: Colors.text.tertiary }}>–</Text>
                      <TextInput
                        value={hours[day.key]?.close}
                        onChangeText={(v) => updateHour(day.key, 'close', v)}
                        style={styles.timeInput}
                        placeholder="23:00"
                        placeholderTextColor={Colors.text.tertiary}
                        maxLength={5}
                      />
                    </View>
                  ) : (
                    <Text style={[Typography.labelSm, { color: Colors.text.tertiary }]}>مغلق</Text>
                  )}
                </View>
              </View>
            ))}
          </GlassCard>

          <PrimaryButton
            label={saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            onPress={handleSave}
            loading={saveMutation.isPending}
            style={{ marginTop: Spacing.xl }}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={[Typography.h3, styles.sectionTitle]}>{title}</Text>;
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.glass.border }} />;
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, multiline,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[Typography.labelSm, { color: Colors.text.tertiary, marginBottom: 4 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={[styles.textInput, multiline && { height: 72, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  center: { alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text.primary, marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  fieldCard: { overflow: 'visible' },
  field: { padding: Spacing.lg },
  textInput: {
    color: Colors.text.primary, fontSize: 15,
    textAlign: 'right', paddingVertical: 4,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, gap: Spacing.md,
  },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.sm, borderWidth: 1,
    borderColor: Colors.glass.border, backgroundColor: Colors.glass.subtle,
  },
  durationChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary + '18' },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.sm },
  sportChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.glass.subtle,
    flex: 1, minWidth: '45%',
  },
  sportChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary + '15' },
  hourRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md,
  },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: {
    color: Colors.text.primary, fontSize: 14, fontWeight: '600',
    backgroundColor: Colors.glass.subtle, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 10, paddingVertical: 6,
    width: 56, textAlign: 'center',
  },
});
