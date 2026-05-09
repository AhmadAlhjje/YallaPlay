import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, Alert, Platform, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapSection } from '../../src/components/MapSection';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { facilitiesApi } from '../../src/api/facilities.api';
import { waitlistApi } from '../../src/api/waitlist.api';
import { SlotButton } from '../../src/components/SlotButton';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
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
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

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

  const facility = facilityRes?.data?.data;
  const slots: SlotDtoType[] = slotsRes?.data?.data ?? [];

  const images: string[] = facility?.images?.length
    ? facility.images
    : ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800'];

  const handleBookNow = () => {
    if (!selectedSlot) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/booking/new',
      params: {
        facilityId: id,
        facilityName: facility?.name,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        price: String(selectedSlot.discountedPrice ?? selectedSlot.price),
        sport: facility?.sport?.[0] ?? '',
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
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
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
            {images.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={styles.heroImage}
                contentFit="cover"
                transition={300}
              />
            ))}
          </ScrollView>

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(10,14,26,0.85)']}
            style={styles.heroGradient}
          />

          {/* Back button */}
          <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { top: insets.top + 8 }]}
            >
              <BlurView intensity={60} style={styles.backBtnBlur}>
                <Text style={{ color: Colors.text.primary, fontSize: 16 }}>← </Text>
              </BlurView>
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
          {/* Name + rating */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.h2, { color: Colors.text.primary }]}>{facility.name}</Text>
              <Text style={[Typography.bodyMd, { color: Colors.text.secondary, marginTop: 4 }]}>
                📍 {facility.address}
              </Text>
            </View>
            {facility.rating > 0 && (
              <View style={styles.ratingBadge}>
                <Text style={[Typography.labelMd, { color: Colors.warning }]}>⭐ {facility.rating?.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Sport tags */}
          <View style={[styles.row, { flexWrap: 'wrap', gap: 8, marginTop: Spacing.md }]}>
            {(facility.sport ?? []).map((s: string) => (
              <View
                key={s}
                style={[styles.sportTag, { backgroundColor: (Colors.sport as any)[s] + '22', borderColor: (Colors.sport as any)[s] + '55' }]}
              >
                <Text style={[Typography.labelSm, { color: (Colors.sport as any)[s] }]}>
                  {SPORT_LABELS[s] ?? s}
                </Text>
              </View>
            ))}
          </View>

          {/* Quick stats */}
          <GlassCard style={styles.statsCard}>
            <StatItem icon="💵" label="السعر / ساعة" value={`${facility.pricePerHour} ر.س`} />
            <View style={styles.divider} />
            <StatItem icon="📞" label="اتصال" value={facility.phone ?? '—'} onPress={callFacility} />
            <View style={styles.divider} />
            <StatItem icon="🏟️" label="الحجوزات" value={String(facility.totalBookings ?? 0)} />
          </GlassCard>

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
              <Text style={[Typography.h3, styles.sectionTitle]}>الموقع</Text>
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
          <BlurView intensity={80} style={StyleSheet.absoluteFill} />
          <View style={styles.bottomContent}>
            <View>
              <Text style={[Typography.labelMd, { color: Colors.text.secondary }]}>
                {selectedSlot.startTime} – {selectedSlot.endTime}
              </Text>
              <Text style={[Typography.h3, { color: Colors.text.primary }]}>
                {selectedSlot.discountedPrice ?? selectedSlot.price} ر.س
              </Text>
            </View>
            {canBook ? (
              <TouchableOpacity onPress={handleBookNow} style={styles.bookBtn}>
                <LinearGradient colors={Colors.brand.gradient} style={styles.bookBtnGrad}>
                  <Text style={[Typography.labelLg, { color: '#fff' }]}>احجز الآن</Text>
                </LinearGradient>
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
    </View>
  );
}

function StatItem({ icon, label, value, onPress }: { icon: string; label: string; value: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[Typography.labelSm, { color: Colors.text.tertiary, marginTop: 4 }]}>{label}</Text>
      <Text style={[Typography.labelMd, { color: onPress ? Colors.brand.primary : Colors.text.primary }]}>{value}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  center: { alignItems: 'center', justifyContent: 'center' },
  galleryContainer: { width: SCREEN_W, height: 280 },
  heroImage: { width: SCREEN_W, height: 280 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  backBtn: { position: 'absolute', left: Spacing.xl, zIndex: 10 },
  backBtnBlur: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.glass.border,
  },
  dots: {
    position: 'absolute', bottom: 12,
    flexDirection: 'row', alignSelf: 'center', gap: 6,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: '#fff', width: 18 },
  body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center' },
  ratingBadge: {
    backgroundColor: Colors.warningBg,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sportTag: {
    borderWidth: 1, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  statsCard: { marginTop: Spacing.xl, flexDirection: 'row', padding: Spacing.lg },
  statItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: Colors.glass.border, marginVertical: 4 },
  sectionTitle: { color: Colors.text.primary, marginTop: Spacing.xl, marginBottom: Spacing.md },
  mapContainer: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.md },
  map: { width: '100%', height: 180 },
  mapOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background.primary + 'CC',
    paddingVertical: 10, paddingHorizontal: Spacing.xl,
    alignItems: 'flex-end',
  },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    backgroundColor: Colors.glass.subtle,
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
    borderTopWidth: 1, borderTopColor: Colors.glass.border,
    overflow: 'hidden',
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
  },
  bookBtnGrad: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  waitlistBtn: {
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.brand.primary + '15',
  },
});
