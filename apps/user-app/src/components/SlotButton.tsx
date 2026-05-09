import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Radius } from '../theme';
import type { SlotDtoType } from '@yallaplay/shared-types';

interface SlotButtonProps {
  slot: SlotDtoType;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function SlotButton({ slot, selected, onPress, style }: SlotButtonProps) {
  const isAvailable = slot.status === 'available';
  const isDisabled  = slot.status === 'booked' || slot.status === 'closed';

  const bgColor = selected
    ? Colors.brand.primary
    : (Colors.slot as Record<string, string>)[slot.status + 'Bg'] ?? Colors.glass.subtle;

  const borderColor = selected
    ? Colors.brand.primary
    : (Colors.slot as Record<string, string>)[slot.status] ?? Colors.glass.border;

  const textColor = selected
    ? '#fff'
    : isDisabled
      ? Colors.text.tertiary
      : (Colors.slot as Record<string, string>)[slot.status] ?? Colors.text.primary;

  return (
    <TouchableOpacity
      onPress={() => {
        if (!isAvailable) return;
        Haptics.selectionAsync();
        onPress();
      }}
      disabled={isDisabled}
      activeOpacity={isAvailable ? 0.75 : 1}
      style={[styles.slot, { backgroundColor: bgColor, borderColor }, style]}
    >
      <Text style={[Typography.numericSm, { color: textColor }]}>{slot.startTime}</Text>
      {slot.discountedPrice ? (
        <Text style={[Typography.labelSm, { color: Colors.success }]}>
          {slot.discountedPrice} ر.س
        </Text>
      ) : (
        <Text style={[Typography.labelSm, { color: textColor, opacity: 0.7 }]}>
          {slot.status === 'booked' ? 'محجوز' : slot.status === 'closed' ? 'مغلق' : `${slot.price} ر.س`}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slot: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 80,
  },
});
