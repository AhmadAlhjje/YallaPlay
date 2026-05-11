import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface MapSectionProps {
  latitude: number;
  longitude: number;
  title: string;
}

export function MapSection({ latitude, longitude, title }: MapSectionProps) {
  const openInMaps = () => {
    Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
  };

  return (
    <View style={styles.container}>
      {/* Web: static map image via Google Maps Static API (no key needed for basic embed) */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.pinBadge}>
          <Ionicons name="location-sharp" size={14} color={Colors.brand.primary} />
        </View>
        <Text style={[Typography.labelMd, { color: Colors.text.secondary, marginTop: Spacing.sm, textAlign: 'center' }]}>
          {title}
        </Text>
        <Text style={[Typography.bodySm, { color: Colors.text.tertiary, marginTop: 4 }]}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
      </View>
      <TouchableOpacity style={styles.overlay} onPress={openInMaps}>
        <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>فتح في خرائط جوجل ←</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  mapPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadge: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  overlay: {
    backgroundColor: Colors.background.primary + 'CC',
    paddingVertical: 10,
    paddingHorizontal: Spacing.xl,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.glass.border,
  },
});
