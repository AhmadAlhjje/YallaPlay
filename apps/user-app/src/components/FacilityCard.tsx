import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ViewStyle, StyleProp,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useFavoritesStore } from '../store/favorites.store';

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽', basketball: '🏀', tennis: '🎾',
  volleyball: '🏐', padel: '🏓', squash: '🎱',
  badminton: '🏸', swimming: '🏊',
};

const SPORT_LABEL: Record<string, string> = {
  football: 'قدم', basketball: 'سلة', tennis: 'تنس',
  volleyball: 'طائرة', padel: 'بادل', squash: 'إسكواش',
  badminton: 'ريشة', swimming: 'سباحة',
};

const SPORT_IMAGES: Record<string, any> = {
  football:   require('../../assets/football-1.webp'),
  basketball: require('../../assets/basketball-1.webp'),
};
const FALLBACK_IMAGE = require('../../assets/football-1.webp');

interface FacilityCardProps {
  facility: {
    _id: string;
    name: string;
    address?: string;
    images?: string[];
    rating?: number;
    sports?: string[];
    pricePerSlot?: number;
    pricePerHour?: number;
    minPrice?: number;
  };
  onPress?: () => void;
  variant?: 'full' | 'compact';
  style?: StyleProp<ViewStyle>;
}

export function FacilityCard({ facility, onPress, variant = 'full', style }: FacilityCardProps) {
  const primarySport = (facility.sports ?? [])[0];
  const localImage   = SPORT_IMAGES[primarySport] ?? FALLBACK_IMAGE;
  const price        = facility.pricePerSlot ?? facility.pricePerHour ?? facility.minPrice ?? 0;
  const rating   = facility.rating ?? 0;
  const sports   = (facility.sports ?? []).slice(0, 3);

  const toggle = useFavoritesStore((s) => s.toggle);
  // Boolean selector — Zustand re-renders when this value changes
  const isFav  = useFavoritesStore((s) => s.ids.has(facility._id));

  // ── Compact variant ─────────────────────────────────────
  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={[styles.compact, style]}>
        {/* Image — right side */}
        <View style={styles.compactImgWrap}>
          <Image
            source={localImage}
            style={styles.compactImg}
            contentFit="cover"
            placeholder={{ color: Colors.background.secondary }}
          />
          {rating > 0 && (
            <View style={styles.compactRatingBadge}>
              <Ionicons name="star" size={9} color="#F59E0B" />
              <Text style={styles.compactRatingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Info — left side */}
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={2}>{facility.name}</Text>

          {facility.address && (
            <View style={styles.compactAddrRow}>
              <Text style={styles.compactAddr} numberOfLines={1}>{facility.address}</Text>
              <View style={styles.pinBadgeSm}>
                <Ionicons name="location-sharp" size={9} color={Colors.brand.primary} />
              </View>
            </View>
          )}

          <View style={styles.compactFooter}>
            {sports.slice(0, 2).map((s) => (
              <Text key={s} style={{ fontSize: 14 }}>{SPORT_EMOJI[s] ?? '🏟'}</Text>
            ))}
            {price > 0 && (
              <View style={styles.pricePillSm}>
                <Text style={styles.pricePillSmText}>{price} ر.س</Text>
              </View>
            )}
          </View>
        </View>

        {/* Heart */}
        <TouchableOpacity onPress={() => toggle(facility._id)} style={styles.compactHeart} hitSlop={8}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={15}
            color={isFav ? '#EF4444' : Colors.text.tertiary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ── Full variant — image + white info section ────────────
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={[styles.card, style]}>
      {/* Image section */}
      <View style={styles.imgWrap}>
        <Image
          source={localImage}
          style={styles.image}
          contentFit="cover"
          placeholder={{ color: Colors.background.secondary }}
        />

        {/* Rating — top left */}
        {rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        )}

        {/* Heart — top right */}
        <TouchableOpacity onPress={() => toggle(facility._id)} style={styles.heartBtn} hitSlop={8}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={18}
            color={isFav ? '#EF4444' : 'rgba(255,255,255,0.95)'}
          />
        </TouchableOpacity>

        {/* Price — bottom right on image */}
        {price > 0 && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>{price} ر.س/س</Text>
          </View>
        )}
      </View>

      {/* White info section */}
      <View style={styles.info}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>{facility.name}</Text>

        {/* Address */}
        {facility.address && (
          <View style={styles.addrRow}>
            <Text style={styles.addr} numberOfLines={1}>{facility.address}</Text>
            <View style={styles.pinBadge}>
              <Ionicons name="location-sharp" size={11} color={Colors.brand.primary} />
            </View>
          </View>
        )}

        {/* Sports + divider */}
        {sports.length > 0 && (
          <View style={styles.sportsRow}>
            {sports.map((s) => (
              <View key={s} style={styles.sportChip}>
                <Text style={styles.sportEmoji}>{SPORT_EMOJI[s] ?? '🏟'}</Text>
                <Text style={styles.sportLabel}>{SPORT_LABEL[s] ?? s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ── Full card ─────────────────────────────────────────
  card: {
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.strong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },

  imgWrap: { position: 'relative' },
  image: {
    width: '100%',
    height: 195,
    backgroundColor: Colors.background.secondary,
  },

  ratingBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: Colors.text.primary },

  heartBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },

  priceBadge: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full,
  },
  priceBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // White info section
  info: {
    backgroundColor: Colors.background.elevated,
    padding: Spacing.md,
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'right',
  },
  addrRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  addr: {
    ...Typography.bodySm,
    color: Colors.text.secondary,
    flex: 1,
    textAlign: 'right',
  },
  pinBadge: {
    width: 20, height: 20, borderRadius: 5,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sportsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  sportChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },
  sportEmoji: { fontSize: 11 },
  sportLabel: { fontSize: 11, fontWeight: '600', color: Colors.brand.dark },

  // ── Compact card ─────────────────────────────────────
  compact: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    overflow: 'hidden',
    height: 112,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  compactImgWrap: { position: 'relative' },
  compactImg: {
    width: 112, height: 112,
    backgroundColor: Colors.background.secondary,
  },
  compactRatingBadge: {
    position: 'absolute', bottom: 6, right: 6,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(255,255,255,0.93)',
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: Radius.full,
  },
  compactRatingText: { fontSize: 10, fontWeight: '700', color: Colors.text.primary },

  compactInfo: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: Spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  compactName: {
    fontSize: 13, fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'right', lineHeight: 19,
  },
  compactAddrRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center', gap: 4,
  },
  compactAddr: {
    fontSize: 11, color: Colors.text.secondary,
    flex: 1, textAlign: 'right',
  },
  pinBadgeSm: {
    width: 16, height: 16, borderRadius: 4,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
  },
  compactFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  pricePillSm: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pricePillSmText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  compactHeart: {
    position: 'absolute', top: 7, left: 7,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border.default,
  },
});
