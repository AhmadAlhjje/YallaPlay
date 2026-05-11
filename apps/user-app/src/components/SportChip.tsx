import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Radius, Spacing } from '../theme';
import type { SportType } from '@yallaplay/shared-types';

const SPORT_INFO: Record<string, { label: string; emoji: string }> = {
  all:        { label: 'الكل', emoji: '✨' },
  football:   { label: 'كرة قدم', emoji: '⚽' },
  basketball: { label: 'كرة سلة', emoji: '🏀' },
  tennis:     { label: 'تنس', emoji: '🎾' },
  volleyball: { label: 'طائرة', emoji: '🏐' },
  padel:      { label: 'بادل', emoji: '🏓' },
  squash:     { label: 'إسكواش', emoji: '🎱' },
  badminton:  { label: 'ريشة', emoji: '🏸' },
  swimming:   { label: 'سباحة', emoji: '🏊' },
};

interface SportChipProps {
  sport: SportType | 'all';
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  labelOverride?: string;
  emojiOverride?: string;
}

export function SportChip({ sport, selected = false, onPress, style, labelOverride, emojiOverride }: SportChipProps) {
  const info = SPORT_INFO[sport] ?? { label: sport, emoji: '🏟️' };
  const label = labelOverride ?? info.label;
  const emoji = emojiOverride ?? info.emoji;

  return (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      activeOpacity={0.75}
      style={[styles.chip, selected && styles.selected, style]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
  },
  selected: { backgroundColor: Colors.brand.light, borderColor: Colors.brand.primary },
  emoji: { fontSize: 14 },
  label: { ...Typography.labelMd, color: Colors.text.secondary },
  labelSelected: { color: Colors.brand.primary },
});
