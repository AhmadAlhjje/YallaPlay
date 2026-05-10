import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Radius, Spacing } from '../theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gradient' | 'outline' | 'ghost';
  style?: ViewStyle;
}

export function PrimaryButton({
  label, onPress, loading, disabled, variant = 'gradient', style,
}: PrimaryButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isOutline = variant === 'outline';
  const isGhost   = variant === 'ghost';

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        isOutline ? styles.outlined : isGhost ? styles.ghost : styles.solid,
        { opacity: disabled ? 0.45 : 1 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={isOutline || isGhost ? Colors.brand.primary : '#fff'} size="small" />
        : <Text style={[Typography.labelLg, { color: isOutline || isGhost ? Colors.brand.primary : '#fff' }]}>
            {label}
          </Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  solid: {
    backgroundColor: Colors.brand.primary,
  },
  outlined: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
  },
  ghost: {
    backgroundColor: Colors.glass.subtle,
  },
});
