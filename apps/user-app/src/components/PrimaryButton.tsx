import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Radius, BrandGlow } from '../theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gradient' | 'outline' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'gradient',
  style,
  textStyle,
  size = 'lg',
}: PrimaryButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const heights = { sm: 40, md: 48, lg: 56 };
  const height = heights[size];

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.75}
        style={[
          styles.base,
          { height },
          styles.outline,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.brand.primary} size="small" />
        ) : (
          <Text style={[Typography.labelLg, styles.outlineText, textStyle]}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[styles.base, { height }, style]}
      >
        <Text style={[Typography.labelLg, styles.ghostText, textStyle]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[BrandGlow, style]}
    >
      <LinearGradient
        colors={Colors.brand.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.base, styles.gradient, { height }, (disabled || loading) && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[Typography.labelLg, styles.gradientText, textStyle]}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  gradient: {
    borderRadius: Radius.lg,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.5 },
  gradientText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  outlineText: { color: Colors.brand.primary },
  ghostText: { color: Colors.text.secondary },
});
