import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/auth.store';
import { useLocationStore } from '../src/store/location.store';
import { Colors } from '../src/theme';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor={Colors.background.primary} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background.primary } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="facility/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="booking/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="booking/new" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="search" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="points" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
