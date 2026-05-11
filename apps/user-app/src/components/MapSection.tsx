import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface MapSectionProps {
  latitude: number;
  longitude: number;
  title: string;
}

export function MapSection({ latitude, longitude, title }: MapSectionProps) {
  const openInMaps = () => {
    const url = Platform.OS === 'ios'
      ? `maps:0,0?q=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Marker coordinate={{ latitude, longitude }} title={title} />
      </MapView>

      {/* Open in maps button */}
      <TouchableOpacity style={styles.openBtn} onPress={openInMaps} activeOpacity={0.85}>
        <View style={styles.openBtnIcon}>
          <Ionicons name="location-sharp" size={14} color={Colors.brand.primary} />
        </View>
        <Text style={styles.openBtnText}>فتح في الخريطة</Text>
        <Ionicons name="chevron-back" size={14} color={Colors.brand.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  map: { width: '100%', height: 180 },

  openBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.elevated,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  openBtnIcon: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: Colors.brand.light,
    borderWidth: 1, borderColor: Colors.brand.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  openBtnText: {
    flex: 1,
    fontSize: 13, fontWeight: '600',
    color: Colors.brand.primary,
    textAlign: 'right',
  },
});
