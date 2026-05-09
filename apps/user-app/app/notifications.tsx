import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { notificationsApi } from '../src/api/notifications.api';
import { GlassCard } from '../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../src/theme';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  booking_confirmed:           { icon: '✅', color: Colors.success },
  booking_reminder:            { icon: '⏰', color: Colors.warning },
  booking_cancelled_by_owner:  { icon: '❌', color: Colors.error },
  booking_cancelled_by_user:   { icon: '↩️', color: Colors.error },
  waitlist_slot_available:     { icon: '🎉', color: Colors.brand.primary },
  points_earned:               { icon: '⭐', color: Colors.warning },
  general:                     { icon: '🔔', color: Colors.text.secondary },
};

export default function NotificationsScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getInbox(),
    staleTime: 30_000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      Haptics.selectionAsync();
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markOneRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const inbox: any[] = data?.data?.data?.notifications ?? [];
  const unreadCount: number = data?.data?.data?.unreadCount ?? 0;

  const handlePress = (notif: any) => {
    if (!notif.isRead) markOneMutation.mutate(notif._id);

    // Navigate based on type
    if (notif.bookingId) {
      router.push(`/booking/${notif.bookingId}`);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>← رجوع</Text>
          </TouchableOpacity>

          <View style={styles.titleRow}>
            <Text style={[Typography.h3, { color: Colors.text.primary }]}>الإشعارات</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={[Typography.labelSm, { color: '#fff' }]}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <Text style={[Typography.labelSm, { color: Colors.brand.primary }]}>
                {markAllMutation.isPending ? '...' : 'قراءة الكل'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.huge }} />
        ) : inbox.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 52 }}>🔔</Text>
            <Text style={[Typography.h3, { color: Colors.text.secondary, marginTop: Spacing.lg }]}>
              لا توجد إشعارات
            </Text>
            <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, marginTop: Spacing.sm }]}>
              ستظهر هنا إشعارات حجوزاتك ونقاطك
            </Text>
          </View>
        ) : (
          <FlatList
            data={inbox}
            keyExtractor={(n) => n._id}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            renderItem={({ item }) => (
              <NotificationRow notif={item} onPress={() => handlePress(item)} />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function NotificationRow({ notif, onPress }: { notif: any; onPress: () => void }) {
  const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.general;
  const dateStr = notif.createdAt
    ? new Date(notif.createdAt).toLocaleString('ar-SA', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard
        style={[
          styles.notifCard,
          !notif.isRead && styles.notifUnread,
        ]}
      >
        {/* Unread dot */}
        {!notif.isRead && <View style={styles.unreadDot} />}

        <View style={[styles.iconWrapper, { backgroundColor: config.color + '22' }]}>
          <Text style={{ fontSize: 22 }}>{config.icon}</Text>
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={[
              Typography.labelMd,
              { color: notif.isRead ? Colors.text.secondary : Colors.text.primary },
            ]}
          >
            {notif.title}
          </Text>
          {!!notif.body && (
            <Text
              style={[Typography.bodyMd, { color: Colors.text.tertiary }]}
              numberOfLines={2}
            >
              {notif.body}
            </Text>
          )}
          <Text style={[Typography.labelSm, { color: Colors.text.tertiary }]}>{dateStr}</Text>
        </View>

        {notif.bookingId && (
          <Text style={{ color: Colors.text.tertiary, fontSize: 18 }}>›</Text>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  badge: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.huge,
  },
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    position: 'relative',
  },
  notifUnread: {
    backgroundColor: Colors.brand.primary + '08',
    borderColor: Colors.brand.primary + '22',
  },
  unreadDot: {
    position: 'absolute', top: Spacing.md, right: Spacing.md,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.brand.primary,
  },
  iconWrapper: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
