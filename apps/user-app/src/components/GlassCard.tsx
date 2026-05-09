import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassStyles, GlassShadow, Colors } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  variant?: 'subtle' | 'default' | 'strong';
  noShadow?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 20,
  variant = 'default',
  noShadow = false,
}: GlassCardProps) {
  const surfaceStyle =
    variant === 'subtle'
      ? GlassStyles.cardSubtle
      : variant === 'strong'
        ? GlassStyles.cardStrong
        : GlassStyles.card;

  return (
    <View style={[!noShadow && GlassShadow, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[GlassStyles.blurContainer, { borderRadius: (surfaceStyle as any).borderRadius }]}
      >
        <View style={surfaceStyle}>
          {/* Top shimmer line */}
          <View style={GlassStyles.shimmer} pointerEvents="none" />
          {children}
        </View>
      </BlurView>
    </View>
  );
}
