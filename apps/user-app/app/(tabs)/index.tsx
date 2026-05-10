import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  FlatList, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { WeatherWidget } from '../../src/components/WeatherWidget';
import { FacilityCard } from '../../src/components/FacilityCard';
import { SportChip } from '../../src/components/SportChip';
import { useAuthStore } from '../../src/store/auth.store';
import { useLocationStore } from '../../src/store/location.store';
import { facilitiesApi } from '../../src/api/facilities.api';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { SportType } from '@yallaplay/shared-types';

const SPORTS: SportType[] = ['football', 'basketball', 'tennis', 'volleyball', 'padel', 'squash'];

export default function HomeScreen() {
  const { user }   = useAuthStore();
  const { coords } = useLocationStore();
  const [selectedSport, setSelectedSport] = useState<SportType | undefined>();
  const [search, setSearch] = useState('');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء النور';
    return 'أهلاً';
  };

  const { data: popularData, isLoading: popularLoading, refetch } = useQuery({
    queryKey: ['facilities', 'popular', selectedSport],
    queryFn: () => facilitiesApi.search({
      sport: selectedSport,
      sortBy: 'popular',
      limit: 6,
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
    }),
    staleTime: 60_000,
  });

  const { data: nearbyData } = useQuery({
    queryKey: ['facilities', 'nearby', coords],
    queryFn: () => facilitiesApi.search({
      sortBy: 'nearest',
      limit: 5,
      latitude: coords!.latitude,
      longitude: coords!.longitude,
    }),
    enabled: !!coords,
    staleTime: 120_000,
  });

  const facilities = popularData?.data?.data?.facilities ?? [];
  const nearby     = nearbyData?.data?.data?.facilities ?? [];

  const handleFacilityPress = (id: string) => router.push(`/facility/${id}`);

  const handleSearch = () => {
    if (!search.trim()) return;
    router.push({ pathname: '/search', params: { query: search, sport: selectedSport } });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={popularLoading} onRefresh={refetch} tintColor={Colors.brand.primary} />}
      >
        <SafeAreaView>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>{greeting()}،</Text>
              <Text style={[Typography.h2, { color: Colors.text.primary }]}>
                {user?.name?.split(' ')[0] ?? 'لاعب'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notifBtn}>
              <Text style={{ fontSize: 22 }}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <TouchableOpacity
            onPress={handleSearch}
            activeOpacity={0.9}
            style={styles.searchBar}
          >
            <Text style={{ fontSize: 18 }}>🔍</Text>
            <TextInput
              placeholder="ابحث عن ملعب..."
              placeholderTextColor={Colors.text.tertiary}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </TouchableOpacity>

          {/* Weather widget */}
          <WeatherWidget />

          {/* Sport filter chips */}
          <Text style={[Typography.h3, styles.sectionTitle]}>الرياضات</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            <SportChip
              sport={'football' as SportType}
              selected={!selectedSport}
              onPress={() => setSelectedSport(undefined)}
              style={{ marginRight: 8 }}
            />
            {SPORTS.map((s) => (
              <SportChip
                key={s}
                sport={s}
                selected={selectedSport === s}
                onPress={() => setSelectedSport((prev) => (prev === s ? undefined : s))}
              />
            ))}
          </ScrollView>

          {/* Nearby */}
          {nearby.length > 0 && (
            <>
              <SectionHeader title="قريب منك" onSeeAll={() => router.push({ pathname: '/search', params: { sortBy: 'nearest' } })} />
              <FlatList
                data={nearby}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(f) => f._id}
                contentContainerStyle={{ paddingRight: Spacing.xl }}
                renderItem={({ item }) => (
                  <FacilityCard
                    facility={item}
                    variant="compact"
                    onPress={() => handleFacilityPress(item._id)}
                    style={{ marginRight: Spacing.md, width: 260 }}
                  />
                )}
              />
            </>
          )}

          {/* Popular */}
          <SectionHeader
            title={selectedSport ? `أفضل ملاعب ${selectedSport}` : 'الأكثر حجزاً'}
            onSeeAll={() => router.push({ pathname: '/search', params: { sport: selectedSport } })}
          />
          {facilities.map((f: any) => (
            <FacilityCard
              key={f._id}
              facility={f}
              onPress={() => handleFacilityPress(f._id)}
            />
          ))}

          <View style={{ height: 100 }} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[Typography.h3, { color: Colors.text.primary }]}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>عرض الكل</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 16,
    textAlign: 'right',
  },
  sectionTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
});
