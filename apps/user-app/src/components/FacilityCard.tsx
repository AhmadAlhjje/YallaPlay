import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ViewStyle, StyleProp,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  const rating       = facility.rating ?? 0;
  const sports       = (facility.sports ?? []).slice(0, 3);

  const toggle = useFavoritesStore((s) => s.toggle);
  const isFav  = useFavoritesStore((s) => s.ids.has(facility._id));

  // ── Compact variant ──────────────────────────────────────
  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={[styles.compact, style]}>
        <View style={styles.compactImgWrap}>
          <Image
            source={localImage}
            style={styles.compactImg}
            contentFit="cover"
            placeholder={{ color: Colors.background.secondary }}
          />
          {primarySport && (
            <View style={styles.compactSportBadge}>
              <Text style={{ fontSize: 11 }}>{SPORT_EMOJI[primarySport] ?? '🏟'}</Text>
            </View>
          )}
          {rating > 0 && (
            <View style={styles.compactRatingBadge}>
              <Ionicons name="star" size={9} color="#F59E0B" />
              <Text style={styles.compactRatingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={2}>{facility.name}</Text>
          {facility.address && (
            <View style={styles.compactAddrRow}>
              <Ionicons name="location-sharp" size={10} color={Colors.brand.primary} />
              <Text style={styles.compactAddr} numberOfLines={1}>{facility.address}</Text>
            </View>
          )}
          <View style={styles.compactFooter}>
            <View style={styles.compactSports}>
              {sports.slice(0, 2).map((s) => (
                <Text key={s} style={{ fontSize: 13 }}>{SPORT_EMOJI[s] ?? '🏟'}</Text>
              ))}
            </View>
            {price > 0 && (
              <View style={styles.pricePillSm}>
                <Text style={styles.pricePillSmText}>{price} ر.س</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={() => toggle(facility._id)} style={styles.compactHeart} hitSlop={8}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={14}
            color={isFav ? '#EF4444' : Colors.text.tertiary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ── Full variant — image + white info card ───────────────
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={[styles.card, style]}>

      {/* ── Image section ── */}
      <View style={styles.imgWrap}>
        <Image
          source={localImage}
          style={styles.image}
          contentFit="cover"
          placeholder={{ color: Colors.background.secondary }}
        />

        {/* Subtle gradient at top for badge readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.imgTopGradient}
        />

        {/* Rating badge — top left */}
        {rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#F59E0B" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        )}

        {/* Heart — top right */}
        <TouchableOpacity
          onPress={() => toggle(facility._id)}
          style={styles.heartBtn}
          hitSlop={8}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={16}
            color={isFav ? '#EF4444' : '#fff'}
          />
        </TouchableOpacity>

        {/* Sport type label — bottom left of image */}
        {primarySport && (
          <View style={styles.sportImageBadge}>
            <Text style={styles.sportImageEmoji}>{SPORT_EMOJI[primarySport] ?? '🏟'}</Text>
            <Text style={styles.sportImageLabel}>{SPORT_LABEL[primarySport] ?? primarySport}</Text>
          </View>
        )}
      </View>

      {/* ── White info section ── */}
      <View style={styles.infoSection}>
        {/* Facility name */}
        <Text style={styles.facilityName} numberOfLines={1}>{facility.name}</Text>

        {/* Address row */}
        {facility.address && (
          <View style={styles.addressRow}>
            <Text style={styles.addressText} numberOfLines={1}>{facility.address}</Text>
            <View style={styles.pinIcon}>
              <Ionicons name="location-sharp" size={10} color={Colors.brand.primary} />
            </View>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Sports chips + price */}
        <View style={styles.infoFooter}>
          <View style={styles.sportsRow}>
            {sports.map((s) => (
              <View key={s} style={styles.sportChip}>
                <Text style={styles.sportChipEmoji}>{SPORT_EMOJI[s] ?? '🏟'}</Text>
                <Text style={styles.sportChipLabel}>{SPORT_LABEL[s] ?? s}</Text>
              </View>
            ))}
          </View>
          {price > 0 && (
            <View style={styles.priceTag}>
              <Text style={styles.priceValue}>{price}</Text>
              <Text style={styles.priceCurrency}> ر.س</Text>
            </View>
          )}
        </View>
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
    elevation: 5,
  },

  imgWrap: { position: 'relative' },
  image: {
    width: '100%',
    height: 170,
    backgroundColor: Colors.background.secondary,
  },
  imgTopGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 70,
  },

  ratingBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  ratingText: { fontSize: 11, fontWeight: '800', color: '#92400E' },

  heartBtn: {
    position: 'absolute', top: 9, right: 9,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },

  sportImageBadge: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: Radius.full,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  sportImageEmoji: { fontSize: 12 },
  sportImageLabel: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // ── White info section ────────────────────────────────
  infoSection: {
    backgroundColor: Colors.background.elevated,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 11,
    gap: 5,
  },

  facilityName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'right',
  },

  addressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 11,
    color: Colors.text.secondary,
    flex: 1,
    textAlign: 'right',
  },
  pinIcon: {
    width: 16, height: 16, borderRadius: 4,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
    marginVertical: 2,
  },

  infoFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  sportsRow: { flexDirection: 'row-reverse', gap: 4 },
  sportChip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 3,
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.brand.border,
  },
  sportChipEmoji: { fontSize: 10 },
  sportChipLabel: { fontSize: 10, fontWeight: '600', color: Colors.brand.dark },

  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  priceValue: { fontSize: 14, fontWeight: '800', color: '#fff' },
  priceCurrency: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  // ── Compact card ─────────────────────────────────────
  compact: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    overflow: 'hidden',
    height: 108,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  compactImgWrap: { position: 'relative' },
  compactImg: {
    width: 108, height: 108,
    backgroundColor: Colors.background.secondary,
  },
  compactSportBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center', justifyContent: 'center',
  },
  compactRatingBadge: {
    position: 'absolute', bottom: 5, left: 5,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(255,255,255,0.93)',
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: Radius.full,
  },
  compactRatingText: { fontSize: 9, fontWeight: '700', color: Colors.text.primary },

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
    alignItems: 'center', gap: 3,
  },
  compactAddr: {
    fontSize: 10, color: Colors.text.secondary,
    flex: 1, textAlign: 'right',
  },
  compactFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  compactSports: { flexDirection: 'row-reverse', gap: 3 },
  pricePillSm: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pricePillSmText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  compactHeart: {
    position: 'absolute', top: 6, left: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border.default,
  },
});
