import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuthStore } from '../../../src/store/authStore';
import { parkingLotsService, ParkingLot } from '../../../src/api/parking-lots.service';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LocationPickerModal from '../../../src/components/LocationPickerModal';

type TabType = 'register' | 'car';

export default function OwnerScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const user = useAuthStore((state) => state.user);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(
    tab === 'car' ? 'car' : 'register'
  );

  // React to navigation param changes
  useEffect(() => {
    if (tab === 'car' || tab === 'register') {
      setActiveTab(tab);
    }
  }, [tab]);

  // Form state
  const [parkingName, setParkingName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [totalSpots, setTotalSpots] = useState('');
  const [availableSpots, setAvailableSpots] = useState('');
  const [is24h, setIs24h] = useState(false);
  const [hasSecurity, setHasSecurity] = useState(false);
  const [hasCctv, setHasCctv] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);

  // List state
  const [myParkingLots, setMyParkingLots] = useState<ParkingLot[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Redirigir si el usuario no es owner
  useEffect(() => {
    if (user && user.role !== 'owner') {
      Alert.alert(
        'Acceso denegado',
        'Esta sección es solo para dueños de parqueos.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [user]);

  // Cargar parqueos al cambiar a tab lista
  useEffect(() => {
    if (activeTab === 'car') {
      fetchMyParkingLots();
    }
  }, [activeTab]);

  if (!user || user.role !== 'owner') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const fetchMyParkingLots = async () => {
    setLoadingList(true);
    try {
      const data = await parkingLotsService.getMyParkingLots();
      setMyParkingLots(data);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar tus parqueos');
    } finally {
      setLoadingList(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyParkingLots();
    setRefreshing(false);
  };

  // ==================== FORM HELPERS ====================

  const resetForm = () => {
    setParkingName('');
    setAddress('');
    setDescription('');
    setPricePerHour('');
    setTotalSpots('');
    setAvailableSpots('');
    setIs24h(false);
    setHasSecurity(false);
    setHasCctv(false);
    setLatitude(null);
    setLongitude(null);
    setEditingId(null);
  };

  const populateForm = (lot: ParkingLot) => {
    setParkingName(lot.name);
    setAddress(lot.address || '');
    setDescription(lot.description || '');
    setPricePerHour(lot.price_per_hour?.toString() || '');
    setTotalSpots(lot.total_spots?.toString() || '');
    setAvailableSpots(lot.available_spots?.toString() || '');
    setIs24h(lot.is_24h || false);
    setHasSecurity(lot.has_security || false);
    setHasCctv(lot.has_cctv || false);
    if (lot.location?.coordinates) {
      setLongitude(lot.location.coordinates[0]);
      setLatitude(lot.location.coordinates[1]);
    }
    setEditingId(lot.id);
    setActiveTab('register');
  };

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para registrar el parqueo');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(currentLocation.coords.latitude);
      setLongitude(currentLocation.coords.longitude);
      Alert.alert('Ubicación obtenida', 'Las coordenadas han sido guardadas');
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleMapLocationSelected = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSubmit = async () => {
    if (!parkingName || !address || !pricePerHour || !totalSpots) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }
    if (latitude === null || longitude === null) {
      Alert.alert('Error', 'Es necesario obtener la ubicación del parqueo');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: parkingName,
        address,
        description: description || undefined,
        latitude,
        longitude,
        price_per_hour: parseFloat(pricePerHour),
        total_spots: parseInt(totalSpots),
        available_spots: availableSpots ? parseInt(availableSpots) : parseInt(totalSpots),
        is_24h: is24h,
        has_security: hasSecurity,
        has_cctv: hasCctv,
      };

      if (editingId) {
        await parkingLotsService.update(editingId, payload);
        Alert.alert('Éxito', 'Parqueo actualizado correctamente', [
          { text: 'OK', onPress: () => { resetForm(); setActiveTab('car'); } },
        ]);
      } else {
        await parkingLotsService.create(payload);
        Alert.alert('Éxito', 'Tu parqueo ha sido registrado exitosamente', [
          { text: 'OK', onPress: () => { resetForm(); } },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al guardar el parqueo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (lot: ParkingLot) => {
    Alert.alert(
      'Eliminar parqueo',
      `¿Estás seguro de que deseas eliminar "${lot.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await parkingLotsService.delete(lot.id);
              setMyParkingLots((prev) => prev.filter((p) => p.id !== lot.id));
              Alert.alert('Eliminado', 'El parqueo ha sido eliminado');
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo eliminar el parqueo');
            }
          },
        },
      ]
    );
  };

  // ==================== RENDER HELPERS ====================

  const hasLocation = latitude !== null && longitude !== null;

  const renderForm = () => (
    <ScrollView style={styles.formScroll}>
      <View style={styles.header}>
        <Ionicons name={editingId ? 'create' : 'business'} size={32} color="white" />
        <Text style={styles.title}>
          {editingId ? 'Editar Parqueo' : 'Registra tu Parqueo'}
        </Text>
        <Text style={styles.subtitle}>
          {editingId
            ? 'Modifica los datos de tu parqueo'
            : 'Completa el formulario para registrar tu parqueo en nuestra plataforma'}
        </Text>
      </View>

      <View style={styles.form}>
        {/* === Información básica === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información básica</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del parqueo *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Ej: Parqueo Central"
                value={parkingName}
                onChangeText={setParkingName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Ej: Av. Ballivián y Calle 1"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="document-text-outline" size={20} color="#666" />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe tu parqueo..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        {/* === Ubicación === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>

          <TouchableOpacity
            style={[styles.locationButton, hasLocation && styles.locationButtonSuccess]}
            onPress={handleGetCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color={hasLocation ? '#2e7d32' : '#2196F3'} />
            ) : (
              <Ionicons
                name={hasLocation ? 'checkmark-circle' : 'locate-outline'}
                size={20}
                color={hasLocation ? '#2e7d32' : '#2196F3'}
              />
            )}
            <Text style={[styles.locationButtonText, hasLocation && styles.locationButtonTextSuccess]}>
              {hasLocation ? 'Ubicación obtenida' : 'Obtener ubicación actual'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ó</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.locationButton, styles.mapPickerButton]}
            onPress={() => setShowMapPicker(true)}
          >
            <Ionicons name="map-outline" size={20} color="#E65100" />
            <Text style={[styles.locationButtonText, styles.mapPickerButtonText]}>
              Seleccionar en el mapa
            </Text>
          </TouchableOpacity>

          {hasLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationInfoText}>
                Lat: {latitude!.toFixed(6)}, Lon: {longitude!.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* === Capacidad y precios === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capacidad y precios</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Precio por hora (Bs.) *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Ej: 5"
                value={pricePerHour}
                onChangeText={setPricePerHour}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número total de espacios *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="car-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Ej: 50"
                value={totalSpots}
                onChangeText={setTotalSpots}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Espacios disponibles</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Ej: 50 (igual al total si está vacío)"
                value={availableSpots}
                onChangeText={setAvailableSpots}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* === Servicios === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicios</Text>

          <View style={styles.switchItem}>
            <View style={styles.switchLabelContainer}>
              <Ionicons name="time-outline" size={20} color="#2196F3" />
              <Text style={styles.switchLabel}>Atención 24 horas</Text>
            </View>
            <Switch
              value={is24h}
              onValueChange={setIs24h}
              trackColor={{ false: '#ccc', true: '#2196F3' }}
              thumbColor={is24h ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchLabelContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#2196F3" />
              <Text style={styles.switchLabel}>Seguridad</Text>
            </View>
            <Switch
              value={hasSecurity}
              onValueChange={setHasSecurity}
              trackColor={{ false: '#ccc', true: '#2196F3' }}
              thumbColor={hasSecurity ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchLabelContainer}>
              <Ionicons name="videocam-outline" size={20} color="#2196F3" />
              <Text style={styles.switchLabel}>Cámaras CCTV</Text>
            </View>
            <Switch
              value={hasCctv}
              onValueChange={setHasCctv}
              trackColor={{ false: '#ccc', true: '#2196F3' }}
              thumbColor={hasCctv ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* === Submit === */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name={editingId ? 'save' : 'send'} size={20} color="white" />
          )}
          <Text style={styles.submitButtonText}>
            {submitting
              ? (editingId ? 'Guardando...' : 'Registrando...')
              : (editingId ? 'Guardar cambios' : 'Enviar registro')}
          </Text>
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity style={styles.cancelEditButton} onPress={() => { resetForm(); }}>
            <Ionicons name="close-circle-outline" size={20} color="#666" />
            <Text style={styles.cancelEditButtonText}>Cancelar edición</Text>
          </TouchableOpacity>
        )}

        {!editingId && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <Text style={styles.infoText}>
              Después de enviar tu solicitud, nuestro equipo la revisará y te contactará para completar el proceso de registro.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderParkingItem = ({ item }: { item: ParkingLot }) => (
    <View style={styles.parkingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="business" size={22} color="#2196F3" />
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        </View>
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#2e7d32" />
            <Text style={styles.verifiedText}>Verificado</Text>
          </View>
        )}
      </View>

      {item.address && (
        <View style={styles.cardRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.cardRowText} numberOfLines={1}>{item.address}</Text>
        </View>
      )}

      <View style={styles.cardDetailsRow}>
        <View style={styles.cardDetail}>
          <Ionicons name="cash-outline" size={16} color="#4CAF50" />
          <Text style={styles.cardDetailText}>Bs. {item.price_per_hour}/hr</Text>
        </View>
        <View style={styles.cardDetail}>
          <Ionicons name="car-outline" size={16} color="#2196F3" />
          <Text style={styles.cardDetailText}>
            {item.available_spots ?? '?'}/{item.total_spots ?? '?'} espacios
          </Text>
        </View>
      </View>

      <View style={styles.cardBadges}>
        {item.is_24h && (
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={12} color="#1976D2" />
            <Text style={styles.badgeText}>24h</Text>
          </View>
        )}
        {item.has_security && (
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark-outline" size={12} color="#1976D2" />
            <Text style={styles.badgeText}>Seguridad</Text>
          </View>
        )}
        {item.has_cctv && (
          <View style={styles.badge}>
            <Ionicons name="videocam-outline" size={12} color="#1976D2" />
            <Text style={styles.badgeText}>CCTV</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => populateForm(item)}
        >
          <Ionicons name="create-outline" size={18} color="#2196F3" />
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#F44336" />
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderList = () => (
    <View style={styles.listWrapper}>
      <View style={styles.header}>
        <Ionicons name="car" size={32} color="white" />
        <Text style={styles.title}>Mis Parqueos</Text>
        <Text style={styles.subtitle}>
          {myParkingLots.length} parqueo{myParkingLots.length !== 1 ? 's' : ''} registrado{myParkingLots.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {loadingList && myParkingLots.length === 0 ? (
        <View style={styles.listLoading}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.listLoadingText}>Cargando tus parqueos...</Text>
        </View>
      ) : myParkingLots.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No tienes parqueos registrados</Text>
          <Text style={styles.emptySubtitle}>
            Registra tu primer parqueo en la pestaña "Registrar"
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setActiveTab('register')}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.emptyButtonText}>Registrar parqueo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={myParkingLots}
          keyExtractor={(item) => item.id}
          renderItem={renderParkingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
          }
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'register' && styles.tabItemActive]}
          onPress={() => setActiveTab('register')}
        >
          <Ionicons
            name={activeTab === 'register' ? 'add-circle' : 'add-circle-outline'}
            size={20}
            color={activeTab === 'register' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
            Registrar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'car' && styles.tabItemActive]}
          onPress={() => setActiveTab('car')}
        >
          <Ionicons
            name={activeTab === 'car' ? 'car' : 'car-outline'}
            size={20}
            color={activeTab === 'car' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'car' && styles.tabTextActive]}>
            Mis Parqueos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'register' ? renderForm() : renderList()}

      {/* Map Picker Modal */}
      <LocationPickerModal
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelected={handleMapLocationSelected}
        initialLatitude={latitude ?? undefined}
        initialLongitude={longitude ?? undefined}
      />
    </View>
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
  // ===== Tab Bar =====
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
  },
  // ===== Header =====
  header: {
    backgroundColor: '#2196F3',
    padding: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  // ===== Form =====
  formScroll: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  locationButtonSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2e7d32',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  locationButtonTextSuccess: {
    color: '#2e7d32',
  },
  mapPickerButton: {
    backgroundColor: '#FFF3E0',
    borderColor: '#E65100',
  },
  mapPickerButtonText: {
    color: '#E65100',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  locationInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  locationInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    gap: 8,
  },
  cancelEditButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
  },
  // ===== List =====
  listWrapper: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  listLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // ===== Parking Card =====
  parkingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardRowText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDetailText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
});
