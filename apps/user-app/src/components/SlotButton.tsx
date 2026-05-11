import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Radius } from '../theme';
import { formatTime12h } from '../lib/time';
import type { SlotDtoType } from '@yallaplay/shared-types';

interface SlotButtonProps {
  slot: SlotDtoType;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SlotButton({ slot, selected = false, onPress, style }: SlotButtonProps) {
  const status = slot.status ?? 'closed';
  const isBooked = status === 'booked';
  const isPending = status === 'pending';
  const isClosed = status === 'closed';
  const disabled = status !== 'available';

  return (
    <TouchableOpacity
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.slot,
        selected  && styles.slotSelected,
        isBooked  && styles.slotBooked,
        isPending && styles.slotPending,
        isClosed  && styles.slotClosed,
        style,
      ]}
    >
      <Text style={[styles.time, selected && styles.timeSelected, disabled && styles.dimmed]}>
        {formatTime12h(slot.startTime)}
      </Text>
      <Text style={[styles.sub, selected && styles.subSelected, disabled && styles.dimmed]}>
        {isBooked ? 'محجوز' : isPending ? 'معلّق' : isClosed ? 'مغلق' : `${slot.price} ر.س`}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.brand.border,
    backgroundColor: Colors.brand.light,
    minWidth: 76,
  },
  slotSelected: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary },
  slotBooked:   { backgroundColor: Colors.errorBg, borderColor: Colors.error + '44' },
  slotPending:  { backgroundColor: Colors.warningBg, borderColor: Colors.warning + '44' },
  slotClosed:   { backgroundColor: Colors.background.secondary, borderColor: Colors.border.default },
  time:         { ...Typography.labelMd, color: Colors.brand.dark },
  timeSelected: { color: '#FFFFFF' },
  sub:          { ...Typography.bodySm, color: Colors.brand.primary, marginTop: 2 },
  subSelected:  { color: '#FFFFFF' },
  dimmed:       { color: Colors.text.tertiary },
});
