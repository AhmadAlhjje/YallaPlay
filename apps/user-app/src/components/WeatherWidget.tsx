import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { weatherApi } from '../api/weather.api';
import { useLocationStore } from '../store/location.store';

export function WeatherWidget() {
  const { coords } = useLocationStore();
  const { data, isLoading } = useQuery({
    queryKey: ['weather', coords?.latitude, coords?.longitude],
    queryFn: () => weatherApi.getCurrent(coords!.latitude, coords!.longitude),
    enabled: !!coords,
    staleTime: 60 * 60 * 1000,
  });

  if (!coords) return null;
  const weather = data?.data?.data;

  return (
    <View style={styles.card}>
      {isLoading || !weather ? (
        <ActivityIndicator color={Colors.brand.primary} size="small" />
      ) : (
        <View style={styles.row}>
          <View>
            <Text style={styles.temp}>{weather.temperature}°</Text>
            <Text style={styles.city}>{weather.city}</Text>
            <Text style={styles.desc}>{weather.description}</Text>
          </View>
          <View style={styles.stats}>
            {[
              { label: 'رطوبة', value: `${weather.humidity}%` },
              { label: 'رياح',  value: `${weather.windSpeed} كم/س` },
              { label: 'يشعر', value: `${weather.feelsLike}°` },
            ].map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  temp: { fontSize: 32, fontWeight: '700', color: Colors.brand.dark },
  city: { ...Typography.bodyMd, color: Colors.brand.dark, marginTop: 2 },
  desc: { ...Typography.bodySm, color: Colors.brand.primary, marginTop: 2 },
  stats: { gap: Spacing.sm },
  stat: { alignItems: 'flex-end' },
  statLabel: { ...Typography.labelSm, color: Colors.brand.primary },
  statValue: { ...Typography.labelMd, color: Colors.brand.dark },
});
