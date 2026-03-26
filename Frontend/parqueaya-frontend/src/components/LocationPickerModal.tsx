// src/components/LocationPickerModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (latitude: number, longitude: number) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

export default function LocationPickerModal({
  visible,
  onClose,
  onLocationSelected,
  initialLatitude,
  initialLongitude,
}: LocationPickerModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    initialLatitude && initialLongitude
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null
  );

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation.latitude, selectedLocation.longitude);
      onClose();
    }
  };

  const initialRegion = {
    latitude: initialLatitude || -17.3895,
    longitude: initialLongitude || -66.1568,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seleccionar ubicación</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.headerButton, !selectedLocation && styles.headerButtonDisabled]}
            disabled={!selectedLocation}
          >
            <Ionicons name="checkmark" size={24} color={selectedLocation ? 'white' : 'rgba(255,255,255,0.4)'} />
          </TouchableOpacity>
        </View>

        {/* Instruction */}
        <View style={styles.instruction}>
          <Ionicons name="finger-print-outline" size={18} color="#1976D2" />
          <Text style={styles.instructionText}>
            Toca en el mapa para marcar la ubicación de tu parqueo
          </Text>
        </View>

        {/* Map */}
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setSelectedLocation({ latitude, longitude });
              }}
            />
          )}
        </MapView>

        {/* Selected coordinates info */}
        {selectedLocation && (
          <View style={styles.coordsBar}>
            <Ionicons name="location" size={18} color="#2e7d32" />
            <Text style={styles.coordsText}>
              Lat: {selectedLocation.latitude.toFixed(6)}, Lon: {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Confirm button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!selectedLocation}
          >
            <Ionicons name="checkmark-circle" size={22} color="white" />
            <Text style={styles.confirmButtonText}>Confirmar ubicación</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonDisabled: {
    opacity: 0.4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    gap: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#1976D2',
    flex: 1,
  },
  map: {
    flex: 1,
  },
  coordsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    gap: 8,
  },
  coordsText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
