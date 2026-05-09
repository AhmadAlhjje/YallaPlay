import { StyleSheet, ViewStyle } from 'react-native';
import { Colors } from './colors';
import { Radius } from './typography';

// Reusable Glassmorphism layer styles.
// Usage: combine GlassStyles.card with a BlurView wrapper.
//
// Pattern:
//   <BlurView intensity={20} style={GlassStyles.blurContainer}>
//     <View style={GlassStyles.card}>
//       {children}
//     </View>
//   </BlurView>

export const GlassStyles = StyleSheet.create({
  // Full blur container — same borderRadius as the card
  blurContainer: {
    overflow: 'hidden',
    borderRadius: Radius.xl,
  },

  // Primary card surface
  card: {
    backgroundColor: Colors.glass.light,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: Radius.xl,
    padding: 16,
  },

  // Subtle card — list items, secondary cards
  cardSubtle: {
    backgroundColor: Colors.glass.subtle,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: Radius.lg,
    padding: 12,
  },

  // Prominent card — hero sections
  cardStrong: {
    backgroundColor: Colors.glass.medium,
    borderWidth: 1,
    borderColor: Colors.glass.borderHover,
    borderRadius: Radius.xxl,
    padding: 20,
  },

  // Inner shimmer line — top edge highlight
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: Colors.glass.highlight,
    borderRadius: 1,
  },

  // Pill badge
  pill: {
    backgroundColor: Colors.glass.medium,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  // Bottom sheet / modal surface
  sheet: {
    backgroundColor: Colors.background.elevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderBottomWidth: 0,
    paddingTop: 12,
  },
});

// Shadow preset — gives depth beneath glass cards on dark backgrounds
export const GlassShadow: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.4,
  shadowRadius: 24,
  elevation: 12,
};

// Brand glow — used on CTA buttons
export const BrandGlow: ViewStyle = {
  shadowColor: Colors.brand.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius: 16,
  elevation: 8,
};
