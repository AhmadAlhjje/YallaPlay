import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { Colors } from '../src/theme';

export default function Root() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [done, setDone] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const opacity  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1600,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
      }).start(() => setDone(true));
    }
  }, [isLoading]);

  if (done) {
    return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/welcome'} />;
  }

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Text style={{ fontSize: 48 }}>🏟️</Text>
        </View>
        <Text style={styles.appName}>يلا بلاي</Text>
        <Text style={styles.tagline}>بوابة أصحاب الملاعب</Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { width: barWidth }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'space-between',
    paddingBottom: 60,
    paddingTop: 120,
  },
  content:  { alignItems: 'center', gap: 12 },
  logoBox:  {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  appName:  { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  tagline:  { color: 'rgba(255,255,255,0.75)', fontSize: 15 },

  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginHorizontal: 48,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});
