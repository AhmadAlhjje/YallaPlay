import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  FlatList, RefreshControl, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
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
const SPORTS_DATA: (SportType | 'all')[] = ['all', ...SPORTS];
const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_W = SCREEN_W - Spacing.xl * 2;

const BANNERS = [
  {
    id: 'b1',
    title: 'احجز خلال ثوانٍ',
    subtitle: 'أفضل الملاعب حولك مع عروض مميزة اليوم',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'b2',
    title: 'ملاعب جديدة',
    subtitle: 'أماكن جديدة وتجربة احترافية',
    image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'b3',
    title: 'جرّب أقرب ملعب',
    subtitle: 'خيارات قريبة وسريعة للحجز',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function HomeScreen() {
  const { user }   = useAuthStore();
  const { coords } = useLocationStore();
  const [selectedSport, setSelectedSport] = useState<SportType | undefined>();
  const [search, setSearch] = useState('');
  const bannerRef = useRef<FlatList>(null);
  const bannerIndex = useRef(0);
  const today = new Date().toISOString().split('T')[0];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء النور';
    return 'أهلاً';
  };

  const { data: popularData, isLoading: popularLoading, refetch } = useQuery({
    queryKey: ['facilities', 'popular', selectedSport],
    queryFn: () => facilitiesApi.search({
      sport: selectedSport, sortBy: 'popular', limit: 6,
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
    }),
    staleTime: 60_000,
  });

  const { data: ratedData } = useQuery({
    queryKey: ['facilities', 'rating', selectedSport],
    queryFn: () => facilitiesApi.search({
      sport: selectedSport, sortBy: 'rating', limit: 6,
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
    }),
    staleTime: 60_000,
  });

  const { data: featuredData } = useQuery({
    queryKey: ['facilities', 'featured', selectedSport],
    queryFn: () => facilitiesApi.search({
      sport: selectedSport, featured: true, sortBy: 'popular', limit: 6,
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
    }),
    staleTime: 60_000,
  });

  const { data: nearbyData } = useQuery({
    queryKey: ['facilities', 'nearby', coords],
    queryFn: () => facilitiesApi.search({
      sortBy: 'nearest', limit: 5,
      latitude: coords!.latitude, longitude: coords!.longitude,
    }),
    enabled: !!coords,
    staleTime: 120_000,
  });

  const { data: bookedTodayData } = useQuery({
    queryKey: ['facilities', 'booked-today', today],
    queryFn: () => facilitiesApi.search({ bookingsDate: today, sortBy: 'popular', limit: 6 }),
    staleTime: 60_000,
  });

  const facilities  = popularData?.data?.data?.facilities ?? [];
  const topRated    = ratedData?.data?.data?.facilities ?? [];
  const featured    = featuredData?.data?.data?.facilities ?? [];
  const nearby      = nearbyData?.data?.data?.facilities ?? [];
  const bookedToday = bookedTodayData?.data?.data?.facilities ?? [];

  const handleFacilityPress = (id: string) => router.push(`/facility/${id}`);
  const handleSearch = () => {
    if (!search.trim()) return;
    router.push({ pathname: '/search', params: { query: search, sport: selectedSport } });
  };

  useEffect(() => {
    if (BANNERS.length === 0) return undefined;
    const id = setInterval(() => {
      bannerIndex.current = (bannerIndex.current + 1) % BANNERS.length;
      bannerRef.current?.scrollToIndex({ index: bannerIndex.current, animated: true });
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={popularLoading} onRefresh={refetch} tintColor={Colors.brand.primary} />}
      >
        {/* ── Hero gradient ─────────────────────────────────── */}
        <LinearGradient
          colors={[Colors.brand.dark, Colors.brand.primary]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.hero}
        >
          <SafeAreaView>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={[Typography.bodyMd, { color: 'rgba(255,255,255,0.8)' }]}>{greeting()}،</Text>
                <Text style={[Typography.h2, { color: '#fff' }]}>
                  {user?.name?.split(' ')[0] ?? 'لاعب'}
                </Text>
              </View>
              {/* Notifications icon - same bubble style as tab icons */}
              <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.headerIconBtn}>
                <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.95)" />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <TouchableOpacity onPress={handleSearch} activeOpacity={0.9} style={styles.searchBar}>
              <TextInput
                placeholder="ابحث عن ملعب..."
                placeholderTextColor={Colors.text.tertiary}
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {/* Search icon - bubble style matching tab icons */}
              <View style={styles.searchIconBubble}>
                <Ionicons name="search-outline" size={17} color={Colors.brand.primary} />
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Content ───────────────────────────────────────── */}
        <View style={styles.section}>

          {/* Banner carousel */}
          <FlatList
            ref={bannerRef}
            data={BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.bannerRow}
            onScrollToIndexFailed={() => bannerRef.current?.scrollToIndex({ index: 0, animated: true })}
            renderItem={({ item }) => (
              <View style={styles.bannerCard}>
                <Image source={{ uri: item.image }} style={styles.bannerImage} contentFit="cover" />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.bannerOverlay}
                />
                <View style={styles.bannerTextWrap}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
            )}
          />

          {/* Weather */}
          <WeatherWidget />

          {/* Sport filter chips — start from RIGHT using inverted FlatList */}
          <Text style={[Typography.h3, styles.sectionTitle]}>الرياضات</Text>
          <FlatList
            horizontal
            inverted
            showsHorizontalScrollIndicator={false}
            data={SPORTS_DATA}
            keyExtractor={(s) => s}
            style={styles.chipsListBreakout}
            contentContainerStyle={styles.chipsContent}
            ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
            renderItem={({ item }) => (
              <SportChip
                sport={item}
                selected={item === 'all' ? !selectedSport : selectedSport === (item as SportType)}
                onPress={() => {
                  if (item === 'all') setSelectedSport(undefined);
                  else setSelectedSport((prev) => (prev === item ? undefined : item as SportType));
                }}
                style={{ marginRight: 0 }}
              />
            )}
          />

          {/* Popular */}
          <SectionHeader
            title={selectedSport ? `أفضل ملاعب ${selectedSport}` : 'الأكثر حجزاً'}
            onSeeAll={() => router.push({ pathname: '/search', params: { sport: selectedSport, sortBy: 'popular' } })}
          />
          <FlatList
            data={facilities}
            horizontal
            inverted
            showsHorizontalScrollIndicator={false}
            keyExtractor={(f) => f._id}
            style={styles.listBreakout}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={CardSpacer}
            renderItem={({ item }) => (
              <FacilityCard
                facility={item}
                onPress={() => handleFacilityPress(item._id)}
                style={styles.carouselCard}
              />
            )}
          />

          {/* Top rated */}
          {topRated.length > 0 && (
            <>
              <SectionHeader
                title="الأعلى تقييماً"
                onSeeAll={() => router.push({ pathname: '/search', params: { sport: selectedSport, sortBy: 'rating' } })}
              />
              <FlatList
                data={topRated}
                horizontal
                inverted
                showsHorizontalScrollIndicator={false}
                keyExtractor={(f) => f._id}
                style={styles.listBreakout}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={CardSpacer}
                renderItem={({ item }) => (
                  <FacilityCard
                    facility={item}
                    onPress={() => handleFacilityPress(item._id)}
                    style={styles.carouselCard}
                  />
                )}
              />
            </>
          )}

          {/* Featured */}
          {featured.length > 0 && (
            <>
              <SectionHeader
                title="الملاعب المميزة"
                onSeeAll={() => router.push({ pathname: '/search', params: { sport: selectedSport } })}
              />
              <FlatList
                data={featured}
                horizontal
                inverted
                showsHorizontalScrollIndicator={false}
                keyExtractor={(f) => f._id}
                style={styles.listBreakout}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={CardSpacer}
                renderItem={({ item }) => (
                  <FacilityCard
                    facility={item}
                    onPress={() => handleFacilityPress(item._id)}
                    style={styles.carouselCard}
                  />
                )}
              />
            </>
          )}

          {/* Nearby */}
          {nearby.length > 0 && (
            <>
              <SectionHeader
                title="قريب منك"
                onSeeAll={() => router.push({ pathname: '/search', params: { sortBy: 'nearest' } })}
              />
              <FlatList
                data={nearby}
                horizontal
                inverted
                showsHorizontalScrollIndicator={false}
                keyExtractor={(f) => f._id}
                style={styles.listBreakout}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={CardSpacer}
                renderItem={({ item }) => (
                  <FacilityCard
                    facility={item}
                    variant="compact"
                    onPress={() => handleFacilityPress(item._id)}
                    style={styles.compactCard}
                  />
                )}
              />
            </>
          )}

          {/* Available today — tab-style icon */}
          {bookedToday.length > 0 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  {/* Icon bubble matching tab icon style */}
                  <View style={styles.sectionIconBubble}>
                    <Ionicons name="calendar-outline" size={15} color={Colors.brand.primary} />
                  </View>
                  <Text style={[Typography.h3, { color: Colors.text.primary }]}>الملاعب المتاحة اليوم</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/bookings')}
                  style={styles.seeAllBtn}
                >
                  <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>حجوزاتي</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={bookedToday}
                horizontal
                inverted
                showsHorizontalScrollIndicator={false}
                keyExtractor={(f) => f._id}
                style={styles.listBreakout}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={CardSpacer}
                renderItem={({ item }) => (
                  <FacilityCard
                    facility={item}
                    variant="compact"
                    onPress={() => handleFacilityPress(item._id)}
                    style={styles.compactCard}
                  />
                )}
              />
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={[Typography.h3, { color: Colors.text.primary }]}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
        <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>عرض الكل</Text>
      </TouchableOpacity>
    </View>
  );
}

function CardSpacer() {
  return <View style={{ width: Spacing.md }} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { paddingBottom: Spacing.xxxl },

  // ── Hero ───────────────────────────────────────────────────
  hero: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 8,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerText: { alignItems: 'flex-end' },

  // Icon button — same bubble concept as tab icons, adapted for green bg
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search bar — icon bubble inside
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    textAlign: 'right',
  },
  searchIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.brand.light,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Content section ────────────────────────────────────────
  section: { paddingHorizontal: Spacing.xl },

  // Banner
  bannerRow: { paddingBottom: Spacing.lg, gap: Spacing.md },
  bannerCard: {
    width: BANNER_W,
    height: 150,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.background.secondary,
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  bannerTextWrap: { position: 'absolute', right: 16, bottom: 12, left: 16 },
  bannerTitle: { ...Typography.labelLg, color: '#fff', marginBottom: 4, textAlign: 'right' },
  bannerSubtitle: { ...Typography.bodySm, color: 'rgba(255,255,255,0.85)', textAlign: 'right' },

  // Sports chips
  sectionTitle: { color: Colors.text.primary, marginBottom: Spacing.md },
  // Break out of section padding so chips reach screen edges
  chipsListBreakout: {
    marginHorizontal: -Spacing.xl,
    marginBottom: Spacing.xl,
  },
  chipsContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },

  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitleGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  // Icon bubble — same style as tab icon bubble
  sectionIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.brand.light,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.light,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },

  // FlatList breakout — removes double padding from section wrapper
  listBreakout: { marginHorizontal: -Spacing.xl },
  listContent: { paddingHorizontal: Spacing.xl },

  // Card sizes — narrower for portrait look
  carouselCard: { width: 195 },
  compactCard:  { width: 210 },
});
