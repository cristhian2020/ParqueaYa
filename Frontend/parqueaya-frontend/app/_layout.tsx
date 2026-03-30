// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="parking/[id]" options={{
          headerShown: true,
          title: 'Detalle del Parqueo',
          headerBackTitle: 'Volver'
        }} />
        <Stack.Screen name="reservations/index" options={{
          headerShown: true,
          title: 'Mis Reservas',
          headerBackTitle: 'Volver'
        }} />
        <Stack.Screen name="reservations/[id]" options={{
          headerShown: true,
          title: 'Detalle de Reserva',
          headerBackTitle: 'Volver'
        }} />
        <Stack.Screen name="reservations/create" options={{
          headerShown: true,
          title: 'Nueva Reserva',
          headerBackTitle: 'Volver'
        }} />
      </Stack>
    </SafeAreaProvider>
  );
}