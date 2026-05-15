import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { notificationsApi } from '../src/api/notifications.api';
import { Colors, Typography, Spacing, Radius } from '../src/theme';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  new_booking: 'calendar',
  booking_confirmed: 'checkmark-circle',
  booking_cancelled: 'close-circle',
  payment_submitted: 'cash',
  booking_cancelled_by_owner: 'close-circle',
};

const TYPE_COLORS: Record<string, string> = {
  new_booking: Colors.brand.primary,
  booking_confirmed: Colors.success,
  booking_cancelled: Colors.error,
  payment_submitted: Colors.info,
  booking_cancelled_by_owner: Colors.error,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications-inbox'],
    queryFn: () => notificationsApi.getInbox(1),
  });

  const notifications: any[] = data?.data?.data?.notifications ?? [];
  const unreadCount: number = data?.data?.data?.unreadCount ?? 0;

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-inbox'] });
      qc.invalidateQueries({ queryKey: ['notif-unread'] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markOneRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-inbox'] });
      qc.invalidateQueries({ queryKey: ['notif-unread'] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleTap = (item: any) => {
    if (!item.read) markOneMutation.mutate(item._id);
    const bookingId = item.data?.bookingId;
    if (bookingId) router.push(`/booking/${bookingId}` as any);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={[Typography.h3, { color: Colors.text.primary }]}>الإشعارات</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            style={styles.markAllBtn}
          >
            <Text style={styles.markAllText}>قراءة الكل</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand.primary} size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={56} color={Colors.text.tertiary} />
          <Text style={[Typography.h3, { color: Colors.text.secondary, marginTop: Spacing.lg }]}>لا توجد إشعارات</Text>
          <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginTop: Spacing.sm }]}>ستظهر هنا عند وصول إشعار جديد</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brand.primary}
            />
          }
          renderItem={({ item }) => {
            const icon = TYPE_ICONS[item.type] ?? 'notifications';
            const color = TYPE_COLORS[item.type] ?? Colors.brand.primary;
            const isRead = item.read;

            return (
              <TouchableOpacity
                style={[styles.card, !isRead && styles.cardUnread]}
                onPress={() => handleTap(item)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
                  <Ionicons name={icon} size={22} color={color} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardTitle, !isRead && styles.cardTitleUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {!isRead && <View style={[styles.dot, { backgroundColor: color }]} />}
                  </View>
                  <Text style={styles.cardMsg} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  markAllBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6 },
  markAllText: { fontSize: 13, fontWeight: '600', color: Colors.brand.primary },

  list: { padding: Spacing.lg, gap: Spacing.sm },

  card: {
    flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start',
    backgroundColor: Colors.background.primary,
    borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.glass.border,
  },
  cardUnread: {
    backgroundColor: Colors.brand.primary + '08',
    borderColor: Colors.brand.primary + '30',
  },

  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  cardBody: { flex: 1, gap: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  cardTitle: {
    fontSize: 14, fontWeight: '600', color: Colors.text.secondary, flex: 1,
  },
  cardTitleUnread: { color: Colors.text.primary, fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  cardMsg: { fontSize: 13, color: Colors.text.tertiary, lineHeight: 19 },
  cardTime: { fontSize: 11, color: Colors.text.tertiary, marginTop: 2 },
});
