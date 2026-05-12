import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  FlatList, Animated, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { weatherApi } from '../api/weather.api';
import { useLocationStore } from '../store/location.store';
import { Colors, Spacing, Radius } from '../theme';

const WEATHER_ICON_MAP: Record<string, string> = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

interface WeatherPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function WeatherPanel({ visible, onClose }: WeatherPanelProps) {
  const { coords } = useLocationStore();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(400)).current;

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ['weather-current', coords?.latitude, coords?.longitude],
    queryFn: () => weatherApi.getCurrent(coords!.latitude, coords!.longitude),
    enabled: !!coords && visible,
    staleTime: 60 * 60 * 1000,
  });

  const { data: hourlyData, isLoading: hourlyLoading } = useQuery({
    queryKey: ['weather-hourly', coords?.latitude, coords?.longitude],
    queryFn: () => weatherApi.getHourly(coords!.latitude, coords!.longitude),
    enabled: !!coords && visible,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const weather = currentData?.data?.data;
  const hourly = hourlyData?.data?.data ?? [];
  const isLoading = currentLoading || hourlyLoading;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.panel, { paddingBottom: insets.bottom + Spacing.xl, transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>طقس اليوم</Text>
          <View style={{ width: 36 }} />
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 40 }} />
        ) : weather ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Current */}
            <View style={styles.currentSection}>
              <Text style={styles.cityName}>{weather.city}</Text>
              <View style={styles.tempRow}>
                <Text style={styles.bigTemp}>{weather.temperature}°</Text>
                <View style={styles.currentDetails}>
                  <Text style={styles.weatherDesc}>{weather.description}</Text>
                  <Text style={styles.feelsLike}>يشعر كـ {weather.feelsLike}°</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                {[
                  { icon: 'water-outline' as const, label: 'رطوبة', value: `${weather.humidity}%` },
                  { icon: 'navigate-outline' as const, label: 'رياح', value: `${weather.windSpeed} كم/س` },
                ].map((s) => (
                  <View key={s.label} style={styles.statChip}>
                    <Ionicons name={s.icon} size={14} color={Colors.brand.primary} />
                    <Text style={styles.statLabel}>{s.label}</Text>
                    <Text style={styles.statValue}>{s.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Hourly */}
            {hourly.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>توقعات ساعة بساعة</Text>
                <FlatList
                  horizontal
                  inverted
                  data={hourly}
                  keyExtractor={(h) => h.time}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}
                  renderItem={({ item }) => (
                    <View style={styles.hourCard}>
                      <Text style={styles.hourTime}>{item.time}</Text>
                      <Text style={styles.hourEmoji}>{WEATHER_ICON_MAP[item.icon] ?? '🌤️'}</Text>
                      <Text style={styles.hourTemp}>{item.temp}°</Text>
                    </View>
                  )}
                />
              </>
            )}

            {/* Outdoor suitability */}
            <View style={styles.suitabilityCard}>
              <Ionicons
                name={weather.temperature < 38 && weather.windSpeed < 40 ? 'checkmark-circle' : 'alert-circle'}
                size={22}
                color={weather.temperature < 38 && weather.windSpeed < 40 ? Colors.success : Colors.warning}
              />
              <Text style={styles.suitabilityText}>
                {weather.temperature < 38 && weather.windSpeed < 40
                  ? 'الطقس مناسب للرياضة في الهواء الطلق'
                  : 'يُفضَّل الملاعب المغلقة اليوم'}
              </Text>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.noData}>
            <Ionicons name="cloud-offline-outline" size={40} color={Colors.text.tertiary} />
            <Text style={styles.noDataText}>تعذّر تحميل بيانات الطقس</Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    paddingTop: Spacing.md,
    minHeight: 360,
    maxHeight: '75%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border.strong,
    alignSelf: 'center', marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.border.default,
    alignItems: 'center', justifyContent: 'center',
  },

  currentSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    marginBottom: Spacing.lg,
  },
  cityName: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'right', marginBottom: 4 },
  tempRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  bigTemp: { fontSize: 64, fontWeight: '200', color: Colors.text.primary, lineHeight: 72 },
  currentDetails: { alignItems: 'flex-end', gap: 4 },
  weatherDesc: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, textTransform: 'capitalize' },
  feelsLike: { fontSize: 13, color: Colors.text.tertiary },
  statsRow: { flexDirection: 'row-reverse', gap: Spacing.sm },
  statChip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    backgroundColor: Colors.brand.light,
    borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.brand.border,
  },
  statLabel: { fontSize: 11, color: Colors.text.secondary },
  statValue: { fontSize: 13, fontWeight: '700', color: Colors.brand.dark },

  sectionLabel: {
    fontSize: 14, fontWeight: '700', color: Colors.text.primary,
    textAlign: 'right', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md,
  },
  hourCard: {
    alignItems: 'center', gap: 6,
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border.default,
    minWidth: 64,
  },
  hourTime: { fontSize: 12, color: Colors.text.tertiary, fontWeight: '600' },
  hourEmoji: { fontSize: 22 },
  hourTemp: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },

  suitabilityCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  suitabilityText: { fontSize: 14, color: Colors.text.primary, flex: 1, textAlign: 'right', lineHeight: 20 },

  noData: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingVertical: 60 },
  noDataText: { fontSize: 14, color: Colors.text.tertiary },
});
