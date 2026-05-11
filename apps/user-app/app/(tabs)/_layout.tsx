import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Radius } from '../../src/theme';

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
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <View style={[styles.iconBubble, focused && styles.iconBubbleFocused]}>
        <Ionicons
          name={focused ? iconFocused : icon}
          size={focused ? 22 : 20}
          color={focused ? Colors.brand.primary : Colors.text.tertiary}
        />
      </View>
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
          <View style={[StyleSheet.absoluteFill, styles.tabBarBg]} />
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
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
        name="waitlist"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="time-outline" iconFocused="time" label="الانتظار" focused={focused} />
          ),
        }}
      />
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

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabBarBg: {
    backgroundColor: Colors.background.primary,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIconFocused: {
    transform: [{ translateY: -2 }],
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleFocused: {
    backgroundColor: Colors.brand.light,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  tabLabel: { fontSize: 10, fontWeight: '500', color: Colors.text.tertiary },
  tabLabelFocused: { color: Colors.brand.primary, fontWeight: '600' },
});
