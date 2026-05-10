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

const SPORT_ICONS: Record<string, string> = {
  football: '⚽', basketball: '🏀', tennis: '🎾',
  volleyball: '🏐', padel: '🏓', squash: '🎱',
  badminton: '🏸', swimming: '🏊',
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
      Alert.alert('تم الحذف', 'تم حذف الملعب بنجاح');
    },
    onError: (err: any) => {
      Alert.alert(
        'تعذّر الحذف',
        err?.response?.data?.message ?? 'يوجد حجوزات قادمة لهذا الملعب. أنهِ أو ألغِ الحجوزات أولاً.',
      );
    },
  });

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      `حذف "${name}"`,
      'لا يمكن الحذف إذا كان هناك حجوزات قادمة. هل تريد المتابعة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ],
    );
  };

  const facilities: any[] = data?.data?.data ?? [];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <Text style={[Typography.h2, { color: Colors.text.primary }]}>ملاعبي</Text>
        <TouchableOpacity onPress={() => router.push('/facility/new')} style={styles.addBtn}>
          <Text style={[Typography.labelMd, { color: '#fff' }]}>+ ملعب جديد</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {isLoading ? (
        <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.huge }} />
      ) : facilities.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 64 }}>🏟️</Text>
          <Text style={[Typography.h2, { color: Colors.text.primary, marginTop: Spacing.lg, textAlign: 'center' }]}>
            لا توجد ملاعب بعد
          </Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center', marginTop: 4, marginBottom: Spacing.xl }]}>
            أضف ملعبك الأول لتبدأ باستقبال الحجوزات
          </Text>
          <TouchableOpacity onPress={() => router.push('/facility/new')} style={styles.addFirstBtn}>
            <Text style={[Typography.labelLg, { color: '#fff' }]}>🏟️ أضف ملعبك الأول</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={facilities}
          keyExtractor={(f) => f._id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <FacilityCard
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

function FacilityCard({
  facility, onEdit, onDelete,
}: { facility: any; onEdit: () => void; onDelete: () => void }) {
  const sports: string[] = facility.sports ?? facility.sport ?? [];
  const isActive = facility.isActive !== false;

  return (
    <GlassCard style={styles.card}>
      {/* Status + name */}
      <View style={styles.cardTop}>
        <View style={[styles.statusBadge, { backgroundColor: isActive ? Colors.successBg : Colors.errorBg, borderColor: isActive ? Colors.success + '44' : Colors.error + '44' }]}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? Colors.success : Colors.error }]} />
          <Text style={[Typography.labelSm, { color: isActive ? Colors.success : Colors.error }]}>
            {isActive ? 'نشط' : 'موقوف'}
          </Text>
        </View>
        <Text style={[Typography.numericSm, { color: Colors.brand.primary }]}>
          {facility.pricePerSlot ?? facility.pricePerHour ?? 0} ل.س/حصة
        </Text>
      </View>

      <Text style={[Typography.h3, { color: Colors.text.primary, marginBottom: 4 }]}>{facility.name}</Text>
      <Text style={[Typography.bodyMd, { color: Colors.text.secondary, marginBottom: Spacing.md }]} numberOfLines={1}>
        📍 {facility.address}
      </Text>

      {/* Sports */}
      <View style={styles.sportsRow}>
        {sports.slice(0, 6).map((s) => (
          <View key={s} style={styles.sportTag}>
            <Text style={{ fontSize: 18 }}>{SPORT_ICONS[s] ?? '🏅'}</Text>
          </View>
        ))}
        {sports.length === 0 && (
          <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>لا توجد رياضات محددة</Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatItem icon="📋" label="حجوزات" value={String(facility.totalBookings ?? 0)} />
        <StatItem icon="⭐" label="تقييم" value={facility.rating > 0 ? facility.rating.toFixed(1) : '—'} />
        <StatItem icon="⏱️" label="مدة الحصة" value={`${facility.slotDurationMinutes ?? 60} د`} />
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

function StatItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[Typography.numericSm, { color: Colors.text.primary }]}>{value}</Text>
      <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>{icon} {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  addBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  addFirstBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
  },
  card: { padding: Spacing.lg, marginBottom: Spacing.md },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  sportsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md, flexWrap: 'wrap',
  },
  sportTag: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
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
    borderColor: Colors.brand.primary + '55', backgroundColor: Colors.brand.light,
  },
  deleteBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.error + '55', backgroundColor: Colors.errorBg,
  },
});
