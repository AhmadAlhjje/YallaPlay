import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'subtle' | 'default' | 'strong';
}

export function GlassCard({ children, style, variant = 'default' }: GlassCardProps) {
  const bg = variant === 'subtle' ? Colors.glass.subtle
           : variant === 'strong' ? Colors.glass.medium
           : Colors.glass.light;

  return (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
      <View style={[StyleSheet.absoluteFill, styles.shimmer]} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    overflow: 'hidden',
  },
  shimmer: {
    borderTopWidth: 1,
    borderTopColor: Colors.glass.highlight,
    borderRadius: Radius.lg,
  },
});
