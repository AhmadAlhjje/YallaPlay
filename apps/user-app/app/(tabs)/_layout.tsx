import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
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
  const bgScale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(bgScale, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 14,
    }).start();
  }, [focused]);

  return (
    <View style={styles.tabItem}>
      <Animated.View style={[styles.tabPill, { transform: [{ scaleX: bgScale }], opacity: bgScale }]} />
      <View style={styles.tabRow}>
        <Ionicons
          name={focused ? iconFocused : icon}
          size={20}
          color={focused ? Colors.brand.primary : '#B0B8C1'}
        />
        {focused && (
          <Text style={styles.tabLabel}>{label}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Center Home Button ───────────────────────────────────────────────────────
function HomeIcon({ focused }: { focused: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.05 : 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }, [focused]);

  return (
    <View style={styles.homeWrap}>
      <Animated.View style={[styles.homeBtnInner, focused && styles.homeBtnInnerActive, { transform: [{ scale }] }]}>
        <Ionicons name={focused ? 'home' : 'home-outline'} size={21} color="#fff" />
      </Animated.View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  const BAR_H  = 58;
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
      {/* حسابي */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person-outline" iconFocused="person" label="حسابي" focused={focused} />
          ),
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

      {/* الرئيسية — center elevated */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
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

      {/* حجوزاتي */}
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="calendar-outline" iconFocused="calendar" label="حجوزاتي" focused={focused} />
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
    position: 'relative',
  },
  tabPill: {
    position: 'absolute',
    width: '100%',
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.light ?? '#E8F5E9',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.primary,
    letterSpacing: 0.1,
  },

  // Home button
  homeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  homeBtnInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 7,
  },
  homeBtnInnerActive: {
    backgroundColor: Colors.brand.primary,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});
