import { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { Colors } from '../src/theme';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [done, setDone] = useState(false);

  const fadeOut    = useRef(new Animated.Value(1)).current;
  const logoScale  = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(18)).current;

  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  const circlePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale,   { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Text slide-up (no custom Easing to avoid web compat issues)
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 450, delay: 320, useNativeDriver: true }),
      Animated.timing(textY,       { toValue: 0, duration: 450, delay: 320, useNativeDriver: true }),
    ]).start();

    // Circle breathing — uses only useNativeDriver: true, no Easing import
    Animated.loop(
      Animated.sequence([
        Animated.timing(circlePulse, { toValue: 1.055, duration: 2000, useNativeDriver: true }),
        Animated.timing(circlePulse, { toValue: 1,     duration: 2000, useNativeDriver: true }),
      ]),
    ).start();

    // Dots stagger loop
    const animateDots = () => {
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1,    duration: 380, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0.25, duration: 380, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot2, { toValue: 1,    duration: 380, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.25, duration: 380, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot3, { toValue: 1,    duration: 380, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.25, duration: 380, useNativeDriver: true }),
        ]),
      ]).start(({ finished }) => { if (finished) animateDots(); });
    };
    animateDots();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }).start(() => setDone(true));
    }
  }, [isLoading]);

  if (done) {
    return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/welcome'} />;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* Decorative circles */}
      <Animated.View style={[styles.circle, styles.circleTopLeft,  { transform: [{ scale: circlePulse }] }]} />
      <Animated.View style={[styles.circle, styles.circleTopRight, { transform: [{ scale: circlePulse }] }]} />
      <View style={[styles.circle, styles.circleBottomLeft]} />
      <View style={[styles.circle, styles.circleMid]} />

      {/* Center */}
      <View style={styles.center}>
        <Animated.View style={[styles.logoOuter, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <View style={styles.logoMiddle}>
            <View style={styles.logoInner}>
              <Text style={styles.logoEmoji}>⚽</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], alignItems: 'center', gap: 6 }}>
          <Text style={styles.appName}>يلا بلاي</Text>
          <Text style={styles.tagline}>احجز ملعبك المفضل في ثوانٍ</Text>
        </Animated.View>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((anim, i) => (
            <Animated.View key={i} style={[styles.dot, i === 1 && styles.dotMid, { opacity: anim }]} />
          ))}
        </View>
        <Text style={styles.footerText}>منصة حجز الملاعب الأولى في سوريا</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FFFE',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  circle: { position: 'absolute', borderRadius: 9999 },
  circleTopLeft: {
    width: width * 0.72, height: width * 0.72,
    top: -width * 0.22, left: -width * 0.22,
    backgroundColor: Colors.brand.light, opacity: 0.7,
  },
  circleTopRight: {
    width: width * 0.36, height: width * 0.36,
    top: height * 0.07, right: -width * 0.07,
    backgroundColor: Colors.brand.border, opacity: 0.4,
  },
  circleBottomLeft: {
    width: width * 0.26, height: width * 0.26,
    bottom: height * 0.15, left: -width * 0.05,
    backgroundColor: Colors.brand.light, opacity: 0.35,
  },
  circleMid: {
    width: width * 0.14, height: width * 0.14,
    top: height * 0.25, right: width * 0.07,
    backgroundColor: Colors.brand.border, opacity: 0.28,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },

  logoOuter: {
    width: 138, height: 138, borderRadius: 69,
    backgroundColor: Colors.brand.light,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.brand.border,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 18, elevation: 10,
  },
  logoMiddle: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.brand.border,
  },
  logoInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 40 },

  appName: {
    fontSize: 36, fontWeight: '900',
    color: Colors.brand.dark, letterSpacing: -0.5, textAlign: 'center',
  },
  tagline: {
    fontSize: 14, color: Colors.text.secondary,
    textAlign: 'center', lineHeight: 20,
  },

  bottom: { paddingBottom: 50, alignItems: 'center', gap: 18 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.brand.primary, opacity: 0.25,
  },
  dotMid: { width: 10, height: 10, borderRadius: 5 },
  footerText: {
    fontSize: 12, color: Colors.text.tertiary,
    textAlign: 'center', letterSpacing: 0.3,
  },
});
