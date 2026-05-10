import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Radius } from '../theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gradient' | 'primary' | 'outline' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function PrimaryButton({
  label, onPress, loading = false, disabled = false,
  variant = 'primary', style, textStyle, size = 'lg',
}: PrimaryButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const heights = { sm: 40, md: 46, lg: 52 };
  const height = heights[size];

  const isPrimary = variant === 'primary' || variant === 'gradient';

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        { height },
        isPrimary && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={isPrimary ? '#fff' : Colors.brand.primary} size="small" />
        : <Text style={[
            styles.label,
            isPrimary ? styles.labelPrimary : variant === 'outline' ? styles.labelOutline : styles.labelGhost,
            textStyle,
          ]}>
            {label}
          </Text>
      }
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
  primary: {
    backgroundColor: Colors.brand.primary,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.brand.primary,
    backgroundColor: 'transparent',
  },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  label: { fontSize: 16, fontWeight: '600' },
  labelPrimary: { color: '#FFFFFF' },
  labelOutline: { color: Colors.brand.primary },
  labelGhost: { color: Colors.text.secondary },
});
