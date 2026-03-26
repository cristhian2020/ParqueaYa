// app/(tabs)/map.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useParkingStore } from '../../src/store/useParkingStore';
import { ParkingCard } from '../../src/components/ParkingCard';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);

  const { parkingLots, isLoading, fetchNearby } = useParkingStore();
  
  // Validación defensiva para parkingLots
  const safeParkingLots = Array.isArray(parkingLots) ? parkingLots : [];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setUserLocation(region);
      mapRef.current?.animateToRegion(region, 1000);
      await fetchNearby(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
    }
  };

  const handleRegionChangeComplete = async (region: Region) => {
    await fetchNearby(region.latitude, region.longitude);
  };

  const handleParkingPress = (parkingId: string) => {
    router.push(`/parking/${parkingId}` as any);
  };

  if (isLoading && safeParkingLots.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={locationPermission}
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        initialRegion={userLocation || {
          latitude: -17.3895,
          longitude: -66.1568,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {safeParkingLots.map((parking) => {
          if (!parking.location) return null;
          
          return (
            <Marker
              key={parking.id}
              coordinate={{
                latitude: parking.location.coordinates[1],
                longitude: parking.location.coordinates[0],
              }}
              onPress={() => handleParkingPress(parking.id)}
              pinColor={parking.available_spots && parking.available_spots > 0 ? '#4CAF50' : '#F44336'}
            />
          );
        })}
      </MapView>

      <TouchableOpacity
        style={styles.locationButton}
        onPress={getCurrentLocation}
      >
        <Ionicons name="locate" size={24} color="#2196F3" />
      </TouchableOpacity>

      <View style={styles.listContainer}>
        {safeParkingLots.slice(0, 3).map((parking) => (
          <ParkingCard
            key={parking.id}
            parking={parking}
            onPress={() => handleParkingPress(parking.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    maxHeight: 200,
  },
});