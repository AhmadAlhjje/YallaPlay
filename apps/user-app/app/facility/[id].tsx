import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Pressable, Modal,
  Dimensions, Alert, Platform, Linking, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapSection } from '../../src/components/MapSection';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facilitiesApi } from '../../src/api/facilities.api';
import { waitlistApi } from '../../src/api/waitlist.api';
import { SlotButton } from '../../src/components/SlotButton';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { formatTimeRange } from '../../src/lib/time';
import { GlassCard } from '../../src/components/GlassCard';
import type { SlotDtoType } from '@yallaplay/shared-types';

const { width: SCREEN_W } = Dimensions.get('window');

const SPORT_LABELS: Record<string, string> = {
  football: 'كرة القدم',
  basketball: 'كرة السلة',
  tennis: 'تنس',
  volleyball: 'كرة الطائرة',
  padel: 'بادل',
  squash: 'إسكواش',
};

const SPORT_IMAGES: Record<string, any[]> = {
  football: [
    require('../../assets/football-1.webp'),
    require('../../assets/football-2.webp'),
    require('../../assets/football-3.jpg'),
  ],
  basketball: [
    require('../../assets/basketball-1.webp'),
    require('../../assets/basketball-2.webp'),
  ],
};
const FALLBACK_IMAGES = [
  require('../../assets/football-1.webp'),
  require('../../assets/football-2.webp'),
];

function buildDateList(days = 14) {
  const list: { date: string; label: string; dayName: string }[] = [];
  const today = new Date();
  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    list.push({
      date: `${yyyy}-${mm}-${dd}`,
      label: `${d.getDate()} ${monthNames[d.getMonth()]}`,
      dayName: i === 0 ? 'اليوم' : i === 1 ? 'غداً' : dayNames[d.getDay()],
    });
  }
  return list;
}

const DATE_LIST = buildDateList();

export default function FacilityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(DATE_LIST[0].date);
  const [selectedSlot, setSelectedSlot] = useState<SlotDtoType | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const galleryRef = useRef<FlatList<string>>(null);
  const qc = useQueryClient();

  const { data: facilityRes, isLoading: facilityLoading } = useQuery({
    queryKey: ['facility', id],
    queryFn: () => facilitiesApi.getById(id),
    staleTime: 300_000,
  });

  const { data: slotsRes, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', id, selectedDate],
    queryFn: () => facilitiesApi.getSlots(id, selectedDate),
    staleTime: 30_000,
  });

  const { data: myRatingRes } = useQuery({
    queryKey: ['my-rating', id],
    queryFn: () => facilitiesApi.getMyRating(id),
    staleTime: 300_000,
  });

  const myRating: number = myRatingRes?.data?.data ?? 0;

  const { mutate: submitRating, isPending: ratingLoading } = useMutation({
    mutationFn: (value: number) => facilitiesApi.rate(id, value),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['facility', id] });
      qc.invalidateQueries({ queryKey: ['my-rating', id] });
    },
    onError: () => {
      Alert.alert('خطأ', 'تعذّر إرسال التقييم. حاول مرة أخرى.');
      setPendingRating(0);
    },
  });

  const handleRate = (value: number) => {
    setPendingRating(value);
    submitRating(value);
  };

  const facility = facilityRes?.data?.data;
  const slots: SlotDtoType[] = slotsRes?.data?.data ?? [];

  const primarySport = (facility?.sports ?? [])[0];
  const imageSport = primarySport ?? 'football';
  const images: any[] = SPORT_IMAGES[imageSport] ?? FALLBACK_IMAGES;

  const handleBookNow = () => {
    if (!selectedSlot) return;
    if (!primarySport) {
      Alert.alert('خطأ', 'لم يتم تحديد الرياضة لهذا الملعب بعد.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/booking/new',
      params: {
        facilityId: id,
        facilityName: facility?.name,
        shamCashQr: facility?.shamCashQr ?? '',
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        price: String(selectedSlot.discountedPrice ?? selectedSlot.price),
        sport: primarySport,
      },
    });
  };

  const handleJoinWaitlist = async () => {
    if (!selectedSlot) return;
    setJoiningWaitlist(true);
    try {
      await waitlistApi.join({ facilityId: id, date: selectedDate, startTime: selectedSlot.startTime });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('تم الانضمام', 'سيتم إشعارك عندما يصبح الوقت متاحاً');
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message ?? 'تعذّر الانضمام للقائمة');
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const callFacility = () => {
    if (facility?.phone) Linking.openURL(`tel:${facility.phone}`);
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
    requestAnimationFrame(() => {
      galleryRef.current?.scrollToIndex({ index, animated: false });
    });
  };

  if (facilityLoading || !facility) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>جاري التحميل...</Text>
      </View>
    );
  }

  const hasCoords = facility.location?.coordinates?.length === 2;
  const selectedSlotBooked = selectedSlot?.status === 'booked';
  const canBook = selectedSlot?.status === 'available';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setImageIndex(idx);
            }}
            scrollEventThrottle={200}
          >
            {images.map((src, i) => (
              <Pressable key={i} onPress={() => openGallery(i)} style={styles.heroImagePressable}>
                <Image
                  source={src}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={300}
                />
              </Pressable>
            ))}
          </ScrollView>

          {/* Dark overlay at bottom */}
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              style={[styles.backBtn, { top: insets.top + 8 }]}
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Image pagination dots */}
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Info section */}
        <View style={styles.body}>
          {/* Name */}
          <Text style={styles.facilityName}>{facility.name}</Text>

          {/* Address */}
          <View style={styles.addressRow}>
            <View style={styles.pinBadge}>
              <Ionicons name="location-sharp" size={13} color={Colors.brand.primary} />
            </View>
            <Text style={styles.addressText} numberOfLines={2}>{facility.address}</Text>
          </View>

          {/* Rating + Sport chips row */}
          <View style={styles.metaRow}>
            {/* Sport chips */}
            <View style={styles.sportChipsWrap}>
              {(facility.sports ?? []).map((s: string) => (
                <View key={s} style={styles.sportTag}>
                  <Text style={styles.sportTagText}>{SPORT_LABELS[s] ?? s}</Text>
                </View>
              ))}
            </View>

            {/* Rating */}
            {facility.rating > 0 && (
              <View style={styles.ratingCard}>
                <Text style={styles.ratingNumber}>{facility.rating?.toFixed(1)}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Ionicons
                      key={i}
                      name={i <= Math.round(facility.rating) ? 'star' : 'star-outline'}
                      size={10}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={styles.ratingLabel}>تقييم</Text>
              </View>
            )}
          </View>

          {/* Stats row — 3 cards */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={facility.phone ? callFacility : undefined}
              activeOpacity={facility.phone ? 0.75 : 1}
            >
              <View style={[styles.statIcon, { backgroundColor: Colors.brand.light }]}>
                <Ionicons name="call" size={17} color={Colors.brand.primary} />
              </View>
              <Text style={styles.statValue} numberOfLines={1}>{facility.phone ?? '—'}</Text>
              <Text style={styles.statLabel}>اتصال بالملعب</Text>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="pricetag" size={17} color="#D97706" />
              </View>
              <Text style={styles.statValue}>{facility.pricePerSlot ?? 0} ر.س</Text>
              <Text style={styles.statLabel}>سعر الحصة</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="calendar" size={17} color="#7C3AED" />
              </View>
              <Text style={styles.statValue}>{facility.totalBookings ?? 0}</Text>
              <Text style={styles.statLabel}>إجمالي الحجوزات</Text>
            </View>
          </View>

          {/* User Rating */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingSectionTitle}>
              {myRating > 0 ? 'تقييمك للملعب' : 'قيّم هذا الملعب'}
            </Text>
            <View style={styles.starsInteractive}>
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (pendingRating || myRating);
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRate(star)}
                    disabled={ratingLoading}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <Ionicons
                      name={active ? 'star' : 'star-outline'}
                      size={32}
                      color={active ? '#F59E0B' : Colors.border.strong}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            {facility.ratingCount > 0 && (
              <Text style={styles.ratingCountText}>
                {facility.rating?.toFixed(1)} من 5 · {facility.ratingCount} تقييم
              </Text>
            )}
          </View>

          {/* Description */}
          {!!facility.description && (
            <>
              <Text style={[Typography.h3, styles.sectionTitle]}>عن الملعب</Text>
              <Text style={[Typography.bodyMd, { color: Colors.text.secondary, lineHeight: 22 }]}>
                {facility.description}
              </Text>
            </>
          )}

          {/* Map */}
          {hasCoords && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionPinBadge}>
                  <Ionicons name="location-sharp" size={14} color={Colors.brand.primary} />
                </View>
                <Text style={styles.sectionTitleText}>الموقع</Text>
              </View>
              <MapSection
                latitude={facility.location.coordinates[1]}
                longitude={facility.location.coordinates[0]}
                title={facility.name}
              />
            </>
          )}

          {/* Date Picker */}
          <Text style={[Typography.h3, styles.sectionTitle]}>اختر التاريخ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.xl }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: 10 }}>
              {DATE_LIST.map((d) => {
                const active = d.date === selectedDate;
                return (
                  <TouchableOpacity
                    key={d.date}
                    onPress={() => { setSelectedDate(d.date); setSelectedSlot(null); }}
                    style={[styles.dateChip, active && styles.dateChipActive]}
                  >
                    <Text style={[Typography.labelSm, { color: active ? '#fff' : Colors.text.tertiary }]}>
                      {d.dayName}
                    </Text>
                    <Text style={[Typography.numericSm, { color: active ? '#fff' : Colors.text.secondary }]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Slot Grid */}
          <Text style={[Typography.h3, styles.sectionTitle]}>الأوقات المتاحة</Text>
          {slotsLoading ? (
            <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, textAlign: 'center', paddingVertical: Spacing.xl }]}>
              جاري تحميل الأوقات...
            </Text>
          ) : slots.length === 0 ? (
            <GlassCard style={{ padding: Spacing.xl, alignItems: 'center' }}>
              <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>لا توجد أوقات متاحة لهذا اليوم</Text>
            </GlassCard>
          ) : (
            <View style={styles.slotGrid}>
              {slots.map((slot, i) => (
                <SlotButton
                  key={i}
                  slot={slot}
                  selected={selectedSlot?.startTime === slot.startTime}
                  onPress={() => setSelectedSlot((prev) => prev?.startTime === slot.startTime ? null : slot)}
                  style={{ flex: 1, minWidth: '30%' }}
                />
              ))}
            </View>
          )}

          {/* Legend */}
          <View style={[styles.row, { gap: 16, marginTop: Spacing.sm }]}>
            {[
              { color: Colors.slot.available, label: 'متاح' },
              { color: Colors.slot.booked, label: 'محجوز' },
              { color: Colors.slot.pending, label: 'معلّق' },
              { color: Colors.slot.closed, label: 'مغلق' },
            ].map((l) => (
              <View key={l.label} style={[styles.row, { gap: 4 }]}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={[Typography.labelSm, { color: Colors.text.tertiary }]}>{l.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {selectedSlot && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bottomContent}>
            <View>
              <Text style={[Typography.labelMd, { color: Colors.text.secondary }]}>
                {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
              </Text>
              <Text style={[Typography.h3, { color: Colors.text.primary }]}>
                {selectedSlot.discountedPrice ?? selectedSlot.price} ر.س
              </Text>
            </View>
            {canBook ? (
              <TouchableOpacity onPress={handleBookNow} style={styles.bookBtn}>
                <Text style={[Typography.labelLg, { color: '#fff' }]}>احجز الآن</Text>
              </TouchableOpacity>
            ) : selectedSlotBooked ? (
              <TouchableOpacity
                onPress={handleJoinWaitlist}
                disabled={joiningWaitlist}
                style={[styles.bookBtn, styles.waitlistBtn]}
              >
                <Text style={[Typography.labelLg, { color: Colors.brand.primary }]}>
                  {joiningWaitlist ? 'جاري...' : 'انضم للقائمة'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      <Modal
        visible={galleryOpen}
        animationType="fade"
        onRequestClose={() => setGalleryOpen(false)}
      >
        <View style={styles.galleryModal}>
          <StatusBar barStyle="light-content" />
          <FlatList
            ref={galleryRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => String(idx)}
            getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
            initialScrollIndex={galleryIndex}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setGalleryIndex(idx);
            }}
            scrollEventThrottle={200}
            renderItem={({ item }) => (
              <View style={styles.gallerySlide}>
                <Image source={item} style={styles.galleryImage} contentFit="contain" />
              </View>
            )}
          />
          <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={styles.galleryTopBar}>
              <TouchableOpacity
                onPress={() => setGalleryOpen(false)}
                style={styles.galleryCloseBtn}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.galleryCounter}>
                <Text style={styles.galleryCounterText}>{galleryIndex + 1} / {images.length}</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  center: { alignItems: 'center', justifyContent: 'center' },
  galleryContainer: { width: SCREEN_W, height: 280, position: 'relative' },
  heroImagePressable: { width: SCREEN_W, height: 280 },
  heroImage: { width: SCREEN_W, height: 280 },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backBtn: {
    position: 'absolute', right: Spacing.xl, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  dots: {
    position: 'absolute', bottom: 12,
    flexDirection: 'row', alignSelf: 'center', gap: 6,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: '#fff', width: 18 },
  body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center' },

  facilityName: {
    fontSize: 22, fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'right',
    marginBottom: 8,
  },
  addressRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, marginBottom: Spacing.md },
  addressText: {
    flex: 1, fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'right', lineHeight: 20,
  },
  pinBadge: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },

  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sportChipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    marginLeft: Spacing.md,
  },
  sportTag: {
    borderWidth: 1, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: Colors.brand.light,
    borderColor: Colors.brand.border,
  },
  sportTagText: { fontSize: 12, fontWeight: '600', color: Colors.brand.dark },

  ratingCard: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.lg,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#FDE68A',
    minWidth: 62,
  },
  ratingNumber: { fontSize: 20, fontWeight: '800', color: '#92400E', lineHeight: 24 },
  starsRow: { flexDirection: 'row', gap: 1, marginTop: 2 },
  ratingLabel: { fontSize: 10, color: '#92400E', marginTop: 2, fontWeight: '500' },

  statsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.lg,
    paddingVertical: 14, paddingHorizontal: 6,
    borderWidth: 1, borderColor: Colors.border.strong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    gap: 6,
  },
  statIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: {
    fontSize: 13, fontWeight: '700',
    color: Colors.text.primary, textAlign: 'center',
  },
  statLabel: {
    fontSize: 10, color: Colors.text.tertiary,
    textAlign: 'center', lineHeight: 13,
  },

  sectionTitle: { color: Colors.text.primary, marginTop: Spacing.xl, marginBottom: Spacing.md },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionPinBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  sectionTitleText: {
    fontSize: 17, fontWeight: '700', color: Colors.text.primary,
  },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
    minWidth: 72,
  },
  dateChipActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, borderTopColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 8,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  bookBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    minWidth: 140,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  waitlistBtn: {
    backgroundColor: Colors.brand.light,
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
  },
  galleryModal: { flex: 1, backgroundColor: '#000' },
  gallerySlide: { width: SCREEN_W, height: '100%', alignItems: 'center', justifyContent: 'center' },
  galleryImage: { width: SCREEN_W, height: '100%' },
  galleryTopBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  galleryCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  galleryCounter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  galleryCounterText: { color: '#fff', fontSize: 12 },

  ratingSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginVertical: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: Spacing.sm,
  },
  ratingSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  starsInteractive: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ratingCountText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
});
