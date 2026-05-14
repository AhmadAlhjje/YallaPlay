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

// ─── Center Scanner Button ────────────────────────────────────────────────────
function ScannerIcon({ focused }: { focused: boolean }) {
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
    <View style={styles.centerWrap}>
      <Animated.View style={[styles.centerBtnInner, focused && styles.centerBtnInnerActive, { transform: [{ scale }] }]}>
        <Ionicons name={focused ? 'qr-code' : 'qr-code-outline'} size={22} color="#fff" />
      </Animated.View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function OwnerTabsLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();

  if (isLoading) return null;
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
      {/* لوحتي */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="bar-chart-outline" iconFocused="bar-chart" label="لوحتي" focused={focused} />
          ),
        }}
      />

      {/* الحجوزات */}
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="calendar-outline" iconFocused="calendar" label="الحجوزات" focused={focused} />
          ),
        }}
      />

      {/* مسح QR — center elevated */}
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarIcon: ({ focused }) => <ScannerIcon focused={focused} />,
        }}
      />

      {/* ملاعبي */}
      <Tabs.Screen
        name="facilities"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="business-outline" iconFocused="business" label="ملاعبي" focused={focused} />
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

      {/* analytics is accessible via deep link only, not in the tab bar */}
      <Tabs.Screen name="analytics" options={{ href: null }} />
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

  // Scanner center button
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  centerBtnInner: {
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
  centerBtnInnerActive: {
    backgroundColor: Colors.brand.primary,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});
