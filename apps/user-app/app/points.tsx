import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../src/api/users.api';
import { useAuthStore } from '../src/store/auth.store';
import { GlassCard } from '../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../src/theme';

const ACTION_ICONS: Record<string, string> = {
  booking_confirmed: '✅',
  booking_cancelled: '↩️',
  bonus:             '🎁',
  redeemed:          '🎫',
};

export default function PointsScreen() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);

  const { data: historyData, isLoading, isFetching } = useQuery({
    queryKey: ['pointsHistory', page],
    queryFn: () => usersApi.getPointsHistory(page),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const history: any[] = historyData?.data?.data ?? [];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
          </TouchableOpacity>
          <Text style={[Typography.h3, { color: Colors.text.primary }]}>نقاط الولاء</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Balance Card — solid green */}
        <View style={styles.balanceCard}>
          <Text style={[Typography.labelMd, { color: 'rgba(255,255,255,0.8)' }]}>رصيدك الحالي</Text>
          <Text style={[Typography.displayLg, { color: '#fff', marginVertical: Spacing.sm }]}>
            {user?.points ?? 0}
          </Text>
          <Text style={[Typography.labelLg, { color: 'rgba(255,255,255,0.9)' }]}>نقطة</Text>

          <View style={styles.earnInfo}>
            <View style={styles.earnItem}>
              <Text style={[Typography.numericMd, { color: '#fff' }]}>5</Text>
              <Text style={[Typography.labelSm, { color: 'rgba(255,255,255,0.75)' }]}>نقاط لكل حجز</Text>
            </View>
            <View style={styles.earnDivider} />
            <View style={styles.earnItem}>
              <Text style={[Typography.numericMd, { color: '#fff' }]}>1</Text>
              <Text style={[Typography.labelSm, { color: 'rgba(255,255,255,0.75)' }]}>ريال = نقطة</Text>
            </View>
          </View>
        </View>

        {/* How to earn */}
        <GlassCard style={styles.howCard}>
          <Text style={[Typography.labelLg, { color: Colors.text.primary, marginBottom: Spacing.md }]}>
            كيف تكسب النقاط؟
          </Text>
          <HowRow icon="✅" text="أكمل حجزاً — 5 نقاط" />
          <HowRow icon="📱" text="شارك حجزك على واتساب — 2 نقاط" />
          <HowRow icon="⭐" text="أكمل ملفك الشخصي — 10 نقاط" />
        </GlassCard>

        {/* History */}
        <Text style={[Typography.h3, { color: Colors.text.primary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md }]}>
          سجل النقاط
        </Text>

        {isLoading ? (
          <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.xl }} />
        ) : history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>⭐</Text>
            <Text style={[Typography.bodyMd, { color: Colors.text.secondary, marginTop: Spacing.md }]}>
              لا توجد معاملات بعد
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(h, i) => h._id ?? String(i)}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <HistoryRow entry={item} />}
            onEndReached={() => setPage((p) => p + 1)}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isFetching && page > 1
                ? <ActivityIndicator color={Colors.brand.primary} style={{ marginVertical: Spacing.lg }} />
                : null
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function HistoryRow({ entry }: { entry: any }) {
  const isPositive = entry.delta > 0;
  const icon = ACTION_ICONS[entry.action] ?? (isPositive ? '➕' : '➖');
  const dateStr = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('ar-SA') : '—';

  return (
    <GlassCard style={styles.historyRow}>
      <View style={[styles.historyIcon, { backgroundColor: isPositive ? Colors.successBg : Colors.errorBg }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.labelMd, { color: Colors.text.primary }]}>
          {entry.description ?? entry.action ?? '—'}
        </Text>
        <Text style={[Typography.bodyMd, { color: Colors.text.tertiary }]}>{dateStr}</Text>
      </View>
      <Text style={[
        Typography.numericMd,
        { color: isPositive ? Colors.success : Colors.error },
      ]}>
        {isPositive ? '+' : ''}{entry.delta}
      </Text>
    </GlassCard>
  );
}

function HowRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  balanceCard: {
    margin: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.brand.primary,
    overflow: 'hidden',
  },
  earnInfo: {
    flexDirection: 'row', marginTop: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: Radius.lg, padding: Spacing.md,
    gap: Spacing.xl,
  },
  earnItem: { alignItems: 'center', gap: 4 },
  earnDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  howCard: { marginHorizontal: Spacing.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  historyIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: Spacing.huge },
});
