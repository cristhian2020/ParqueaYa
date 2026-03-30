// app/reservations/create.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useReservationStore } from '../../src/store/useReservationStore';
import { parkingLotsService } from '../../src/api/parking-lots.service';
import { ParkingLot } from '../../src/api/parking-lots.service';

type DateTimePickerType = 'start' | 'end' | null;

export default function CreateReservationScreen() {
  const { parkingLotId } = useLocalSearchParams<{ parkingLotId: string }>();
  const router = useRouter();
  const { createReservation, isLoading } = useReservationStore();

  const [parking, setParking] = useState<ParkingLot | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [spotNumber, setSpotNumber] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  
  // Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerType, setPickerType] = useState<DateTimePickerType>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  
  // Ref para el ScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (parkingLotId) {
      loadParking();
    }
  }, [parkingLotId]);

  useEffect(() => {
    calculatePrice();
  }, [startDate, endDate, parking]);

  const loadParking = async () => {
    try {
      const data = await parkingLotsService.getById(parkingLotId);
      setParking(data);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar la información del parqueo');
      router.back();
    }
  };

  const calculatePrice = () => {
    if (!startDate || !endDate || !parking?.price_per_hour) {
      setEstimatedPrice(null);
      return;
    }

    if (startDate >= endDate) {
      setEstimatedPrice(null);
      return;
    }

    const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    const price = hours * (parking.price_per_hour || 0);
    setEstimatedPrice(price);
  };

  const validateForm = (): boolean => {
    if (!startDate) {
      Alert.alert('Error', 'Debes seleccionar la fecha y hora de inicio');
      return false;
    }

    if (!endDate) {
      Alert.alert('Error', 'Debes seleccionar la fecha y hora de fin');
      return false;
    }

    if (startDate >= endDate) {
      Alert.alert('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
      return false;
    }

    if (startDate < new Date()) {
      Alert.alert('Error', 'No se pueden crear reservas en el pasado');
      return false;
    }

    return true;
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeDisplay = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = async () => {
    if (!validateForm() || !parking) return;

    try {
      const data = {
        parking_lot_id: parkingLotId,
        start_time: startDate!.toISOString(),
        end_time: endDate!.toISOString(),
        spot_number: spotNumber ? parseInt(spotNumber) : undefined,
        vehicle_plate: vehiclePlate.toUpperCase() || undefined,
        notes: notes || undefined,
      };

      await createReservation(data);
      Alert.alert(
        'Éxito',
        'Reserva creada correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.push('/reservations' as any),
          },
        ]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al crear la reserva';
      Alert.alert('Error', message);
    }
  };

  const setQuickTime = (hoursFromNow: number) => {
    const start = new Date();
    start.setHours(start.getHours() + 1); // Empezar desde la próxima hora
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);

    const end = new Date(start);
    end.setHours(end.getHours() + hoursFromNow);

    setStartDate(start);
    setEndDate(end);
  };

  // Funciones para seleccionar fecha y hora por separado (Android friendly)
  const handleShowDatePicker = (type: DateTimePickerType) => {
    const initialDate = type === 'start' ? (startDate || new Date()) : (endDate || new Date());
    setPickerDate(initialDate);
    setPickerType(type);
    setShowDatePicker(true);
  };

  const handleShowTimePicker = (type: DateTimePickerType) => {
    const initialDate = type === 'start' ? (startDate || new Date()) : (endDate || new Date());
    setPickerDate(initialDate);
    setPickerType(type);
    setShowTimePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    
    if (selectedDate) {
      if (pickerType === 'start' && startDate) {
        const newDate = new Date(selectedDate);
        newDate.setHours(startDate.getHours(), startDate.getMinutes());
        setStartDate(newDate);
      } else if (pickerType === 'end' && endDate) {
        const newDate = new Date(selectedDate);
        newDate.setHours(endDate.getHours(), endDate.getMinutes());
        setEndDate(newDate);
      }
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    
    if (selectedTime) {
      if (pickerType === 'start' && startDate) {
        const newDate = new Date(startDate);
        newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        setStartDate(newDate);
      } else if (pickerType === 'end' && endDate) {
        const newDate = new Date(endDate);
        newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        setEndDate(newDate);
      }
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
      {/* DatePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
          locale="es-ES"
        />
      )}

      {/* TimePicker */}
      {showTimePicker && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          locale="es-ES"
        />
      )}

      {/* Información del parqueo */}
      <View style={styles.parkingHeader}>
        <Ionicons name="location" size={24} color="#2196F3" />
        <Text style={styles.parkingName}>{parking?.name || 'Cargando...'}</Text>
      </View>

      {parking?.price_per_hour && (
        <View style={styles.priceInfo}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.priceText}>Bs. {parking.price_per_hour}/hora</Text>
        </View>
      )}

      {/* Fechas rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Duración rápida</Text>
        <View style={styles.quickButtons}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => setQuickTime(1)}
          >
            <Text style={styles.quickButtonText}>1 hora</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => setQuickTime(2)}
          >
            <Text style={styles.quickButtonText}>2 horas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => setQuickTime(4)}
          >
            <Text style={styles.quickButtonText}>4 horas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => setQuickTime(8)}
          >
            <Text style={styles.quickButtonText}>8 horas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fecha de inicio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="play-circle-outline" size={16} color="#2196F3" /> Fecha y hora de inicio
        </Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => handleShowDatePicker('start')}
          >
            <Ionicons name="calendar-outline" size={20} color="#2196F3" />
            <Text style={styles.dateTimeButtonText}>
              {startDate ? formatDateDisplay(startDate) : 'Fecha'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => handleShowTimePicker('start')}
          >
            <Ionicons name="time-outline" size={20} color="#2196F3" />
            <Text style={styles.dateTimeButtonText}>
              {startDate ? formatTimeDisplay(startDate) : 'Hora'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fecha de fin */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="stop-circle-outline" size={16} color="#2196F3" /> Fecha y hora de fin
        </Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => handleShowDatePicker('end')}
          >
            <Ionicons name="calendar-outline" size={20} color="#2196F3" />
            <Text style={styles.dateTimeButtonText}>
              {endDate ? formatDateDisplay(endDate) : 'Fecha'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => handleShowTimePicker('end')}
          >
            <Ionicons name="time-outline" size={20} color="#2196F3" />
            <Text style={styles.dateTimeButtonText}>
              {endDate ? formatTimeDisplay(endDate) : 'Hora'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Número de espacio (opcional) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="apps-outline" size={16} color="#2196F3" /> Número de espacio (opcional)
        </Text>
        <TextInput
          style={styles.input}
          value={spotNumber}
          onChangeText={setSpotNumber}
          placeholder="Ej: 5"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
        <Text style={styles.inputHint}>
          Déjalo vacío para asignación automática
        </Text>
      </View>

      {/* Placa del vehículo (opcional) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="car-outline" size={16} color="#2196F3" /> Placa del vehículo (opcional)
        </Text>
        <TextInput
          style={styles.input}
          value={vehiclePlate}
          onChangeText={setVehiclePlate}
          placeholder="Ej: ABC123"
          placeholderTextColor="#999"
          autoCapitalize="characters"
        />
        <Text style={styles.inputHint}>
          Ingresa la placa de tu vehículo
        </Text>
      </View>

      {/* Notas (opcional) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="document-text-outline" size={16} color="#2196F3" /> Notas (opcional)
        </Text>
        <TextInput
          ref={(ref) => {
            if (ref) {
              // Guardamos una referencia si necesitamos hacer scroll manualmente
            }
          }}
          onFocus={() => {
            // Hacemos scroll hacia el campo de notas cuando se enfoca
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 250);
          }}
          onBlur={() => {
            // Opcional: ajustar vista al perder foco
          }}
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Agregar notas adicionales..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Precio estimado */}
      {estimatedPrice !== null && (
        <View style={styles.priceEstimate}>
          <Text style={styles.priceEstimateLabel}>Precio estimado:</Text>
          <Text style={styles.priceEstimateAmount}>Bs. {estimatedPrice.toFixed(2)}</Text>
        </View>
      )}

      {/* Botón de crear */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={24} color="white" />
            <Text style={styles.submitButtonText}>Confirmar Reserva</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  parkingHeader: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  parkingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  section: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateTimeButtonText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quickButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  priceEstimate: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceEstimateLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceEstimateAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
});
