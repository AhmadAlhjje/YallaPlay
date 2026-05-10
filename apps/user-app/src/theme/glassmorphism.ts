import { StyleSheet, ViewStyle } from 'react-native';
import { Colors } from './colors';
import { Radius } from './typography';

export const GlassStyles = StyleSheet.create({
  blurContainer: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.xl,
    padding: 16,
  },
  cardSubtle: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.lg,
    padding: 12,
  },
  cardStrong: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.xxl,
    padding: 20,
  },
  shimmer: { height: 0, width: 0 },
  pill: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sheet: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.border.default,
    paddingTop: 12,
  },
});

export const GlassShadow: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

export const BrandGlow: ViewStyle = {
  shadowColor: Colors.brand.primary,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 4,
};
