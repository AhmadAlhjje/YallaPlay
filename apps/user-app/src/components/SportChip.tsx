import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Radius } from '../theme';
import type { SportType } from '@yallaplay/shared-types';

const SPORT_LABELS: Record<SportType, string> = {
  football:   '⚽ كرة قدم',
  basketball: '🏀 سلة',
  tennis:     '🎾 تنس',
  volleyball: '🏐 طائرة',
  padel:      '🏸 بادل',
  squash:     '🟡 سكواش',
  badminton:  '🏸 ريشة',
  swimming:   '🏊 سباحة',
};

interface SportChipProps {
  sport: SportType;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function SportChip({ sport, selected, onPress, style }: SportChipProps) {
  const accentColor = (Colors.sport as Record<string, string>)[sport] ?? Colors.brand.primary;

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      activeOpacity={0.75}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: accentColor + '25', borderColor: accentColor }
          : styles.unselected,
        style,
      ]}
    >
      <Text
        style={[
          Typography.labelMd,
          { color: selected ? accentColor : Colors.text.secondary },
        ]}
      >
        {SPORT_LABELS[sport]}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  unselected: {
    backgroundColor: Colors.glass.subtle,
    borderColor: Colors.glass.border,
  },
});
