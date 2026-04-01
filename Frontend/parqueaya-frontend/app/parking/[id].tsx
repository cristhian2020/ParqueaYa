import React, { useEffect, useState } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, IconButton } from 'react-native-paper';
import { useParkingStore } from '../../src/store/useParkingStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { ReviewCard } from '../../src/components/ReviewCard';
import { ReviewForm } from '../../src/components/ReviewForm';
import { reviewsService } from '../../src/api/reviews.service';
import { useAuthStore } from '../../src/store/authStore';
import { Review, CreateReviewDto, UpdateReviewDto } from '../../src/types';

export default function ParkingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const { selectedParking, isLoading, fetchById } = useParkingStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    if (id) {
      fetchById(id);
      loadReviews();
    }
  }, [id]);

  useEffect(() => {
    if (reviews.length > 0 && user) {
      const myReview = reviews.find((r) => r.user_id === user.id);
      setUserReview(myReview || null);
    } else {
      setUserReview(null);
    }
  }, [reviews, user]);

  const loadReviews = async () => {
    if (!id) return;
    setIsLoadingReviews(true);
    try {
      const [reviewsData, averageData] = await Promise.all([
        reviewsService.getByParkingLot(id),
        reviewsService.getAverageRating(id),
      ]);
      setReviews(reviewsData);
      setAverageRating(averageData.average_rating);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const handleOpenForm = () => {
    setEditingReview(null);
    setIsFormVisible(true);
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setIsFormVisible(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert(
      'Eliminar review',
      '¿Estás seguro de que quieres eliminar tu review?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await reviewsService.delete(reviewId);
              await loadReviews();
              Alert.alert('Éxito', 'Review eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la review');
            }
          },
        },
      ]
    );
  };

  const handleSubmitReview = async (data: CreateReviewDto | UpdateReviewDto) => {
    if (editingReview) {
      await reviewsService.update(editingReview.id, data as UpdateReviewDto);
      Alert.alert('Éxito', 'Review actualizada correctamente');
    } else {
      await reviewsService.create(data as CreateReviewDto);
      Alert.alert('Éxito', 'Review publicada correctamente');
    }
    await loadReviews();
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={22}
            color={star <= rating ? '#FFC107' : '#E0E0E0'}
          />
        ))}
      </View>
    );
  };

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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2196F3"
        />
      }
    >
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

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Opiniones</Text>
            {averageRating > 0 && (
              <View style={styles.averageRating}>
                <Text style={styles.averageRatingValue}>{averageRating.toFixed(1)}</Text>
                <View style={styles.averageStars}>
                  {renderStars(Math.round(averageRating))}
                </View>
                <Text style={styles.averageRatingCount}>
                  {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}
                </Text>
              </View>
            )}
          </View>

          {user && (
            <Button
              mode="outlined"
              onPress={handleOpenForm}
              icon="star-plus"
              style={styles.writeReviewButton}
            >
              Dejar una opinión
            </Button>
          )}

          {!user && (
            <Text style={styles.loginHint}>
              Inicia sesión para dejar una opinión
            </Text>
          )}

          {isLoadingReviews ? (
            <View style={styles.loadingReviews}>
              <LoadingSpinner />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.noReviews}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#BDBDBD" />
              <Text style={styles.noReviewsText}>
                Aún no hay opiniones. ¡Sé el primero en opinar!
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.map((review) => {
                const isMyReview = user?.id === review.user_id;
                return (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    isCurrentUser={isMyReview}
                    onEdit={isMyReview ? () => handleEditReview(review) : undefined}
                    onDelete={isMyReview ? () => handleDeleteReview(review.id) : undefined}
                  />
                );
              })}
            </View>
          )}
        </View>
      </View>

      <ReviewForm
        parkingLotId={id as string}
        existingReview={editingReview}
        onSubmit={handleSubmitReview}
        visible={isFormVisible}
        onDismiss={() => {
          setIsFormVisible(false);
          setEditingReview(null);
        }}
      />
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

  // Reviews section styles
  reviewsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  averageRating: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  averageRatingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  averageStars: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  averageRatingCount: {
    fontSize: 12,
    color: '#757575',
  },
  writeReviewButton: {
    marginBottom: 16,
  },
  loginHint: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  loadingReviews: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 12,
  },
  reviewsList: {
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
  },
});
