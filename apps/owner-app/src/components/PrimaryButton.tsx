import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[{ borderRadius: Radius.lg, overflow: 'hidden', opacity: disabled ? 0.5 : 1 }, style]}
      >
        <LinearGradient
          colors={Colors.brand.gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.gradientInner}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={[Typography.labelLg, { color: '#fff' }]}>{label}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.outlined,
        variant === 'outline' && { borderColor: Colors.brand.primary, borderWidth: 1.5 },
        { opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={Colors.brand.primary} size="small" />
        : <Text style={[Typography.labelLg, { color: Colors.brand.primary }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientInner: {
    paddingVertical: 16, paddingHorizontal: Spacing.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  outlined: {
    paddingVertical: 15, paddingHorizontal: Spacing.xl,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.glass.subtle,
  },
});
