// app/(tabs)/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === 'owner';

  const features = [
    {
      icon: 'map-outline',
      title: 'Mapa interactivo',
      description: 'Encuentra parqueos cerca de ti',
      color: '#2196F3',
      action: () => router.push('/(tabs)/map'),
    },
    {
      icon: 'car-outline',
      title: 'Disponibilidad en tiempo real',
      description: 'Espacios disponibles actualizados',
      color: '#4CAF50',
      action: () => router.push('/(tabs)/map'),
    },
    {
      icon: 'cash-outline',
      title: 'Compara precios',
      description: 'Encuentra la mejor opción',
      color: '#FF9800',
      action: () => router.push('/(tabs)/map'),
    },
  ];

  // Solo mostrar la opción de registrar parqueo para owners
  if (isOwner) {
    features.push({
      icon: 'business-outline',
      title: 'Registra tu parqueo',
      description: 'Para dueños de parqueos',
      color: '#9C27B0',
      action: () => router.push('/(tabs)/owner'),
    });
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>¡Bienvenido!</Text>
        <Text style={styles.subtitle}>
          Encuentra el mejor lugar para estacionar
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={styles.featureCard}
            onPress={feature.action}
          >
            <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
              <Ionicons name={feature.icon as any} size={32} color={feature.color} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isOwner && (
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaTitle}>¿Eres dueño de un parqueo?</Text>
          <Text style={styles.ctaText}>
            Registra tu parqueo y llega a más clientes
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(auth)/register' as any)}
          >
            <Text style={styles.ctaButtonText}>Crear cuenta de dueño</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    backgroundColor: '#2196F3',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  ctaContainer: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});