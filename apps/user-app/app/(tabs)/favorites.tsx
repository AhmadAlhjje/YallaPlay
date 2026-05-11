import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { FacilityCard } from '../../src/components/FacilityCard';
import { useFavoritesStore } from '../../src/store/favorites.store';
import { usersApi } from '../../src/api/users.api';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

export default function FavoritesScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await usersApi.getFavorites();
      // TransformInterceptor: { success, data: [...facilities], timestamp }
      return (res.data.data as any[]) ?? [];
    },
    staleTime: 0,
  });

  const favorites = data ?? [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>المفضلة</Text>
            <View style={styles.headerIcon}>
              <Ionicons name="heart" size={20} color={Colors.brand.primary} />
            </View>
          </View>
          {favorites.length > 0 && (
            <Text style={styles.subtitle}>{favorites.length} ملعب محفوظ</Text>
          )}
        </SafeAreaView>
      </View>

      {/* List */}
      <FlatList
        data={favorites}
        keyExtractor={(f: any) => f._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.brand.primary} />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        renderItem={({ item }) => (
          <FacilityCard
            facility={item}
            onPress={() => router.push(`/facility/${item._id}`)}
          />
        )}
      />
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="heart-outline" size={48} color={Colors.brand.primary} />
      </View>
      <Text style={styles.emptyTitle}>لا توجد ملاعب مفضلة بعد</Text>
      <Text style={styles.emptyDesc}>
        اضغط على أيقونة القلب ❤️ في أي ملعب لحفظه هنا
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => router.replace('/(tabs)')}
        activeOpacity={0.85}
      >
        <Ionicons name="search-outline" size={16} color="#fff" />
        <Text style={styles.exploreBtnText}>استكشف الملاعب</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  header: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'right' },

  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 14,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.brand.light,
    borderWidth: 2, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  emptyDesc: {
    ...Typography.bodyMd,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  exploreBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 24, paddingVertical: 12,
    marginTop: 8,
  },
  exploreBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
