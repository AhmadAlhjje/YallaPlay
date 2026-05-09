import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { facilitiesApi } from '../../src/api/facilities.api';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const SPORT_LABELS: Record<string, string> = {
  football: '⚽', basketball: '🏀', tennis: '🎾',
  volleyball: '🏐', padel: '🏓', squash: '🎱',
};

export default function FacilitiesTab() {
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['owner-facilities'],
    queryFn: () => facilitiesApi.getMyFacilities(),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => facilitiesApi.softDelete(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['owner-facilities'] });
    },
    onError: (err: any) => {
      Alert.alert('تعذّر الحذف', err?.response?.data?.message ?? 'يوجد حجوزات قادمة لهذا الملعب');
    },
  });

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'حذف الملعب',
      `هل تريد حذف "${name}"؟ لا يمكن الحذف إن كان هناك حجوزات قادمة.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ],
    );
  };

  const facilities: any[] = data?.data?.data ?? [];

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={[Typography.h2, { color: Colors.text.primary }]}>ملاعبي</Text>
          <TouchableOpacity onPress={() => router.push('/facility/new')} style={styles.addBtn}>
            <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>+ إضافة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.huge }} />
      ) : facilities.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 52 }}>🏟️</Text>
          <Text style={[Typography.h3, { color: Colors.text.secondary, marginTop: Spacing.lg }]}>
            لا توجد ملاعب بعد
          </Text>
          <TouchableOpacity onPress={() => router.push('/facility/new')} style={styles.addFirstBtn}>
            <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>+ أضف ملعبك الأول</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={facilities}
          keyExtractor={(f) => f._id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <FacilityManageCard
              facility={item}
              onEdit={() => router.push(`/facility/${item._id}`)}
              onDelete={() => confirmDelete(item._id, item.name)}
            />
          )}
        />
      )}
    </View>
  );
}

function FacilityManageCard({
  facility, onEdit, onDelete,
}: { facility: any; onEdit: () => void; onDelete: () => void }) {
  const sports: string[] = facility.sport ?? [];

  return (
    <GlassCard style={styles.card}>
      {/* Status indicator */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusDot, { backgroundColor: facility.isActive ? Colors.success : Colors.error }]} />
        <Text style={[Typography.labelSm, { color: facility.isActive ? Colors.success : Colors.error }]}>
          {facility.isActive ? 'نشط' : 'موقوف'}
        </Text>
      </View>

      <Text style={[Typography.h3, { color: Colors.text.primary, marginBottom: 4 }]}>{facility.name}</Text>
      <Text style={[Typography.bodyMd, { color: Colors.text.secondary, marginBottom: Spacing.md }]}>
        📍 {facility.address}
      </Text>

      {/* Sports */}
      <View style={styles.sportsRow}>
        {sports.map((s) => (
          <View key={s} style={styles.sportTag}>
            <Text style={{ fontSize: 16 }}>{SPORT_LABELS[s] ?? '🏅'}</Text>
          </View>
        ))}
        <Text style={[Typography.labelSm, { color: Colors.text.tertiary }]}>
          {facility.pricePerHour} ر.س/ساعة
        </Text>
      </View>

      {/* Stats row */}
      <View style={[styles.statsRow]}>
        <MiniStat label="الحجوزات" value={String(facility.totalBookings ?? 0)} />
        <MiniStat label="التقييم" value={facility.rating > 0 ? `⭐ ${facility.rating.toFixed(1)}` : '—'} />
        <MiniStat label="المدة" value={`${facility.slotDurationMinutes ?? 60} د`} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>✏️ تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Text style={[Typography.labelMd, { color: Colors.error }]}>🗑️ حذف</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[Typography.numericSm, { color: Colors.text.primary }]}>{value}</Text>
      <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, marginBottom: Spacing.lg,
  },
  addBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary + '15',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addFirstBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primary + '15',
  },
  card: { padding: Spacing.lg, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  sportsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  sportTag: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.glass.subtle, alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: Colors.glass.border,
    paddingTop: Spacing.md, marginBottom: Spacing.md,
  },
  actions: { flexDirection: 'row', gap: Spacing.md },
  editBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.brand.primary + '55', backgroundColor: Colors.brand.primary + '12',
  },
  deleteBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.error + '55', backgroundColor: Colors.errorBg,
  },
});
