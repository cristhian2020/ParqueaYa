import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '../../src/store/useParkingStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

export default function ParkingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { selectedParking, isLoading, fetchById } = useParkingStore();

  useEffect(() => {
    if (id) {
      fetchById(id);
    }
  }, [id]);

  const openInMaps = () => {
    if (!selectedParking || !selectedParking.location) return;

    const coordinates = selectedParking.location.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${coordinates[1]},${coordinates[0]}`,
      android: `geo:0,0?q=${coordinates[1]},${coordinates[0]}(${selectedParking.name})`,
    });

    Linking.openURL(url!);
  };

  const handleReserve = () => {
    router.push({
      pathname: '/reservations/create' as any,
      params: { parkingLotId: id },
    });
  };

  if (isLoading || !selectedParking) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: selectedParking.name,
        }}
      />

      <View style={styles.content}>
        {selectedParking.address && (
          <View style={styles.section}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.address}>{selectedParking.address}</Text>
          </View>
        )}

        <View style={styles.infoGrid}>
          {selectedParking.price_per_hour && (
            <View style={styles.infoCard}>
              <Ionicons name="cash-outline" size={24} color="#2196F3" />
              <Text style={styles.infoLabel}>Precio por hora</Text>
              <Text style={styles.infoValue}>Bs. {selectedParking.price_per_hour}</Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons name="car-outline" size={24} color="#2196F3" />
            <Text style={styles.infoLabel}>Disponibilidad</Text>
            <Text style={styles.infoValue}>
              {selectedParking.available_spots}/{selectedParking.total_spots}
            </Text>
          </View>
        </View>

        <View style={styles.amenities}>
          <Text style={styles.sectionTitle}>Servicios</Text>
          <View style={styles.amenitiesList}>
            {selectedParking.is_24h && (
              <View style={styles.amenityItem}>
                <Ionicons name="time-outline" size={20} color="#4CAF50" />
                <Text style={styles.amenityText}>24 horas</Text>
              </View>
            )}
            {selectedParking.has_security && (
              <View style={styles.amenityItem}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
                <Text style={styles.amenityText}>Seguridad</Text>
              </View>
            )}
            {selectedParking.has_cctv && (
              <View style={styles.amenityItem}>
                <Ionicons name="videocam-outline" size={20} color="#4CAF50" />
                <Text style={styles.amenityText}>Cámaras CCTV</Text>
              </View>
            )}
          </View>
        </View>

        {selectedParking.description && (
          <View style={styles.description}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>{selectedParking.description}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.navigateButton} onPress={openInMaps}>
          <Ionicons name="navigate" size={24} color="white" />
          <Text style={styles.navigateButtonText}>Cómo llegar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reserveButton} onPress={handleReserve}>
          <Ionicons name="calendar-outline" size={24} color="#2196F3" />
          <Text style={styles.reserveButtonText}>Reservar espacio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  content: {
    padding: 16,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  amenities: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
  },
  description: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  navigateButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reserveButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 8,
  },
  reserveButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
