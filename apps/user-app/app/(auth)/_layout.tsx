import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

export default function AuthLayout() {
  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.primary },
        animation: 'fade',
      }}
    />
  );
}
