import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ParkingLot } from '../api/parking-lots.service';
import { Ionicons } from '@expo/vector-icons';

interface ParkingCardProps {
  parking: ParkingLot;
  onPress?: () => void;
}

export function ParkingCard({ parking, onPress }: ParkingCardProps) {
  const isAvailable = parking.available_spots && parking.available_spots > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Ionicons name="location" size={20} color="#2196F3" />
          <Text style={styles.name} numberOfLines={1}>
            {parking.name}
          </Text>
        </View>
        {parking.price_per_hour && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>Bs. {parking.price_per_hour}/hr</Text>
          </View>
        )}
      </View>

      {parking.address && (
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.address} numberOfLines={1}>
            {parking.address}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.availabilityContainer}>
          <Ionicons
            name={isAvailable ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={isAvailable ? '#4CAF50' : '#F44336'}
          />
          <Text
            style={[
              styles.availabilityText,
              { color: isAvailable ? '#4CAF50' : '#F44336' },
            ]}
          >
            {parking.available_spots ?? 0}/{parking.total_spots} disponibles
          </Text>
        </View>

        <View style={styles.amenitiesContainer}>
          {parking.is_24h && (
            <Ionicons name="time" size={14} color="#666" style={styles.amenityIcon} />
          )}
          {parking.has_security && (
            <Ionicons name="shield-checkmark" size={14} color="#666" style={styles.amenityIcon} />
          )}
          {parking.has_cctv && (
            <Ionicons name="videocam" size={14} color="#666" style={styles.amenityIcon} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priceBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  address: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  amenitiesContainer: {
    flexDirection: 'row',
  },
  amenityIcon: {
    marginLeft: 4,
  },
});
