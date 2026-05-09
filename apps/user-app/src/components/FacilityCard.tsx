import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface FacilityCardProps {
  facility: any;
  onPress: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽', basketball: '🏀', tennis: '🎾',
  volleyball: '🏐', padel: '🏸', squash: '🟡', swimming: '🏊',
};

export function FacilityCard({ facility, onPress, style, compact = false }: FacilityCardProps) {
  const sportIcons = (facility.sports ?? [])
    .slice(0, 3)
    .map((s: string) => SPORT_EMOJI[s] ?? '🏅')
    .join(' ');

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.compactWrapper, style]}>
        <GlassCard style={styles.compactCard} noShadow>
          <Image
            source={{ uri: facility.images?.[0] ?? 'https://via.placeholder.com/80' }}
            style={styles.compactImage}
            contentFit="cover"
          />
          <View style={styles.compactInfo}>
            <Text style={[Typography.labelLg, { color: Colors.text.primary }]} numberOfLines={1}>
              {facility.name}
            </Text>
            <Text style={[Typography.bodySm, { color: Colors.text.secondary }]} numberOfLines={1}>
              {facility.address}
            </Text>
            <View style={styles.row}>
              <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>
                {facility.pricePerSlot} ر.س
              </Text>
              <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginLeft: 8 }]}>
                {sportIcons}
              </Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, style]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: facility.images?.[0] ?? 'https://via.placeholder.com/400x220' }}
          style={styles.image}
          contentFit="cover"
        />
        {/* Gradient overlay on image */}
        <LinearGradient
          colors={['transparent', 'rgba(10,14,26,0.85)']}
          style={StyleSheet.absoluteFill}
        />
        {/* Sport tags on image */}
        <View style={styles.sportTagRow}>
          {(facility.sports ?? []).slice(0, 3).map((s: string) => (
            <View key={s} style={styles.sportTag}>
              <Text style={[Typography.labelSm, { color: Colors.text.primary }]}>
                {SPORT_EMOJI[s] ?? '🏅'} {s}
              </Text>
            </View>
          ))}
        </View>
        {/* Price badge */}
        <View style={styles.priceBadge}>
          <Text style={[Typography.labelMd, { color: '#fff' }]}>
            {facility.pricePerSlot} ر.س / ساعة
          </Text>
        </View>
      </View>

      {/* Card body */}
      <View style={styles.body}>
        <Text style={[Typography.h3, { color: Colors.text.primary }]} numberOfLines={1}>
          {facility.name}
        </Text>
        <Text style={[Typography.bodySm, { color: Colors.text.secondary, marginTop: 2 }]} numberOfLines={1}>
          📍 {facility.address}
        </Text>
        <View style={[styles.row, { marginTop: Spacing.sm }]}>
          <View style={styles.ratingBadge}>
            <Text style={[Typography.labelSm, { color: Colors.warning }]}>
              ⭐ {facility.rating?.toFixed(1) ?? '–'}
            </Text>
          </View>
          <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginLeft: Spacing.sm }]}>
            {facility.totalBookings?.toLocaleString() ?? 0} حجز
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  imageContainer: { height: 180, position: 'relative' },
  image: { width: '100%', height: '100%' },
  sportTagRow: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    gap: 6,
  },
  sportTag: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.brand.primary + 'DD',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  body: { padding: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center' },
  ratingBadge: {
    backgroundColor: Colors.warningBg,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  // Compact variant
  compactWrapper: { width: 240 },
  compactCard: { flexDirection: 'row', padding: Spacing.sm, gap: Spacing.sm },
  compactImage: { width: 64, height: 64, borderRadius: Radius.md },
  compactInfo: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
});
