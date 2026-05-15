import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { facilitiesApi } from '../../src/api/facilities.api';
import { bookingsApi } from '../../src/api/bookings.api';
import { formatTime12h, formatTimeRange } from '../../src/lib/time';
import { GlassCard } from '../../src/components/GlassCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

// ─── Next 30 days ──────────────────────────────────────────────────────────────

function buildDateList() {
  const days: { iso: string; label: string; dayName: string; isToday: boolean }[] = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    days.push({
      iso,
      label: d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
      dayName: d.toLocaleDateString('ar-SA', { weekday: 'short' }),
      isToday: i === 0,
    });
  }
  return days;
}

const DATE_LIST = buildDateList();

const SPORT_LABELS: Record<string, string> = {
  football: 'كرة قدم ⚽', basketball: 'سلة 🏀', tennis: 'تنس 🎾',
  volleyball: 'طائرة 🏐', padel: 'بادل 🏓', squash: 'إسكواش 🎱',
  badminton: 'ريشة 🏸', swimming: 'سباحة 🏊',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AddBookingScreen() {
  const qc = useQueryClient();

  // Form state
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(DATE_LIST[0].iso);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [depositPaid, setDepositPaid] = useState('');
  const [notes, setNotes] = useState('');

  const [facilityModalOpen, setFacilityModalOpen] = useState(false);

  // Load facilities
  const { data: facilitiesRes, isLoading: facilitiesLoading } = useQuery({
    queryKey: ['owner-facilities'],
    queryFn: () => facilitiesApi.getMyFacilities(),
    staleTime: 300_000,
  });

  const facilitiesPayload = facilitiesRes?.data;
  const facilities: any[] = Array.isArray(facilitiesPayload?.data)
    ? facilitiesPayload.data
    : Array.isArray(facilitiesPayload)
      ? facilitiesPayload
      : facilitiesPayload?.facilities ?? [];

  // Auto-select first facility
  useEffect(() => {
    if (facilities.length > 0 && !selectedFacilityId) {
      const first = facilities.find(f => f.isActive !== false) ?? facilities[0];
      setSelectedFacilityId(first._id);
      if (first.sports?.length > 0) setSelectedSport(first.sports[0]);
    }
  }, [facilities.length]);

  const selectedFacility = facilities.find(f => f._id === selectedFacilityId);

  // Load slots when facility + date are chosen
  const { data: slotsRes, isLoading: slotsLoading } = useQuery({
    queryKey: ['facility-slots', selectedFacilityId, selectedDate],
    queryFn: () => facilitiesApi.getSlots(selectedFacilityId, selectedDate),
    enabled: !!selectedFacilityId && !!selectedDate,
    staleTime: 30_000,
  });

  const slots: any[] = slotsRes?.data?.data ?? [];
  const availableSlots = slots.filter(s => s.status === 'available');

  // Create booking mutation
  const createMutation = useMutation({
    mutationFn: () => bookingsApi.ownerCreate({
      facilityId: selectedFacilityId,
      date: selectedDate,
      startTime: selectedSlot!.startTime,
      sport: selectedSport || selectedFacility?.sports?.[0],
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim() || undefined,
      depositPaid: depositPaid ? Number(depositPaid) : undefined,
      notes: notes.trim() || undefined,
    }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Invalidate all relevant queries including slots so the booked slot disappears
      qc.invalidateQueries({ queryKey: ['owner-bookings'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
      qc.invalidateQueries({ queryKey: ['owner-summary'] });
      qc.invalidateQueries({ queryKey: ['facility-slots', selectedFacilityId, selectedDate] });
      // Navigate first, then alert (Alert.alert callback is unreliable on web)
      router.back();
      setTimeout(() => {
        Alert.alert('تم الحجز ✅', `تمت إضافة حجز ${guestName.trim()} بنجاح وهو مؤكد الآن.`);
      }, 300);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'تعذّرت إضافة الحجز.';
      Alert.alert('خطأ', msg);
    },
  });

  const handleSubmit = () => {
    if (!selectedFacilityId) return Alert.alert('تنبيه', 'الرجاء اختيار الملعب.');
    if (!selectedSlot) return Alert.alert('تنبيه', 'الرجاء اختيار وقت الحجز.');
    if (!guestName.trim()) return Alert.alert('تنبيه', 'الرجاء إدخال اسم الشخص.');
    createMutation.mutate();
  };


  if (facilitiesLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.brand.primary} size="large" />
      </View>
    );
  }

  if (facilities.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, textAlign: 'center' }}>🏟️</Text>
        <Text style={[Typography.h3, { color: Colors.text.primary, marginTop: Spacing.lg, textAlign: 'center' }]}>
          لا يوجد ملاعب بعد
        </Text>
        <TouchableOpacity onPress={() => router.push('/facility/new')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>+ أضف ملعبك الأول</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={[Typography.h2, { color: Colors.text.primary }]}>إضافة حجز</Text>
        <View style={{ width: 38 }} />
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Facility selector ─────────────────────────────────── */}
        <SectionLabel>الملعب</SectionLabel>
        <TouchableOpacity
          onPress={() => facilities.length > 1 && setFacilityModalOpen(true)}
          style={styles.selectorBtn}
        >
          <Text style={styles.selectorText}>
            {selectedFacility?.name ?? 'اختر الملعب'}
          </Text>
          {facilities.length > 1 && (
            <Ionicons name="chevron-down" size={16} color={Colors.text.tertiary} />
          )}
        </TouchableOpacity>

        {/* ── Date picker ───────────────────────────────────────── */}
        <SectionLabel>التاريخ</SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
        >
          {DATE_LIST.map((d) => {
            const active = selectedDate === d.iso;
            return (
              <TouchableOpacity
                key={d.iso}
                onPress={() => {
                  setSelectedDate(d.iso);
                  setSelectedSlot(null);
                }}
                style={[styles.dateChip, active && styles.dateChipActive]}
              >
                <Text style={[styles.dateDayName, active && { color: Colors.brand.primary }]}>
                  {d.dayName}
                </Text>
                <Text style={[styles.dateLabel, active && { color: Colors.brand.primary, fontWeight: '800' }]}>
                  {d.label}
                </Text>
                {d.isToday && (
                  <Text style={[styles.todayBadge, active && { color: Colors.brand.primary }]}>اليوم</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Sport selector ────────────────────────────────────── */}
        {selectedFacility?.sports?.length > 0 && (
          <>
            <SectionLabel>الرياضة</SectionLabel>
            <View style={styles.sportsRow}>
              {selectedFacility.sports.map((s: string) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSelectedSport(s)}
                  style={[styles.sportChip, selectedSport === s && styles.sportChipActive]}
                >
                  <Text style={[
                    Typography.labelSm,
                    { color: selectedSport === s ? Colors.brand.primary : Colors.text.secondary },
                  ]}>
                    {SPORT_LABELS[s] ?? s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Slot picker ───────────────────────────────────────── */}
        <View style={styles.slotSection}>
          <SectionLabel>
            الوقت{selectedSlot ? ` — ${formatTime12h(selectedSlot.startTime)} إلى ${formatTime12h(selectedSlot.endTime)}` : ''}
          </SectionLabel>
          {slotsLoading ? (
            <ActivityIndicator color={Colors.brand.primary} style={{ marginVertical: Spacing.lg }} />
          ) : availableSlots.length === 0 ? (
            <GlassCard style={styles.emptySlots}>
              <Text style={{ fontSize: 28, textAlign: 'center' }}>⏱️</Text>
              <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center', marginTop: 6 }]}>
                لا توجد أوقات متاحة في هذا اليوم
              </Text>
            </GlassCard>
          ) : (
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot) => {
                const active = selectedSlot?.startTime === slot.startTime;
                return (
                  <TouchableOpacity
                    key={slot.startTime}
                    onPress={() => setSelectedSlot({ startTime: slot.startTime, endTime: slot.endTime })}
                    style={[styles.slotChip, active && styles.slotChipActive]}
                  >
                    <Text style={[styles.slotTime, active && { color: '#fff' }]}>{formatTime12h(slot.startTime)}</Text>
                    <Text style={[styles.slotPrice, active && { color: 'rgba(255,255,255,0.8)' }]}>
                      {slot.price} ل.س
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Guest info ────────────────────────────────────────── */}
        <SectionLabel>بيانات الشخص</SectionLabel>
        <GlassCard style={styles.guestCard}>
          <Field label="الاسم *" value={guestName} onChange={setGuestName} placeholder="اسم الشخص" />
          <Divider />
          <Field label="رقم الهاتف" value={guestPhone} onChange={setGuestPhone} placeholder="اختياري" keyboardType="phone-pad" />
          <Divider />
          <Field
            label="العربون المدفوع (ل.س)"
            value={depositPaid}
            onChange={setDepositPaid}
            placeholder="0"
            keyboardType="numeric"
          />
          <Divider />
          <Field label="ملاحظات" value={notes} onChange={setNotes} placeholder="اختياري" />
        </GlassCard>

        {/* ── Summary ──────────────────────────────────────────── */}
        {selectedSlot && (
          <GlassCard style={styles.summary}>
            <Text style={[Typography.labelMd, { color: Colors.text.primary, marginBottom: Spacing.sm }]}>
              ملخص الحجز
            </Text>
            <SummaryRow label="الملعب" value={selectedFacility?.name ?? '—'} />
            <SummaryRow label="التاريخ" value={selectedDate} />
            <SummaryRow label="الوقت" value={`${formatTime12h(selectedSlot.startTime)} — ${formatTime12h(selectedSlot.endTime)}`} />
            {guestName ? <SummaryRow label="الاسم" value={guestName} /> : null}
            {depositPaid ? <SummaryRow label="العربون" value={`${depositPaid} ل.س`} highlight /> : null}
          </GlassCard>
        )}

        {/* ── Submit ────────────────────────────────────────────── */}
        <View style={{ marginTop: Spacing.xl }}>
          <PrimaryButton
            label={createMutation.isPending ? 'جاري الحجز...' : 'تأكيد الحجز ✓'}
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={!selectedSlot || !guestName.trim()}
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Facility picker modal ─────────────────────────────── */}
      <Modal visible={facilityModalOpen} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFacilityModalOpen(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={[Typography.h3, styles.modalTitle]}>اختر الملعب</Text>
          <FlatList
            data={facilities.filter(f => f.isActive !== false)}
            keyExtractor={(f) => f._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, selectedFacilityId === item._id && styles.modalItemActive]}
                onPress={() => {
                  setSelectedFacilityId(item._id);
                  if (item.sports?.length > 0) setSelectedSport(item.sports[0]);
                  setSelectedSlot(null);
                  setFacilityModalOpen(false);
                }}
              >
                <Text style={[Typography.labelMd, { color: Colors.text.primary }]}>{item.name}</Text>
                <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{item.address}</Text>
                {selectedFacilityId === item._id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.brand.primary} style={styles.modalCheck} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.sectionLabel}>{children}</Text>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType = 'default',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        keyboardType={keyboardType}
        textAlign="right"
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{label}</Text>
      <Text style={[Typography.labelSm, { color: highlight ? Colors.brand.primary : Colors.text.primary }]}>
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

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: Colors.text.secondary,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, textAlign: 'right',
  },

  // Facility selector
  selectorBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.background.primary,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.glass.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  selectorText: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },

  // Date chips
  dateChip: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.primary,
    minWidth: 62,
  },
  dateChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },
  dateDayName: { fontSize: 11, color: Colors.text.tertiary, fontWeight: '600' },
  dateLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginTop: 2 },
  todayBadge: { fontSize: 9, color: Colors.text.tertiary, marginTop: 2, fontWeight: '700' },

  // Sports
  sportsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.primary,
  },
  sportChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light },

  // Slots
  slotSection: { marginTop: Spacing.xl },
  emptySlots: { padding: Spacing.xl, alignItems: 'center' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    width: '30%', alignItems: 'center', paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.primary,
  },
  slotChipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary },
  slotTime: { fontSize: 14, fontWeight: '800', color: Colors.text.primary },
  slotPrice: { fontSize: 11, color: Colors.text.tertiary, marginTop: 2 },

  // Guest info
  guestCard: { overflow: 'hidden' },
  field: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  fieldLabel: { fontSize: 11, color: Colors.text.tertiary, marginBottom: 4, textAlign: 'right' },
  fieldInput: { fontSize: 15, color: Colors.text.primary, paddingVertical: 2, textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.glass.border },

  // Summary
  summary: { padding: Spacing.lg, marginTop: Spacing.lg },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 5,
  },

  primaryBtn: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.xl,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '65%', paddingBottom: 34,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.glass.medium,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  modalTitle: {
    color: Colors.text.primary, textAlign: 'center',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  modalItem: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border + '80',
    position: 'relative',
  },
  modalItemActive: { backgroundColor: Colors.brand.light },
  modalCheck: { position: 'absolute', right: Spacing.xl, top: Spacing.md },
});
