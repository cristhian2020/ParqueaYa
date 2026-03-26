// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === 'owner';
  const insets = useSafeAreaInsets();

  // Calcular el padding inferior considerando los botones de navegación de Android
  const bottomPadding = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 8) + 5 
    : insets.bottom + 5;

  return (
    <Tabs
      key={String(isOwner)}
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          paddingBottom: bottomPadding,
          paddingTop: 5,
          height: 60 + (Platform.OS === 'android' ? insets.bottom : 0),
        },
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerTitle: 'Parqueo Bolivia',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
          headerTitle: 'Mapa de Parqueos',
        }}
      />
      <Tabs.Screen
        name="owner/index"
        options={{
          title: 'Mis Parqueos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-outline" size={size} color={color} />
          ),
          headerTitle: 'Mis Parqueos',
          href: isOwner ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          headerTitle: 'Mi Perfil',
        }}
      />
    </Tabs>
  );
}
