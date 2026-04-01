import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Divider, Surface, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReviewCardProps {
  review: Review;
  isCurrentUser?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isCurrentUser = false,
  onEdit,
  onDelete,
}) => {
  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={20}
            color={star <= rating ? '#FFC107' : '#E0E0E0'}
          />
        ))}
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {review.user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{review.user?.name || 'Usuario'}</Text>
            <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
          </View>
        </View>
        {(onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={22}
                onPress={onEdit}
                iconColor="#1976D2"
              />
            )}
            {onDelete && (
              <IconButton
                icon="delete"
                size={22}
                onPress={onDelete}
                iconColor="#D32F2F"
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.ratingContainer}>
        {renderStars(review.rating)}
        <Text style={styles.ratingText}>{review.rating} de 5</Text>
      </View>

      {review.comment && (
        <>
          <Divider style={styles.divider} />
          <Text style={styles.comment}>{review.comment}</Text>
        </>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  reviewDate: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 14,
    color: '#616161',
    marginLeft: 8,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 8,
  },
  comment: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
});
