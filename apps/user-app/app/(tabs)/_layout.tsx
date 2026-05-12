import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Platform, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors } from '../../src/theme';

// ─── Regular Tab Icon ─────────────────────────────────────────────────────────
function TabIcon({
  icon,
  iconFocused,
  label,
  focused,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const dotScale   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: focused ? -2 : 0,
        useNativeDriver: true,
        tension: 180,
        friction: 10,
      }),
      Animated.spring(dotScale, {
        toValue: focused ? 1 : 0,
        useNativeDriver: true,
        tension: 200,
        friction: 12,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View style={[styles.tabItem, { transform: [{ translateY }] }]}>
      <Ionicons
        name={focused ? iconFocused : icon}
        size={23}
        color={focused ? Colors.brand.primary : '#B0B8C1'}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
      <Animated.View style={[styles.activeDot, { transform: [{ scale: dotScale }] }]} />
    </Animated.View>
  );
}

// ─── Center Home Button ───────────────────────────────────────────────────────
function HomeIcon({ focused }: { focused: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const ring  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.08 : 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
      Animated.timing(ring, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.homeWrap}>
      <Animated.View style={[styles.homeBtn, { transform: [{ scale }] }]}>
        {/* Outer ring when active */}
        <Animated.View style={[styles.homeRing, { opacity: ring }]} />
        <View style={[styles.homeBtnInner, focused && styles.homeBtnInnerActive]}>
          <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color="#fff" />
        </View>
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>الرئيسية</Text>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  const BAR_H  = 62;
  const BOTTOM = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: BOTTOM,
          left: 16,
          right: 16,
          height: BAR_H,
          borderRadius: 24,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, {
            borderRadius: 24,
            backgroundColor: '#FFFFFF',
            shadowColor: '#1A2332',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.13,
            shadowRadius: 24,
            elevation: 16,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.055)',
          }]} />
        ),
        tabBarItemStyle: {
          height: BAR_H,
          paddingTop: 0,
          paddingBottom: 0,
        },
      }}
    >
      {/* حجوزاتي */}
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="calendar-outline" iconFocused="calendar" label="حجوزاتي" focused={focused} />
          ),
        }}
      />

      {/* المفضلة */}
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="heart-outline" iconFocused="heart" label="المفضلة" focused={focused} />
          ),
        }}
      />

      {/* الرئيسية — center elevated */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      />

      {/* قريب */}
      <Tabs.Screen
        name="nearby"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="location-outline" iconFocused="location" label="قريب" focused={focused} />
          ),
        }}
      />

      {/* حسابي */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person-outline" iconFocused="person" label="حسابي" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen name="waitlist" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Regular tab
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#B0B8C1',
    letterSpacing: 0.1,
  },
  tabLabelFocused: {
    color: Colors.brand.primary,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brand.primary,
    marginTop: 1,
  },

  // Home button
  homeWrap: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 0,
    marginTop: -18,
  },
  homeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.brand.primary,
    opacity: 0.25,
  },
  homeBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  homeBtnInnerActive: {
    backgroundColor: Colors.brand.primary,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
});
