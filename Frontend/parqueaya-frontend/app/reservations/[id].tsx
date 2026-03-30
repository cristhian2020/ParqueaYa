// app/reservations/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { reservationsService } from '../../src/api/reservations.service';
import { Reservation } from '../../src/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../../src/store/authStore';

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

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadReservation();
  }, [id]);

  const loadReservation = async () => {
    try {
      setIsLoading(true);
      const data = await reservationsService.getById(id);
      setReservation(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al cargar la reserva');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar reserva',
      '¿Estás seguro de que deseas cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: confirmCancel,
        },
      ]
    );
  };

  const confirmCancel = async () => {
    try {
      setIsCancelling(true);
      await reservationsService.cancel(id);
      Alert.alert('Éxito', 'Reserva cancelada correctamente');
      loadReservation();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al cancelar la reserva');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE, dd 'de' MMMM, yyyy", { locale: es });
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

  const calculateDuration = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffMs = endDate.getTime() - startDate.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}m`;
      }
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>No se encontró la reserva</Text>
      </View>
    );
  }

  const statusConfig = getStatusConfig(reservation.status);
  const canCancel = 
    reservation.status !== 'cancelled' && 
    reservation.status !== 'completed' &&
    user?.id === reservation.user_id;

  return (
    <ScrollView style={styles.container}>
      {/* Header con estado */}
      <View style={[styles.header, { backgroundColor: statusConfig.color }]}>
        <View style={styles.headerContent}>
          <Ionicons name={statusConfig.icon as any} size={32} color="white" />
          <Text style={styles.headerTitle}>{statusConfig.label}</Text>
        </View>
      </View>

      {/* Información del parqueo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parqueo</Text>
        <View style={styles.infoCard}>
          <View style={styles.parkingHeader}>
            <Ionicons name="location" size={24} color="#2196F3" />
            <Text style={styles.parkingName}>
              {reservation.parking_lot?.name || 'Parqueo'}
            </Text>
          </View>
          {reservation.parking_lot?.address && (
            <View style={styles.addressRow}>
              <Ionicons name="map-outline" size={16} color="#666" />
              <Text style={styles.addressText}>
                {reservation.parking_lot.address}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Fecha y hora */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fecha y Hora</Text>
        <View style={styles.infoCard}>
          <View style={styles.dateTimeRow}>
            <Ionicons name="calendar-outline" size={20} color="#2196F3" />
            <View style={styles.dateTimeInfo}>
              <Text style={styles.dateTimeLabel}>Fecha de inicio</Text>
              <Text style={styles.dateTimeValue}>
                {formatDate(reservation.start_time)}
              </Text>
              
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.dateTimeRow}>
            <Ionicons name="time-outline" size={20} color="#2196F3" />
            <View style={styles.dateTimeInfo}>
              <Text style={styles.dateTimeLabel}>Horario</Text>
              <Text style={styles.dateTimeValue}>
                {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
              </Text>
              <Text style={styles.durationText}>
                ({calculateDuration(reservation.start_time, reservation.end_time)})
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Espacio asignado */}
      {reservation.spot_number && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Espacio Asignado</Text>
          <View style={[styles.infoCard, styles.spotCard]}>
            <Ionicons name="apps" size={32} color="#2196F3" />
            <Text style={styles.spotNumber}>#{reservation.spot_number}</Text>
          </View>
        </View>
      )}

      {/* Precio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalle del Pago</Text>
        <View style={styles.infoCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total pagado:</Text>
            <Text style={styles.priceAmount}>{formatCurrency(reservation.total_price)}</Text>
          </View>
        </View>
      </View>

      {/* Notas */}
      {reservation.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <View style={styles.infoCard}>
            <Text style={styles.notesText}>{reservation.notes}</Text>
          </View>
        </View>
      )}

      {/* Información adicional */}
      {reservation.cancelled_by_owner && (
        <View style={[styles.section, styles.warningSection]}>
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color="#FF9800" />
            <Text style={styles.warningText}>
              Esta reserva fue cancelada por el dueño del parqueo
            </Text>
          </View>
        </View>
      )}

      {/* Botón de cancelar */}
      {canCancel && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
            onPress={handleCancel}
            disabled={isCancelling}
          >
            <Ionicons
              name={isCancelling ? 'hourglass-outline' : 'close-circle-outline'}
              size={20}
              color="white"
            />
            <Text style={styles.cancelButtonText}>
              {isCancelling ? 'Cancelando...' : 'Cancelar Reserva'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Espacio final */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  parkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  parkingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  durationText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  spotCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  spotNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  warningSection: {
    paddingTop: 8,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    flex: 1,
  },
  actionsContainer: {
    padding: 16,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonDisabled: {
    backgroundColor: '#EF9A9A',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
