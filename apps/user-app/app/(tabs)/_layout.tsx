import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Radius } from '../../src/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={{ fontSize: focused ? 22 : 20 }}>{emoji}</Text>
      <Text style={[styles.tabLabel, { color: focused ? Colors.brand.primary : Colors.text.tertiary }]}>
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
          Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background.elevated + 'F0' }]} />
          )
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="الرئيسية" focused={focused} /> }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="حجوزاتي" focused={focused} /> }}
      />
      <Tabs.Screen
        name="waitlist"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⏳" label="الانتظار" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="حسابي" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: Colors.glass.border,
    backgroundColor: 'transparent',
    height: Platform.OS === 'ios' ? 88 : 68,
    elevation: 0,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    gap: 2,
  },
  tabIconFocused: {},
  tabLabel: { fontSize: 10, fontWeight: '500' },
});
