import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from './GlassCard';
import { Colors, Typography, Spacing } from '../theme';
import { weatherApi } from '../api/weather.api';
import { useLocationStore } from '../store/location.store';

export function WeatherWidget() {
  const { coords } = useLocationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['weather', coords?.latitude, coords?.longitude],
    queryFn: () => weatherApi.getCurrent(coords!.latitude, coords!.longitude),
    enabled: !!coords,
    staleTime: 60 * 60 * 1000, // 1 hour — matches server cache
  });

  if (!coords) return null;

  const weather = data?.data?.data;

  return (
    <GlassCard style={styles.card} intensity={25}>
      {isLoading || !weather ? (
        <ActivityIndicator color={Colors.brand.primary} />
      ) : (
        <View style={styles.row}>
          <View>
            <Text style={[Typography.displayMd, { color: Colors.text.primary }]}>
              {weather.temperature}°
            </Text>
            <Text style={[Typography.bodyMd, { color: Colors.text.secondary }]}>
              {weather.city}
            </Text>
            <Text style={[Typography.bodySm, { color: Colors.text.tertiary }]}>
              {weather.description}
            </Text>
          </View>
          <View style={styles.stats}>
            <WeatherStat icon="💧" label="رطوبة" value={`${weather.humidity}%`} />
            <WeatherStat icon="💨" label="رياح" value={`${weather.windSpeed} كم/س`} />
            <WeatherStat icon="🌡" label="يشعر" value={`${weather.feelsLike}°`} />
          </View>
        </View>
      )}
    </GlassCard>
  );
}

function WeatherStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <View>
        <Text style={[Typography.labelSm, { color: Colors.text.tertiary }]}>{label}</Text>
        <Text style={[Typography.labelMd, { color: Colors.text.secondary }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: { gap: Spacing.sm },
  stat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
