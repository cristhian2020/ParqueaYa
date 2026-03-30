// app/reservations/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReservationStore } from '../../src/store/useReservationStore';
import { Reservation } from '../../src/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getStatusConfig = (status: string) => {
  const configs: Record<string, { color: string; label: string; icon: any }> = {
    pending: { color: '#FF9800', label: 'Pendiente', icon: 'time-outline' },
    confirmed: { color: '#4CAF50', label: 'Confirmada', icon: 'checkmark-circle-outline' },
    cancelled: { color: '#F44336', label: 'Cancelada', icon: 'close-circle-outline' },
    completed: { color: '#2196F3', label: 'Completada', icon: 'checkmark-done-circle-outline' },
    no_show: { color: '#9E9E9E', label: 'No se presentó', icon: 'person-outline' },
  };
  return configs[status] || configs.pending;
};

export default function ReservationsScreen() {
  const router = useRouter();
  const { reservations, loadMyReservations, isLoading, error } = useReservationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMyReservations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyReservations();
    setRefreshing(false);
  };

  const handlePressReservation = (reservation: Reservation) => {
    router.push({
      pathname: '/reservations/[id]' as any,
      params: { id: reservation.id },
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) {
      return 'Bs. 0.00';
    }
    return `Bs. ${Number(amount).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {reservations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No tienes reservas</Text>
            <Text style={styles.emptyText}>
              Cuando reserves un parqueo, aparecerá aquí
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/map')}
            >
              <Ionicons name="map-outline" size={20} color="white" />
              <Text style={styles.ctaButtonText}>Ver parqueos disponibles</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.reservationsContainer}>
            {reservations.map((reservation) => {
              const statusConfig = getStatusConfig(reservation.status);
              return (
                <TouchableOpacity
                  key={reservation.id}
                  style={styles.reservationCard}
                  onPress={() => handlePressReservation(reservation)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.parkingInfo}>
                      <Ionicons name="location" size={20} color="#2196F3" />
                      <Text style={styles.parkingName} numberOfLines={1}>
                        {reservation.parking_lot?.name || 'Parqueo'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusConfig.color + '20' },
                      ]}
                    >
                      <Ionicons
                        name={statusConfig.icon as any}
                        size={14}
                        color={statusConfig.color}
                      />
                      <Text
                        style={[styles.statusText, { color: statusConfig.color }]}
                      >
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.dateTimeRow}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.dateTimeText}>
                        {formatDate(reservation.start_time)}
                      </Text>
                    </View>

                    <View style={styles.dateTimeRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.dateTimeText}>
                        {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                      </Text>
                    </View>

                    {reservation.spot_number && (
                      <View style={styles.dateTimeRow}>
                        <Ionicons name="apps-outline" size={16} color="#666" />
                        <Text style={styles.dateTimeText}>
                          Espacio #{reservation.spot_number}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Total:</Text>
                      <Text style={styles.priceAmount}>
                        {formatCurrency(reservation.total_price)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
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
  reservationsContainer: {
    padding: 16,
  },
  reservationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parkingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 12,
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});
