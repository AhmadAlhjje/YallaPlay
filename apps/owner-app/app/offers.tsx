import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
  Modal, TextInput, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { offersApi } from '../src/api/offers.api';
import { facilitiesApi } from '../src/api/facilities.api';
import { GlassCard } from '../src/components/GlassCard';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { Colors, Typography, Spacing, Radius } from '../src/theme';

function buildDateList(days = 14) {
  const list: { date: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    list.push({ date: `${yyyy}-${mm}-${dd}`, label: `${d.getDate()}/${d.getMonth() + 1}` });
  }
  return list;
}

const DATE_LIST = buildDateList();

const DISCOUNT_OPTIONS = [10, 15, 20, 25, 30, 40, 50];

export default function OffersScreen() {
  const qc = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [selectedDate, setSelectedDate]         = useState(DATE_LIST[0].date);
  const [startTime, setStartTime]               = useState('');
  const [discountPercent, setDiscountPercent]   = useState(20);

  const { data: facilitiesRes } = useQuery({
    queryKey: ['owner-facilities'],
    queryFn: () => facilitiesApi.getMyFacilities(),
    staleTime: 300_000,
    select: (res) => {
      const list = res.data?.data ?? [];
      if (list.length > 0 && !selectedFacility) setSelectedFacility(list[0]._id);
      return list;
    },
  });

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

  const createMutation = useMutation({
    mutationFn: () => offersApi.create({ facilityId: selectedFacility, date: selectedDate, startTime, discountPercent }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-offers'] });
      setShowCreateModal(false);
      setStartTime('');
    },
    onError: (err: any) => Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر إنشاء العرض'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => offersApi.deactivate(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-offers'] });
    },
    onError: () => Alert.alert('خطأ', 'تعذّر إلغاء العرض'),
  });

  const facilities: any[] = facilitiesRes ?? [];
  const slots: any[] = slotsRes?.data?.data ?? [];
  const availableSlots = slots.filter((s) => s.status === 'available');
  const offers: any[] = offersRes?.data?.data ?? [];
  const activeOffers  = offers.filter((o) => o.isActive);

  const confirmDeactivate = (id: string) => {
    Alert.alert('إلغاء العرض', 'هل تريد إلغاء هذا العرض؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم', style: 'destructive', onPress: () => deactivateMutation.mutate(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
          </TouchableOpacity>
          <Text style={[Typography.h3, { color: Colors.text.primary }]}>العروض الفلاش ⚡</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
            <Text style={[Typography.labelMd, { color: Colors.warning }]}>+ عرض</Text>
          </TouchableOpacity>
        </View>

        {/* Explanation */}
        <GlassCard style={[styles.infoCard, { borderColor: Colors.warning + '44' }]}>
          <Text style={[Typography.labelMd, { color: Colors.warning }]}>⚡ ما هي العروض الفلاش؟</Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.secondary, marginTop: 6 }]}>
            قدّم خصماً مؤقتاً على أوقات محددة لزيادة الحجوزات. ينتهي العرض تلقائياً عند بداية الوقت.
          </Text>
        </GlassCard>

        {/* Active offers */}
        <Text style={[Typography.h3, styles.sectionTitle]}>
          العروض النشطة {activeOffers.length > 0 ? `(${activeOffers.length})` : ''}
        </Text>

        {offersLoading ? (
          <ActivityIndicator color={Colors.brand.primary} />
        ) : activeOffers.length === 0 ? (
          <GlassCard style={[styles.emptyCard]}>
            <Text style={{ fontSize: 36, textAlign: 'center', marginBottom: Spacing.sm }}>⚡</Text>
            <Text style={[Typography.bodyMd, { color: Colors.text.secondary, textAlign: 'center' }]}>
              لا توجد عروض نشطة. أضف عرضاً لزيادة حجوزاتك!
            </Text>
          </GlassCard>
        ) : (
          <FlatList
            data={activeOffers}
            keyExtractor={(o) => o._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <OfferCard offer={item} onDeactivate={() => confirmDeactivate(item._id)} />
            )}
          />
        )}
      </SafeAreaView>

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowCreateModal(false)} />
          <View style={styles.modalSheet}>
            <Text style={[Typography.h3, { color: Colors.text.primary, marginBottom: Spacing.xl }]}>
              عرض فلاش جديد ⚡
            </Text>

            {/* Facility selector */}
            {facilities.length > 1 && (
              <View style={{ marginBottom: Spacing.lg }}>
                <Text style={[Typography.labelMd, { color: Colors.text.secondary, marginBottom: Spacing.sm }]}>الملعب</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {facilities.map((f) => (
                      <TouchableOpacity
                        key={f._id}
                        onPress={() => setSelectedFacility(f._id)}
                        style={[styles.chip, selectedFacility === f._id && styles.chipActive]}
                      >
                        <Text style={[Typography.labelSm, { color: selectedFacility === f._id ? Colors.warning : Colors.text.tertiary }]}>
                          {f.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Date */}
            <Text style={[Typography.labelMd, { color: Colors.text.secondary, marginBottom: Spacing.sm }]}>التاريخ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {DATE_LIST.slice(0, 10).map((d) => (
                  <TouchableOpacity
                    key={d.date}
                    onPress={() => setSelectedDate(d.date)}
                    style={[styles.chip, selectedDate === d.date && styles.chipActive]}
                  >
                    <Text style={[Typography.labelSm, { color: selectedDate === d.date ? Colors.warning : Colors.text.tertiary }]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Slot */}
            <Text style={[Typography.labelMd, { color: Colors.text.secondary, marginBottom: Spacing.sm }]}>الوقت</Text>
            {slotsLoading ? (
              <ActivityIndicator color={Colors.brand.primary} style={{ marginVertical: Spacing.md }} />
            ) : availableSlots.length === 0 ? (
              <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, marginBottom: Spacing.lg }]}>
                لا توجد أوقات متاحة في هذا التاريخ
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {availableSlots.map((s) => (
                    <TouchableOpacity
                      key={s.startTime}
                      onPress={() => setStartTime(s.startTime)}
                      style={[styles.chip, startTime === s.startTime && styles.chipActive]}
                    >
                      <Text style={[Typography.labelSm, { color: startTime === s.startTime ? Colors.warning : Colors.text.tertiary }]}>
                        {s.startTime}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Discount */}
            <Text style={[Typography.labelMd, { color: Colors.text.secondary, marginBottom: Spacing.sm }]}>نسبة الخصم</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.xl }}>
              {DISCOUNT_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDiscountPercent(d)}
                  style={[styles.discountChip, discountPercent === d && styles.discountChipActive]}
                >
                  <Text style={[Typography.labelMd, { color: discountPercent === d ? Colors.warning : Colors.text.tertiary }]}>
                    {d}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton
              label={`إنشاء عرض ${discountPercent}% خصم`}
              onPress={() => {
                if (!startTime) { Alert.alert('', 'اختر وقتاً للعرض'); return; }
                createMutation.mutate();
              }}
              loading={createMutation.isPending}
              disabled={!startTime || !selectedFacility}
            />
            <TouchableOpacity onPress={() => setShowCreateModal(false)} style={{ alignItems: 'center', marginTop: Spacing.md }}>
              <Text style={[Typography.labelMd, { color: Colors.text.tertiary }]}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function OfferCard({ offer, onDeactivate }: { offer: any; onDeactivate: () => void }) {
  return (
    <GlassCard style={[styles.offerCard, { borderColor: Colors.warning + '44' }]}>
      <LinearGradient colors={[Colors.warning + '18', 'transparent']} style={StyleSheet.absoluteFill} />
      <View style={styles.offerRow}>
        <View>
          <Text style={[Typography.h3, { color: Colors.warning }]}>{offer.discountPercent}% خصم</Text>
          <Text style={[Typography.labelMd, { color: Colors.text.primary }]}>{offer.facility?.name ?? '—'}</Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>📅 {offer.date} • 🕐 {offer.startTime}</Text>
        </View>
        <TouchableOpacity onPress={onDeactivate} style={styles.deactivateBtn}>
          <Text style={[Typography.labelSm, { color: Colors.error }]}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  safe: { flex: 1, paddingHorizontal: Spacing.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  addBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.warning + '55', backgroundColor: Colors.warningBg,
  },
  infoCard: { padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1 },
  sectionTitle: { color: Colors.text.primary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  emptyCard: { padding: Spacing.xl },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.glass.border, backgroundColor: Colors.glass.subtle,
  },
  chipActive: { borderColor: Colors.warning, backgroundColor: Colors.warningBg },
  discountChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.glass.border, backgroundColor: Colors.glass.subtle,
    minWidth: 60, alignItems: 'center',
  },
  discountChipActive: { borderColor: Colors.warning, backgroundColor: Colors.warningBg },
  offerCard: { padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1.5, overflow: 'hidden' },
  offerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deactivateBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.error + '55', backgroundColor: Colors.errorBg,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background.elevated,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: Colors.glass.border,
    maxHeight: '85%',
  },
});
