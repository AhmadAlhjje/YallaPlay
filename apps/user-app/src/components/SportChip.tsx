import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp, Animated, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Radius, Spacing } from '../theme';
import type { SportType } from '@yallaplay/shared-types';

const SPORT_INFO: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  all:        { label: 'الكل',      emoji: '✨', color: Colors.brand.primary, bg: Colors.brand.light },
  football:   { label: 'كرة قدم',  emoji: '⚽', color: '#16a34a', bg: '#dcfce7' },
  basketball: { label: 'كرة سلة',  emoji: '🏀', color: '#ea580c', bg: '#fff7ed' },
  tennis:     { label: 'تنس',      emoji: '🎾', color: '#65a30d', bg: '#f7fee7' },
  volleyball: { label: 'طائرة',    emoji: '🏐', color: '#2563eb', bg: '#eff6ff' },
  padel:      { label: 'بادل',     emoji: '🏓', color: '#7c3aed', bg: '#f5f3ff' },
  squash:     { label: 'إسكواش',   emoji: '🎱', color: '#0891b2', bg: '#ecfeff' },
  badminton:  { label: 'ريشة',     emoji: '🏸', color: '#b45309', bg: '#fef3c7' },
  swimming:   { label: 'سباحة',    emoji: '🏊', color: '#0284c7', bg: '#e0f2fe' },
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
  const info = SPORT_INFO[sport] ?? { label: sport, emoji: '🏟️', color: Colors.brand.primary, bg: Colors.brand.light };
  const label = labelOverride ?? info.label;
  const emoji = emojiOverride ?? info.emoji;

  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          styles.chip,
          selected && { backgroundColor: info.bg, borderColor: info.color },
        ]}
      >
        {/* Emoji in a small bubble */}
        <View style={[styles.emojiBubble, selected && { backgroundColor: info.color + '22' }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <Text style={[styles.label, selected && { color: info.color, fontWeight: '700' }]}>
          {label}
        </Text>
        {selected && <View style={[styles.dot, { backgroundColor: info.color }]} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  emojiBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 13 },
  label: { ...Typography.labelMd, color: Colors.text.secondary },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    marginLeft: 2,
  },
});
