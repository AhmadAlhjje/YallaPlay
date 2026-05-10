import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ViewStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽', basketball: '🏀', tennis: '🎾',
  volleyball: '🏐', padel: '🏓', squash: '🎱',
  badminton: '🏸', swimming: '🏊',
};

interface FacilityCardProps {
  facility: {
    _id: string;
    name: string;
    address?: string;
    images?: string[];
    rating?: number;
    totalBookings?: number;
    sports?: string[];
    pricePerHour?: number;
    minPrice?: number;
  };
  onPress?: () => void;
  variant?: 'full' | 'compact';
  style?: StyleProp<ViewStyle>;
}

export function FacilityCard({ facility, onPress, variant = 'full', style }: FacilityCardProps) {
  const imageUrl = facility.images?.[0];
  const price = facility.pricePerHour ?? facility.minPrice ?? 0;
  const rating = facility.rating ?? 0;
  const sports = (facility.sports ?? []).slice(0, 3);

  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.compact, style]}>
        <Image source={{ uri: imageUrl }} style={styles.compactImg} contentFit="cover" />
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{facility.name}</Text>
          {facility.address && (
            <Text style={styles.compactAddr} numberOfLines={1}>📍 {facility.address}</Text>
          )}
          <View style={styles.row}>
            {rating > 0 && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {rating.toFixed(1)}</Text>
              </View>
            )}
            {price > 0 && <Text style={styles.price}>{price} ر.س/س</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, style]}>
      {/* Image */}
      <View style={styles.imgWrap}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ color: Colors.background.secondary }}
        />
        {price > 0 && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>{price} ر.س/س</Text>
          </View>
        )}
        {rating > 0 && (
          <View style={styles.ratingBadgeImg}>
            <Text style={styles.ratingImgText}>⭐ {rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{facility.name}</Text>
        {facility.address && (
          <Text style={styles.address} numberOfLines={1}>📍 {facility.address}</Text>
        )}
        {sports.length > 0 && (
          <View style={styles.sports}>
            {sports.map((s) => (
              <View key={s} style={styles.sportTag}>
                <Text style={styles.sportTagText}>
                  {SPORT_EMOJI[s] ?? '🏟'} {s}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imgWrap: { position: 'relative' },
  image: {
    width: '100%', height: 180,
    backgroundColor: Colors.background.secondary,
  },
  priceBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  priceBadgeText: { ...Typography.labelSm, color: '#FFFFFF' },
  ratingBadgeImg: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  ratingImgText: { ...Typography.labelSm, color: Colors.text.primary },
  info: { padding: Spacing.md },
  name: { ...Typography.labelLg, color: Colors.text.primary, marginBottom: 4 },
  address: { ...Typography.bodySm, color: Colors.text.secondary, marginBottom: Spacing.sm },
  sports: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sportTag: {
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  sportTagText: { ...Typography.labelSm, color: Colors.brand.dark },
  // compact
  compact: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  compactImg: { width: 90, height: 90, backgroundColor: Colors.background.secondary },
  compactInfo: { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },
  compactName: { ...Typography.labelMd, color: Colors.text.primary },
  compactAddr: { ...Typography.bodySm, color: Colors.text.secondary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingBadge: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  ratingText: { ...Typography.labelSm, color: Colors.text.primary },
  price: { ...Typography.labelMd, color: Colors.brand.primary },
});
