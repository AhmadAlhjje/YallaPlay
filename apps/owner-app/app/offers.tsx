import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
  Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { offersApi } from '../src/api/offers.api';
import { facilitiesApi } from '../src/api/facilities.api';
import { GlassCard } from '../src/components/GlassCard';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import { formatTime12h } from '../src/lib/time';

function buildDateList(days = 14) {
  const list: { date: string; label: string; dayLabel: string }[] = [];
  const today = new Date();
  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    list.push({
      date: `${yyyy}-${mm}-${dd}`,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      dayLabel: i === 0 ? 'اليوم' : i === 1 ? 'غداً' : dayNames[d.getDay()],
    });
  }
  return list;
}

const DATE_LIST = buildDateList();

export default function OffersScreen() {
  const qc = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [selectedDate, setSelectedDate]         = useState(DATE_LIST[0].date);
  const [startTime, setStartTime]               = useState('');
  const [newPrice, setNewPrice]                 = useState('');

  const { data: facilitiesData } = useQuery({
    queryKey: ['owner-facilities'],
    queryFn: () => facilitiesApi.getMyFacilities(),
    staleTime: 300_000,
  });

  const facilitiesPayload = facilitiesData?.data;
  const facilities: any[] = Array.isArray(facilitiesPayload?.data)
    ? facilitiesPayload.data
    : Array.isArray(facilitiesPayload)
      ? facilitiesPayload
      : facilitiesPayload?.facilities ?? [];

  useEffect(() => {
    if (facilities.length > 0 && !selectedFacility) {
      setSelectedFacility(facilities[0]._id);
    }
  }, [facilities.length]);

  const selectedFacilityObj = facilities.find((f) => f._id === selectedFacility);
  const originalPrice: number = selectedFacilityObj?.pricePerSlot ?? 0;

  const { data: slotsRes, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', selectedFacility, selectedDate],
    queryFn: () => facilitiesApi.getSlots(selectedFacility, selectedDate),
    enabled: !!selectedFacility,
    staleTime: 30_000,
  });

  const { data: offersRes, isLoading: offersLoading, refetch } = useQuery({
    queryKey: ['owner-offers'],
    queryFn: () => offersApi.getOwnerOffers(),
    staleTime: 60_000,
  });

  const parsedNewPrice = parseFloat(newPrice);
  const discountPercent = originalPrice > 0 && parsedNewPrice > 0
    ? Math.max(1, Math.min(99, Math.round((1 - parsedNewPrice / originalPrice) * 100)))
    : 0;

  const createMutation = useMutation({
    mutationFn: () => offersApi.create({
      facilityId: selectedFacility,
      date: selectedDate,
      startTime,
      discountPercent,
    }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-offers'] });
      setShowCreateModal(false);
      setStartTime('');
      setNewPrice('');
      Alert.alert('تم إنشاء العرض! ⚡', `سيظهر السعر الجديد ${parsedNewPrice} ل.س للاعبين فوراً`);
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر إنشاء العرض'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => offersApi.deactivate(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-offers'] });
      Alert.alert('تم', 'تم إلغاء العرض بنجاح');
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر إلغاء العرض'),
  });

  const slots: any[]   = slotsRes?.data?.data ?? [];
  const availableSlots = slots.filter((s) => s.status === 'available');
  const activeOffers: any[] = offersRes?.data?.data ?? [];

  const canCreate = !!startTime && !!selectedFacility && parsedNewPrice > 0 && parsedNewPrice < originalPrice;

  const confirmDeactivate = (id: string) => {
    Alert.alert('إلغاء العرض', 'هل تريد إلغاء هذا العرض؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم، إلغاء', style: 'destructive', onPress: () => deactivateMutation.mutate(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
          </TouchableOpacity>
          <Text style={[Typography.h3, { color: Colors.text.primary }]}>⚡ العروض الفلاش</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
            <Text style={[Typography.labelMd, { color: Colors.warning }]}>+ إضافة</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBanner}>
          <Text style={{ fontSize: 24 }}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={[Typography.labelMd, { color: Colors.warning }]}>ما هي العروض الفلاش؟</Text>
            <Text style={[Typography.bodySm, { color: Colors.text.secondary, marginTop: 2 }]}>
              قدّم سعراً مخفّضاً على وقت محدد لجذب المزيد من الحجوزات. ينتهي العرض تلقائياً عند بداية الوقت.
            </Text>
          </View>
        </View>

        <Text style={[Typography.h3, styles.sectionTitle]}>
          العروض النشطة {activeOffers.length > 0 ? `(${activeOffers.length})` : ''}
        </Text>
      </SafeAreaView>

      {offersLoading ? (
        <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.xl }} />
      ) : activeOffers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 56, textAlign: 'center' }}>⚡</Text>
          <Text style={[Typography.h3, { color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing.md }]}>
            لا توجد عروض نشطة
          </Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center', marginTop: 4 }]}>
            أضف عرضاً لزيادة حجوزاتك!
          </Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.createFirstBtn}>
            <Text style={[Typography.labelMd, { color: '#fff' }]}>+ أنشئ أول عرض</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activeOffers}
          keyExtractor={(o) => o._id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={false}
          renderItem={({ item }) => (
            <OfferCard offer={item} onDeactivate={() => confirmDeactivate(item._id)} />
          )}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowCreateModal(false)} />
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={[Typography.h3, { color: Colors.text.primary, marginBottom: Spacing.sm, textAlign: 'center' }]}>
                ⚡ عرض فلاش جديد
              </Text>
              <Text style={[Typography.bodySm, { color: Colors.text.tertiary, textAlign: 'center', marginBottom: Spacing.xl }]}>
                اختر الوقت وأدخل السعر الجديد بعد العرض
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Facility selector */}
                {facilities.length > 1 && (
                  <View style={{ marginBottom: Spacing.lg }}>
                    <Text style={styles.modalLabel}>الملعب</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {facilities.map((f) => (
                          <TouchableOpacity
                            key={f._id}
                            onPress={() => { setSelectedFacility(f._id); setStartTime(''); setNewPrice(''); }}
                            style={[styles.chip, selectedFacility === f._id && styles.chipActive]}
                          >
                            <Text style={[Typography.labelSm, { color: selectedFacility === f._id ? Colors.warning : Colors.text.secondary }]}>
                              🏟️ {f.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Date */}
                <Text style={styles.modalLabel}>التاريخ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {DATE_LIST.slice(0, 10).map((d) => (
                      <TouchableOpacity
                        key={d.date}
                        onPress={() => { setSelectedDate(d.date); setStartTime(''); }}
                        style={[styles.dateChip, selectedDate === d.date && styles.chipActive]}
                      >
                        <Text style={[Typography.labelSm, { color: selectedDate === d.date ? Colors.warning : Colors.text.primary }]}>
                          {d.dayLabel}
                        </Text>
                        <Text style={[Typography.bodySm, { color: selectedDate === d.date ? Colors.warning : Colors.text.tertiary }]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Time slot */}
                <Text style={styles.modalLabel}>الوقت المتاح</Text>
                {slotsLoading ? (
                  <ActivityIndicator color={Colors.brand.primary} style={{ marginVertical: Spacing.md }} />
                ) : availableSlots.length === 0 ? (
                  <View style={styles.noSlots}>
                    <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center' }]}>
                      لا توجد أوقات متاحة في هذا التاريخ
                    </Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {availableSlots.map((s) => (
                        <TouchableOpacity
                          key={s.startTime}
                          onPress={() => setStartTime(s.startTime)}
                          style={[styles.chip, startTime === s.startTime && styles.chipActive]}
                        >
                          <Text style={[Typography.labelMd, { color: startTime === s.startTime ? Colors.warning : Colors.text.secondary }]}>
                            🕐 {formatTime12h(s.startTime)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}

                {/* New Price Input */}
                <Text style={styles.modalLabel}>السعر الجديد بعد العرض</Text>
                {originalPrice > 0 && (
                  <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginBottom: Spacing.sm, textAlign: 'right' }]}>
                    السعر الأصلي: {originalPrice} ل.س
                  </Text>
                )}
                <View style={styles.priceInputWrap}>
                  <TextInput
                    style={styles.priceInput}
                    value={newPrice}
                    onChangeText={setNewPrice}
                    placeholder={`أقل من ${originalPrice} ل.س`}
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="numeric"
                    textAlign="right"
                  />
                  <Text style={styles.priceUnit}>ل.س</Text>
                </View>
                {parsedNewPrice > 0 && originalPrice > 0 && parsedNewPrice < originalPrice && (
                  <View style={styles.discountPreview}>
                    <Text style={{ fontSize: 16 }}>⚡</Text>
                    <Text style={[Typography.labelMd, { color: Colors.warning }]}>
                      خصم {discountPercent}% — توفير {originalPrice - parsedNewPrice} ل.س
                    </Text>
                  </View>
                )}
                {parsedNewPrice >= originalPrice && parsedNewPrice > 0 && (
                  <Text style={[Typography.bodySm, { color: Colors.error, textAlign: 'center', marginTop: 4 }]}>
                    يجب أن يكون السعر أقل من {originalPrice} ل.س
                  </Text>
                )}

                <View style={{ marginTop: Spacing.xl }}>
                  <PrimaryButton
                    label={canCreate ? `إنشاء العرض بسعر ${parsedNewPrice} ل.س` : 'اختر الوقت والسعر أولاً'}
                    onPress={() => createMutation.mutate()}
                    loading={createMutation.isPending}
                    disabled={!canCreate}
                  />
                </View>
                <TouchableOpacity onPress={() => setShowCreateModal(false)} style={{ alignItems: 'center', marginTop: Spacing.lg, paddingVertical: Spacing.sm }}>
                  <Text style={[Typography.labelMd, { color: Colors.text.tertiary }]}>إلغاء</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function OfferCard({ offer, onDeactivate }: { offer: any; onDeactivate: () => void }) {
  return (
    <GlassCard style={styles.offerCard}>
      <View style={styles.offerLeft}>
        <View style={styles.discountBadge}>
          <Text style={[Typography.numericMd, { color: Colors.warning }]}>{offer.discountedPrice ?? '—'}</Text>
          <Text style={[Typography.bodySm, { color: Colors.warning }]}>ل.س</Text>
        </View>
        {offer.discountPercent && (
          <Text style={[Typography.labelSm, { color: Colors.warning, marginTop: 4 }]}>{offer.discountPercent}% خصم</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.labelLg, { color: Colors.text.primary }]} numberOfLines={1}>
          {offer.facility?.name ?? '—'}
        </Text>
        <Text style={[Typography.bodyMd, { color: Colors.text.secondary, marginTop: 2 }]}>
          📅 {offer.date}
        </Text>
        <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>
          🕐 {formatTime12h(offer.startTime)}
        </Text>
      </View>
      <TouchableOpacity onPress={onDeactivate} style={styles.deactivateBtn}>
        <Text style={[Typography.labelSm, { color: Colors.error }]}>إلغاء</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  safe: { paddingHorizontal: Spacing.xl, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  backBtn: { padding: 4 },
  addBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.warning + '55', backgroundColor: Colors.warningBg,
  },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.warningBg,
    borderBottomWidth: 1, borderBottomColor: Colors.warning + '33',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text.primary,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  createFirstBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  offerCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderLeftWidth: 4, borderLeftColor: Colors.warning,
  },
  offerLeft: { alignItems: 'center' },
  discountBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.warningBg,
    borderWidth: 1.5, borderColor: Colors.warning + '44',
    alignItems: 'center', justifyContent: 'center',
  },
  deactivateBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.error + '55', backgroundColor: Colors.errorBg,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, paddingBottom: 0,
    borderTopWidth: 1, borderTopColor: Colors.glass.border,
    maxHeight: '92%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.glass.strong,
    alignSelf: 'center', marginBottom: Spacing.md,
  },
  modalLabel: {
    ...Typography.labelMd,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textAlign: 'right',
  },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 9,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
  },
  dateChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.background.secondary,
    alignItems: 'center', minWidth: 64,
  },
  chipActive: { borderColor: Colors.warning, backgroundColor: Colors.warningBg },
  noSlots: {
    height: 60, borderRadius: Radius.lg,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.glass.border,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  priceInput: {
    flex: 1, fontSize: 22, fontWeight: '700',
    color: Colors.text.primary,
    paddingVertical: 14,
  },
  priceUnit: { fontSize: 14, fontWeight: '600', color: Colors.text.tertiary },
  discountPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.warningBg, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.warning + '44',
    marginBottom: Spacing.sm,
  },
});
