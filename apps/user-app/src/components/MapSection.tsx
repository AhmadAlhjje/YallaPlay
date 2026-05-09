import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
      <TouchableOpacity style={styles.overlay} onPress={openInMaps}>
        <Text style={[Typography.labelMd, { color: Colors.brand.primary }]}>فتح في الخريطة ←</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.md },
  map: { width: '100%', height: 180 },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background.primary + 'CC',
    paddingVertical: 10, paddingHorizontal: Spacing.xl,
    alignItems: 'flex-end',
  },
});
