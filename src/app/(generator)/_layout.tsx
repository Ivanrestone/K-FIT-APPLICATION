import { Stack } from 'expo-router';

export default function GeneratorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'none',
      }}
    />
  );
}
