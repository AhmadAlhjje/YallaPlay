import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRef, useEffect } from 'react';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors } from '../../src/theme';

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
  const scale = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.08 : 1,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(bgOpacity, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.tabItem}>
      <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
        {/* Active background pill */}
        <Animated.View style={[styles.activeBg, { opacity: bgOpacity }]} />
        <Ionicons
          name={focused ? iconFocused : icon}
          size={22}
          color={focused ? Colors.brand.primary : Colors.text.tertiary}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, styles.barBg]}>
            <View style={styles.topAccent} />
          </View>
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person-outline" iconFocused="person" label="حسابي" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="heart-outline" iconFocused="heart" label="المفضلة" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="location-outline" iconFocused="location" label="قريب" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="waitlist" options={{ href: null }} />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="calendar-outline" iconFocused="calendar" label="حجوزاتي" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home-outline" iconFocused="home" label="الرئيسية" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const BAR_H = Platform.OS === 'ios' ? 76 : 64;

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 12,
    left: 14,
    right: 14,
    height: BAR_H,
    borderRadius: 28,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  barBg: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  topAccent: {
    position: 'absolute',
    top: 6,
    left: 20,
    right: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.brand.primary,
    opacity: 0.2,
  },
  tabBarItem: {
    height: BAR_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 46,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeBg: {
    position: 'absolute',
    width: 46,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.light,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text.tertiary,
  },
  tabLabelFocused: {
    color: Colors.brand.primary,
    fontWeight: '700',
  },
});
