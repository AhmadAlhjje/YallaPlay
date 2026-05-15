import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { Colors, Radius } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'subtle' | 'default' | 'strong';
}

export function GlassCard({ children, style, variant = 'default' }: GlassCardProps) {
  const bg = variant === 'subtle' ? Colors.background.secondary
           : variant === 'strong' ? Colors.background.elevated
           : Colors.background.primary;

  return (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
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
});
