import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FacilityCard } from '../src/components/FacilityCard';
import { SportChip } from '../src/components/SportChip';
import { facilitiesApi } from '../src/api/facilities.api';
import { useLocationStore } from '../src/store/location.store';
import { Colors, Typography, Spacing, Radius } from '../src/theme';
import type { SportType } from '@yallaplay/shared-types';

const SPORTS: SportType[] = ['football', 'basketball', 'tennis', 'volleyball', 'padel', 'squash'];
const SORT_OPTIONS = [
  { key: 'popular',   label: 'الأشهر' },
  { key: 'nearest',   label: 'الأقرب' },
  { key: 'price_asc', label: 'الأرخص' },
  { key: 'rating',    label: 'الأعلى تقييماً' },
] as const;

type SortKey = typeof SORT_OPTIONS[number]['key'];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ query?: string; sport?: string; sortBy?: string }>();
  const { coords } = useLocationStore();

  const [search, setSearch]       = useState(params.query ?? '');
  const [sport, setSport]         = useState<SportType | undefined>(params.sport as SportType | undefined);
  const [sortBy, setSortBy]       = useState<SortKey>((params.sortBy as SortKey) ?? 'popular');
  const [page, setPage]           = useState(1);
  const [inputText, setInputText] = useState(params.query ?? '');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', search, sport, sortBy, coords, page],
    queryFn: () => facilitiesApi.search({
      query: search || undefined,
      sport,
      sortBy,
      page,
      limit: 20,
      ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
    }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const facilities = data?.data?.data?.facilities ?? [];
  const pagination = data?.data?.data?.pagination;

  const handleSearch = useCallback(() => {
    setSearch(inputText.trim());
    setPage(1);
  }, [inputText]);

  const handleLoadMore = () => {
    if (pagination && page < pagination.totalPages && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[Typography.bodyLg, { color: Colors.text.secondary }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              placeholder="ابحث عن ملعب..."
              placeholderTextColor={Colors.text.tertiary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSearch}
              autoFocus={!params.query}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {inputText.length > 0 && (
              <TouchableOpacity onPress={() => { setInputText(''); setSearch(''); }}>
                <Text style={{ color: Colors.text.tertiary, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sport filter */}
        <View style={{ marginBottom: Spacing.md }}>
          <FlatList
            data={SPORTS}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: 8 }}
            keyExtractor={(s) => s}
            renderItem={({ item }) => (
              <SportChip
                sport={item}
                selected={sport === item}
                onPress={() => { setSport((prev) => prev === item ? undefined : item); setPage(1); }}
              />
            )}
            ListHeaderComponent={
              <SportChip
                sport="football"
                selected={!sport}
                onPress={() => { setSport(undefined); setPage(1); }}
                style={{ marginRight: 8 }}
              />
            }
          />
        </View>

        {/* Sort tabs */}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => { setSortBy(opt.key); setPage(1); }}
              style={[styles.sortTab, sortBy === opt.key && styles.sortTabActive]}
            >
              <Text style={[
                Typography.labelSm,
                { color: sortBy === opt.key ? Colors.brand.primary : Colors.text.tertiary },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Results */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.huge }} />
        ) : facilities.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🏟️</Text>
            <Text style={[Typography.h3, { color: Colors.text.secondary, marginTop: Spacing.lg }]}>
              لم يتم العثور على نتائج
            </Text>
            <Text style={[Typography.bodyMd, { color: Colors.text.tertiary, marginTop: Spacing.sm }]}>
              جرّب بحثاً مختلفاً أو غيّر الفلاتر
            </Text>
          </View>
        ) : (
          <FlatList
            data={facilities}
            keyExtractor={(f) => f._id}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <FacilityCard
                facility={item}
                onPress={() => router.push(`/facility/${item._id}`)}
              />
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={
              <Text style={[Typography.labelMd, { color: Colors.text.tertiary, marginBottom: Spacing.md, textAlign: 'right' }]}>
                {pagination?.total ?? facilities.length} نتيجة
              </Text>
            }
            ListFooterComponent={
              isFetching && page > 1
                ? <ActivityIndicator color={Colors.brand.primary} style={{ marginVertical: Spacing.xl }} />
                : null
            }
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.border.default,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1, color: Colors.text.primary,
    fontSize: 15, textAlign: 'right',
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sortTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
  },
  sortTabActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.light,
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.huge,
  },
});
