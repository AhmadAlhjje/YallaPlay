import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { FacilityCard } from '../../src/components/FacilityCard';
import { useLocationStore } from '../../src/store/location.store';
import { facilitiesApi } from '../../src/api/facilities.api';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

const DISTANCE_OPTIONS = [1, 3, 5, 10, 20] as const;
type DistanceKm = typeof DISTANCE_OPTIONS[number];

const SPORT_FILTERS = [
  { key: undefined,      label: 'الكل',        emoji: '🏟️' },
  { key: 'football',     label: 'كرة القدم',   emoji: '⚽' },
  { key: 'basketball',   label: 'كرة السلة',   emoji: '🏀' },
  { key: 'tennis',       label: 'تنس',         emoji: '🎾' },
  { key: 'volleyball',   label: 'طائرة',       emoji: '🏐' },
  { key: 'padel',        label: 'بادل',        emoji: '🏓' },
  { key: 'squash',       label: 'إسكواش',      emoji: '🎱' },
] as const;

export default function NearbyScreen() {
  const { coords, requestLocation, permissionGranted } = useLocationStore();
  const [radius, setRadius]   = useState<DistanceKm>(5);
  const [sport, setSport]     = useState<string | undefined>(undefined);

  useEffect(() => { if (!coords) requestLocation(); }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['nearby-tab', coords, radius, sport],
    queryFn: () => facilitiesApi.search({
      sortBy: 'nearest',
      limit: 20,
      latitude: coords!.latitude,
      longitude: coords!.longitude,
      radiusKm: radius,
      sport: sport as any,
    }),
    enabled: !!coords,
    staleTime: 60_000,
  });

  const facilities = data?.data?.data?.facilities ?? [];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.title}>الملاعب القريبة منك</Text>
        {coords && (
          <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
            <Ionicons name="refresh-outline" size={20} color={Colors.brand.primary} />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {!coords ? (
        /* ── No location permission ───────────────────────── */
        <View style={styles.permissionCard}>
          <Ionicons name="location-outline" size={52} color={Colors.brand.primary} />
          <Text style={styles.permissionTitle}>الموقع غير مفعّل</Text>
          <Text style={styles.permissionSub}>
            فعّل الموقع لعرض الملاعب القريبة منك وتحديد المسافة
          </Text>
          <TouchableOpacity onPress={requestLocation} style={styles.permissionBtn}>
            <Ionicons name="location-sharp" size={16} color="#fff" />
            <Text style={styles.permissionBtnText}>تفعيل الموقع</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ── Distance filter ───────────────────────────── */}
          <View style={styles.distanceRow}>
            <Ionicons name="navigate-circle-outline" size={16} color={Colors.text.tertiary} />
            {DISTANCE_OPTIONS.map((km) => (
              <TouchableOpacity
                key={km}
                onPress={() => setRadius(km)}
                style={[styles.distanceChip, radius === km && styles.distanceChipActive]}
              >
                <Text style={[styles.distanceChipText, radius === km && styles.distanceChipTextActive]}>
                  {km} كم
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Sport filter ──────────────────────────────── */}
          <FlatList
            horizontal
            inverted
            data={SPORT_FILTERS}
            keyExtractor={(s) => s.label}
            showsHorizontalScrollIndicator={false}
            style={styles.sportList}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSport(item.key as any)}
                style={[styles.sportChip, sport === item.key && styles.sportChipActive]}
              >
                <Text style={styles.sportEmoji}>{item.emoji}</Text>
                <Text style={[styles.sportLabel, sport === item.key && styles.sportLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* ── Results ──────────────────────────────────── */}
          {isLoading ? (
            <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 60 }} />
          ) : facilities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={44} color={Colors.text.tertiary} />
              <Text style={styles.emptyTitle}>لا يوجد ملاعب ضمن {radius} كم</Text>
              <Text style={styles.emptySub}>جرّب توسيع نطاق البحث</Text>
              <TouchableOpacity
                onPress={() => setRadius(DISTANCE_OPTIONS[DISTANCE_OPTIONS.indexOf(radius) + 1] ?? 20)}
                style={styles.expandBtn}
              >
                <Text style={styles.expandBtnText}>توسيع النطاق</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={facilities}
              keyExtractor={(f) => f._id}
              numColumns={2}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={refetch}
              renderItem={({ item }) => (
                <FacilityCard
                  facility={item}
                  onPress={() => router.push(`/facility/${item._id}`)}
                  style={styles.gridCard}
                />
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text.primary },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Permission card
  permissionCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.huge, gap: Spacing.lg,
  },
  permissionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  permissionSub: {
    fontSize: 14, color: Colors.text.secondary,
    textAlign: 'center', lineHeight: 22,
  },
  permissionBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.full, marginTop: Spacing.md,
  },
  permissionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Distance filter
  distanceRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    gap: Spacing.sm, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  distanceChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  distanceChipActive: {
    backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary,
  },
  distanceChipText: { fontSize: 12, fontWeight: '600', color: Colors.text.secondary },
  distanceChipTextActive: { color: '#fff' },

  // Sport filter
  sportList: { maxHeight: 46, marginBottom: Spacing.sm },
  sportChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
  },
  sportChipActive: {
    backgroundColor: Colors.brand.light, borderColor: Colors.brand.primary,
  },
  sportEmoji: { fontSize: 14 },
  sportLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.secondary },
  sportLabelActive: { color: Colors.brand.primary },

  // Grid
  grid: { paddingHorizontal: Spacing.xl, paddingBottom: 120, paddingTop: Spacing.sm },
  gridRow: { gap: Spacing.md, justifyContent: 'space-between' },
  gridCard: { flex: 1 },

  // Empty state
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, paddingHorizontal: Spacing.huge,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.secondary },
  emptySub: { fontSize: 13, color: Colors.text.tertiary },
  expandBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.brand.primary, backgroundColor: Colors.brand.light,
    marginTop: Spacing.sm,
  },
  expandBtnText: { fontSize: 14, fontWeight: '700', color: Colors.brand.primary },
});
