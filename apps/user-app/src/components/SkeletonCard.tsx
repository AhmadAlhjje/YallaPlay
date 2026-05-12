import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Radius, Spacing } from '../theme';

function SkeletonBox({ style }: { style?: StyleProp<ViewStyle> }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return <Animated.View style={[{ opacity: pulse, backgroundColor: Colors.border.default }, style]} />;
}

export function SkeletonFacilityCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonBox style={styles.image} />
      <View style={styles.info}>
        <SkeletonBox style={styles.titleLine} />
        <SkeletonBox style={styles.subLine} />
        <View style={styles.chipsRow}>
          <SkeletonBox style={styles.chip} />
          <SkeletonBox style={styles.chip} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonCompactCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.compact, style]}>
      <SkeletonBox style={styles.compactImg} />
      <View style={styles.compactInfo}>
        <SkeletonBox style={styles.titleLine} />
        <SkeletonBox style={styles.subLine} />
        <SkeletonBox style={styles.priceLine} />
      </View>
    </View>
  );
}

export function SkeletonSectionList({ count = 3, variant = 'full' }: { count?: number; variant?: 'full' | 'compact' }) {
  return (
    <View style={styles.listRow}>
      {Array.from({ length: count }).map((_, i) =>
        variant === 'compact'
          ? <SkeletonCompactCard key={i} style={{ width: 210, marginRight: Spacing.md }} />
          : <SkeletonFacilityCard key={i} style={{ width: 195, marginRight: Spacing.md }} />,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.strong,
  },
  image: { width: '100%', height: 130, borderRadius: 0 },
  info: { padding: Spacing.md, gap: Spacing.sm },
  titleLine: { height: 14, borderRadius: 7, width: '70%' },
  subLine: { height: 11, borderRadius: 6, width: '50%' },
  priceLine: { height: 11, borderRadius: 6, width: '30%' },
  chipsRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: { height: 20, width: 50, borderRadius: Radius.full },

  compact: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    overflow: 'hidden',
    height: 112,
  },
  compactImg: { width: 112, height: 112 },
  compactInfo: { flex: 1, padding: Spacing.md, gap: Spacing.sm, justifyContent: 'center' },
  listRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl },
});
