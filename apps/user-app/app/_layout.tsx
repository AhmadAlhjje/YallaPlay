import { useEffect, Component, ReactNode } from 'react';
import { View, Text, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/auth.store';
import { useLocationStore } from '../src/store/location.store';
import { Colors } from '../src/theme';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>خطأ في التطبيق</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
            {(this.state.error as Error).message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const { requestLocation } = useLocationStore();

  useEffect(() => {
    initialize();
    requestLocation();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, ...(Platform.OS === 'web' ? { height: '100%' } : {}) }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="light" backgroundColor={Colors.background.primary} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background.primary },
                animation: Platform.OS === 'web' ? 'none' : undefined,
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="facility/[id]" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
              <Stack.Screen name="booking/[id]" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_bottom', presentation: Platform.OS === 'web' ? undefined : 'modal' }} />
              <Stack.Screen name="booking/new" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_bottom', presentation: Platform.OS === 'web' ? undefined : 'modal' }} />
              <Stack.Screen name="search" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
              <Stack.Screen name="notifications" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
              <Stack.Screen name="points" options={{ animation: Platform.OS === 'web' ? 'none' : 'slide_from_right' }} />
            </Stack>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
