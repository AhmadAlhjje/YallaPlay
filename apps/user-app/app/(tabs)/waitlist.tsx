import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { waitlistApi } from '../../src/api/waitlist.api';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  waiting:   { label: 'في الانتظار', color: Colors.warning },
  notified:  { label: 'متاح الآن!',  color: Colors.success },
  converted: { label: 'تم الحجز',    color: Colors.info },
  expired:   { label: 'انتهى',       color: Colors.text.tertiary },
};

export default function WaitlistTab() {
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['myWaitlist'],
    queryFn: () => waitlistApi.getMine(),
    staleTime: 60_000,
  });

  const leaveMutation = useMutation({
    mutationFn: (id: string) => waitlistApi.leave(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['myWaitlist'] });
    },
    onError: () => Alert.alert('خطأ', 'تعذّر إلغاء الاشتراك في القائمة'),
  });

  const confirmLeave = (id: string, facilityName: string) => {
    Alert.alert(
      'إلغاء الاشتراك',
      `هل تريد الخروج من قائمة الانتظار لملعب "${facilityName}"؟`,
      [
        { text: 'لا', style: 'cancel' },
        { text: 'نعم', style: 'destructive', onPress: () => leaveMutation.mutate(id) },
      ],
    );
  };

  const entries: any[] = data?.data?.data ?? [];
  const active = entries.filter((e) => e.status === 'waiting' || e.status === 'notified');

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.topRow}>
          <Text style={[Typography.h2, { color: Colors.text.primary }]}>قائمة الانتظار</Text>
          {active.length > 0 && (
            <View style={styles.badge}>
              <Text style={[Typography.labelSm, { color: Colors.brand.primary }]}>{active.length}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {isLoading ? (
        <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.huge }} />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 52 }}>⏳</Text>
          <Text style={[Typography.h3, { color: Colors.text.secondary, marginTop: Spacing.lg }]}>
            لا توجد اشتراكات في قائمة الانتظار
          </Text>
          <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, marginTop: Spacing.sm, textAlign: 'center' }]}>
            عندما يكون وقت محجوز، يمكنك الانضمام للقائمة ونبهك عند توفّره
          </Text>
          <TouchableOpacity onPress={() => router.push('/')} style={styles.browseBtn}>
            <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>تصفّح الملاعب</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e._id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <WaitlistCard
              entry={item}
              onLeave={() => confirmLeave(item._id, item.facility?.name)}
              onBook={() => router.push(`/facility/${item.facilityId}`)}
            />
          )}
        />
      )}
    </View>
  );
}

function WaitlistCard({
  entry, onLeave, onBook,
}: { entry: any; onLeave: () => void; onBook: () => void }) {
  const status = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.waiting;
  const isNotified = entry.status === 'notified';

  return (
    <GlassCard style={[styles.card, isNotified && styles.cardNotified]}>
      {isNotified && (
        <View style={styles.notifiedBanner}>
          <Text style={[Typography.labelMd, { color: Colors.success }]}>🎉 الوقت متاح — احجز الآن!</Text>
        </View>
      )}

      <View style={styles.cardRow}>
        <Text style={[Typography.h3, { color: Colors.text.primary, flex: 1 }]} numberOfLines={1}>
          {entry.facility?.name ?? '—'}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: status.color + '22', borderColor: status.color + '44' }]}>
          <Text style={[Typography.labelSm, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={[styles.cardRow, { marginTop: Spacing.sm }]}>
        <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>📅 {entry.date}</Text>
        <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>🕐 {entry.startTime}</Text>
      </View>

      {entry.position > 0 && entry.status === 'waiting' && (
        <Text style={[Typography.labelSm, { color: Colors.text.tertiary, marginTop: Spacing.sm }]}>
          موقعك في القائمة: #{entry.position}
        </Text>
      )}

      {(entry.status === 'waiting' || entry.status === 'notified') && (
        <View style={[styles.cardRow, { marginTop: Spacing.md, gap: Spacing.md }]}>
          {isNotified && (
            <TouchableOpacity onPress={onBook} style={styles.bookBtn}>
              <Text style={[Typography.labelMd, { color: '#fff' }]}>احجز الآن</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onLeave} style={styles.leaveBtn}>
            <Text style={[Typography.labelMd, { color: Colors.error }]}>إلغاء الاشتراك</Text>
          </TouchableOpacity>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  topRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, marginBottom: Spacing.xl,
  },
  badge: {
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.brand.border,
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.huge,
  },
  browseBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.light,
  },
  card: { padding: Spacing.lg, marginBottom: Spacing.md, overflow: 'hidden' },
  cardNotified: {
    borderColor: Colors.success + '55',
    backgroundColor: Colors.successBg,
  },
  notifiedBanner: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.success + '33',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  bookBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: Radius.md, backgroundColor: Colors.brand.primary,
  },
  leaveBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.error + '55', backgroundColor: Colors.errorBg,
  },
});
