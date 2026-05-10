import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { GlassStyles, GlassShadow } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  variant?: 'subtle' | 'default' | 'strong';
  noShadow?: boolean;
}

export function GlassCard({
  children,
  style,
  variant = 'default',
  noShadow = false,
}: GlassCardProps) {
  const surfaceStyle =
    variant === 'subtle' ? GlassStyles.cardSubtle
    : variant === 'strong' ? GlassStyles.cardStrong
    : GlassStyles.card;

  return (
    <View style={[!noShadow && GlassShadow, surfaceStyle, style]}>
      {children}
    </View>
  );
}
