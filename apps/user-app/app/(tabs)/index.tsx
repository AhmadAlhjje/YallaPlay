import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  FlatList, RefreshControl, Dimensions, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { FacilityCard } from '../../src/components/FacilityCard';
import { SportChip } from '../../src/components/SportChip';
import { WeatherPanel } from '../../src/components/WeatherPanel';
import { SkeletonSectionList } from '../../src/components/SkeletonCard';
import { useAuthStore } from '../../src/store/auth.store';
import { useLocationStore } from '../../src/store/location.store';
import { facilitiesApi, offersApi } from '../../src/api/facilities.api';
import { weatherApi } from '../../src/api/weather.api';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { SportType } from '@yallaplay/shared-types';

const DISTANCE_OPTIONS = [1, 3, 5, 10] as const;
type DistanceKm = typeof DISTANCE_OPTIONS[number];

const SPORT_LABELS_AR: Record<string, string> = {
  football:   'كرة القدم',
  basketball: 'كرة السلة',
  tennis:     'تنس',
  volleyball: 'كرة الطائرة',
  padel:      'بادل',
  squash:     'إسكواش',
  badminton:  'ريشة طائر',
  swimming:   'سباحة',
};

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

// ─── Animated section wrapper ─────────────────────────────────────────────────
// opacity:0 causes content to silently disappear on Android (useNativeDriver bug)
// → use translateY only, content always visible
function FadeSlideIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const start = () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start();
    };
    if (delay > 0) {
      const t = setTimeout(start, delay);
      return () => clearTimeout(t);
    }
    start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { user }   = useAuthStore();
  const { coords, requestLocation } = useLocationStore();
  const [selectedSport, setSelectedSport] = useState<SportType | undefined>();
  const [search, setSearch] = useState('');
  const [nearbyRadius, setNearbyRadius] = useState<DistanceKm>(5);
  const [weatherOpen, setWeatherOpen] = useState(false);
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
    queryKey: ['facilities', 'nearby', coords, nearbyRadius],
    queryFn: () => facilitiesApi.search({
      sortBy: 'nearest', limit: 8,
      latitude: coords!.latitude, longitude: coords!.longitude,
      radiusKm: nearbyRadius,
    }),
    enabled: !!coords,
    staleTime: 120_000,
  });

  const { data: offersData } = useQuery({
    queryKey: ['offers', 'active'],
    queryFn: () => offersApi.getActive(8),
    staleTime: 60_000,
  });

  const { data: bookedTodayData } = useQuery({
    queryKey: ['facilities', 'booked-today', today, selectedSport],
    queryFn: () => facilitiesApi.search({ bookingsDate: today, sport: selectedSport, sortBy: 'popular', limit: 6 }),
    staleTime: 60_000,
  });

  // Weather mini data for header icon
  const { data: weatherData } = useQuery({
    queryKey: ['weather-current', coords?.latitude, coords?.longitude],
    queryFn: () => weatherApi.getCurrent(coords!.latitude, coords!.longitude),
    enabled: !!coords,
    staleTime: 60 * 60 * 1000,
  });

  const facilities  = popularData?.data?.data?.facilities ?? [];
  const topRated    = ratedData?.data?.data?.facilities ?? [];
  const featured    = featuredData?.data?.data?.facilities ?? [];
  const nearby      = nearbyData?.data?.data?.facilities ?? [];
  const bookedToday = bookedTodayData?.data?.data?.facilities ?? [];
  const activeOffers = offersData?.data?.data ?? [];
  const currentWeather = weatherData?.data?.data;

  const handleFacilityPress = (id: string) => router.push(`/facility/${id}`);
  const handleSearch = () => {
    if (!search.trim()) return;
    router.push({ pathname: '/search', params: { query: search, sport: selectedSport } });
  };

  useEffect(() => { requestLocation(); }, []);

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
              <View style={styles.headerActions}>
                {/* Weather icon */}
                {coords && (
                  <TouchableOpacity onPress={() => setWeatherOpen(true)} style={styles.headerIconBtn}>
                    <Text style={styles.weatherTemp}>
                      {currentWeather ? `${currentWeather.temperature}°` : '—'}
                    </Text>
                  </TouchableOpacity>
                )}
                {/* Notifications icon */}
                <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.headerIconBtn}>
                  <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.95)" />
                </TouchableOpacity>
              </View>
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
              <View style={styles.searchIconBubble}>
                <Ionicons name="search-outline" size={17} color={Colors.brand.primary} />
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Content ───────────────────────────────────────── */}
        <View style={styles.section}>

          {/* Banner carousel */}
          <FadeSlideIn delay={0}>
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
          </FadeSlideIn>

          {/* Sport filter chips */}
          <FadeSlideIn delay={80}>
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
          </FadeSlideIn>

          {/* Active Offers */}
          {activeOffers.length > 0 && (
            <FadeSlideIn delay={120}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <View style={[styles.sectionIconBubble, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                    <Ionicons name="pricetag" size={14} color="#D97706" />
                  </View>
                  <Text style={[Typography.h3, { color: Colors.text.primary }]}>عروض اليوم</Text>
                </View>
                <View style={styles.offersBadge}>
                  <Text style={styles.offersBadgeText}>{activeOffers.length} عرض</Text>
                </View>
              </View>
              <FlatList
                data={activeOffers}
                horizontal
                inverted
                showsHorizontalScrollIndicator={false}
                keyExtractor={(o) => o._id}
                style={styles.listBreakout}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={CardSpacer}
                renderItem={({ item }) => {
                  const facility = item.facilityId;
                  return (
                    <TouchableOpacity
                      onPress={() => router.push({
                        pathname: `/facility/${facility?._id ?? item.facilityId}`,
                        params: { offerDate: item.date, offerStartTime: item.startTime },
                      })}
                      style={styles.offerCard}
                      activeOpacity={0.85}
                    >
                      <View style={styles.offerDiscountBadge}>
                        <Text style={styles.offerDiscountText}>-{item.discountPercent}%</Text>
                      </View>
                      <Text style={styles.offerFacilityName} numberOfLines={1}>{facility?.name ?? '—'}</Text>
                      <Text style={styles.offerTime}>{item.date} · {item.startTime}</Text>
                      <View style={styles.offerPriceRow}>
                        <Text style={styles.offerNewPrice}>{item.discountedPrice} ر.س</Text>
                        <Text style={styles.offerOldPrice}>{item.originalPrice} ر.س</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </FadeSlideIn>
          )}

          {/* Popular */}
          <FadeSlideIn delay={160}>
            <SectionHeader
              title={selectedSport ? `أفضل ملاعب ${SPORT_LABELS_AR[selectedSport] ?? selectedSport}` : 'الأكثر حجزاً'}
              onSeeAll={() => router.push({ pathname: '/search', params: { sport: selectedSport, sortBy: 'popular' } })}
            />
            {popularLoading ? (
              <SkeletonSectionList count={3} variant="full" />
            ) : facilities.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={32} color={Colors.text.tertiary} />
                <Text style={styles.emptyText}>
                  {selectedSport
                    ? `لا يوجد ملاعب ${SPORT_LABELS_AR[selectedSport] ?? selectedSport} متاحة حالياً`
                    : 'لا يوجد ملاعب'}
                </Text>
              </View>
            ) : (
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
            )}
          </FadeSlideIn>

          {/* Top rated */}
          {(topRated.length > 0 || popularLoading) && (
            <FadeSlideIn delay={200}>
              <SectionHeader
                title="الأعلى تقييماً"
                onSeeAll={() => router.push({ pathname: '/search', params: { sport: selectedSport, sortBy: 'rating' } })}
              />
              {popularLoading ? (
                <SkeletonSectionList count={3} variant="full" />
              ) : (
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
              )}
            </FadeSlideIn>
          )}

          {/* Featured */}
          {featured.length > 0 && (
            <FadeSlideIn delay={240}>
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
            </FadeSlideIn>
          )}

          {/* Nearby */}
          <FadeSlideIn delay={280}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View style={styles.sectionIconBubble}>
                  <Ionicons name="location-sharp" size={13} color={Colors.brand.primary} />
                </View>
                <Text style={[Typography.h3, { color: Colors.text.primary }]}>قريب منك</Text>
              </View>
              {coords && (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/search', params: { sortBy: 'nearest' } })}
                  style={styles.seeAllBtn}
                >
                  <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>عرض الكل</Text>
                </TouchableOpacity>
              )}
            </View>

            {!coords ? (
              <TouchableOpacity style={styles.locationPrompt} onPress={requestLocation} activeOpacity={0.8}>
                <Ionicons name="location-outline" size={28} color={Colors.brand.primary} />
                <Text style={styles.locationPromptTitle}>فعّل الموقع لرؤية الملاعب القريبة</Text>
                <Text style={styles.locationPromptSub}>اضغط هنا للسماح بالوصول إلى موقعك</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.distanceRow}>
                  {DISTANCE_OPTIONS.map((km) => (
                    <TouchableOpacity
                      key={km}
                      onPress={() => setNearbyRadius(km)}
                      style={[styles.distanceChip, nearbyRadius === km && styles.distanceChipActive]}
                    >
                      <Text style={[styles.distanceChipText, nearbyRadius === km && styles.distanceChipTextActive]}>
                        {km} كم
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {nearby.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="location-outline" size={32} color={Colors.text.tertiary} />
                    <Text style={styles.emptyText}>لا يوجد ملاعب ضمن {nearbyRadius} كم منك</Text>
                  </View>
                ) : (
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
                )}
              </>
            )}
          </FadeSlideIn>

          {/* Available today */}
          {bookedToday.length > 0 && (
            <FadeSlideIn delay={320}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <View style={styles.sectionIconBubble}>
                    <Ionicons name="calendar-outline" size={15} color={Colors.brand.primary} />
                  </View>
                  <Text style={[Typography.h3, { color: Colors.text.primary }]}>
                    {selectedSport
                      ? `ملاعب ${SPORT_LABELS_AR[selectedSport] ?? selectedSport} اليوم`
                      : 'الملاعب المتاحة اليوم'}
                  </Text>
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
            </FadeSlideIn>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Weather Panel */}
      <WeatherPanel visible={weatherOpen} onClose={() => setWeatherOpen(false)} />
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
  headerActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },

  headerIconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  weatherTemp: {
    fontSize: 14, fontWeight: '700', color: '#fff',
  },

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
    flex: 1, color: Colors.text.primary, fontSize: 15, textAlign: 'right',
  },
  searchIconBubble: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
  },

  section: { paddingHorizontal: Spacing.xl },

  bannerRow: { paddingBottom: Spacing.lg, gap: Spacing.md },
  bannerCard: {
    width: BANNER_W, height: 150, borderRadius: Radius.xl,
    overflow: 'hidden', backgroundColor: Colors.background.secondary,
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  bannerTextWrap: { position: 'absolute', right: 16, bottom: 12, left: 16 },
  bannerTitle: { ...Typography.labelLg, color: '#fff', marginBottom: 4, textAlign: 'right' },
  bannerSubtitle: { ...Typography.bodySm, color: 'rgba(255,255,255,0.85)', textAlign: 'right' },

  sectionTitle: { color: Colors.text.primary, marginBottom: Spacing.md },
  chipsListBreakout: { marginHorizontal: -Spacing.xl, marginBottom: Spacing.xl },
  chipsContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm },

  sectionHeaderRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md, marginTop: Spacing.lg,
  },
  sectionTitleGroup: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  sectionIconBubble: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.brand.light, borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
  },
  seeAllBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
  },

  listBreakout: { marginHorizontal: -Spacing.xl },
  listContent: { paddingHorizontal: Spacing.xl },

  carouselCard: { width: 195 },
  compactCard:  { width: 210 },

  distanceRow: { flexDirection: 'row-reverse', gap: Spacing.sm, marginBottom: Spacing.md },
  distanceChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full,
    backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default,
  },
  distanceChipActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary },
  distanceChipText: { fontSize: 12, fontWeight: '600', color: Colors.text.secondary },
  distanceChipTextActive: { color: '#fff' },

  offersBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full,
    backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A',
  },
  offersBadgeText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  offerCard: {
    width: 160, backgroundColor: Colors.background.elevated, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.md, gap: Spacing.xs,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  offerDiscountBadge: {
    alignSelf: 'flex-end', backgroundColor: '#FEF3C7', borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4,
  },
  offerDiscountText: { fontSize: 12, fontWeight: '800', color: '#D97706' },
  offerFacilityName: { fontSize: 13, fontWeight: '700', color: Colors.text.primary, textAlign: 'right' },
  offerTime: { fontSize: 11, color: Colors.text.tertiary, textAlign: 'right' },
  offerPriceRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 4 },
  offerNewPrice: { fontSize: 14, fontWeight: '800', color: Colors.brand.primary },
  offerOldPrice: { fontSize: 11, color: Colors.text.tertiary, textDecorationLine: 'line-through' },

  locationPrompt: {
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.xl, backgroundColor: Colors.brand.light, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.brand.border, borderStyle: 'dashed', marginBottom: Spacing.lg,
  },
  locationPromptTitle: { fontSize: 14, fontWeight: '700', color: Colors.brand.primary },
  locationPromptSub: { fontSize: 12, color: Colors.text.tertiary },

  emptyState: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm,
    backgroundColor: Colors.background.secondary, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border.default, marginBottom: Spacing.md,
  },
  emptyText: { fontSize: 13, color: Colors.text.tertiary, textAlign: 'center' },
});
