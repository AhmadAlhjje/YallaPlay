import { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { Colors } from '../src/theme';

const { width } = Dimensions.get('window');

export default function Index() {
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
        duration: 350,
        delay: 150,
        useNativeDriver: true,
      }).start(() => setDone(true));
    }
  }, [isLoading]);

  if (done) {
    return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/welcome'} />;
  }

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.center}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>⚽</Text>
        </View>
        <Text style={styles.appName}>يلا بلاي</Text>
        <Text style={styles.tagline}>احجز ملعبك المفضل في ثوانٍ</Text>
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: Colors.brand.light,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoEmoji: { fontSize: 52 },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.brand.light,
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.brand.primary,
    borderRadius: 2,
  },
});
