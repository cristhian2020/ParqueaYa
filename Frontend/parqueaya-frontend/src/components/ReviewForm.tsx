import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Dialog,
  Portal,
  HelperText,
} from "react-native-paper";
import { Review, CreateReviewDto, UpdateReviewDto } from "../types";

interface ReviewFormProps {
  parkingLotId: string;
  existingReview?: Review | null;
  onSubmit: (data: CreateReviewDto | UpdateReviewDto) => Promise<void>;
  visible: boolean;
  onDismiss: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  parkingLotId,
  existingReview,
  onSubmit,
  visible,
  onDismiss,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!existingReview;

  // Sincronizar el estado cuando existingReview cambie
  React.useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
  }, [existingReview, visible]);

  const handleSubmit = async () => {
    setError("");

    if (rating < 1 || rating > 5) {
      setError("Por favor selecciona una calificación de 1 a 5 estrellas");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateReviewDto | UpdateReviewDto = isEditing
        ? { rating, comment: comment || undefined }
        : {
            rating,
            comment: comment || undefined,
            parking_lot_id: parkingLotId,
          };

      await onSubmit(data);
      handleReset();
      onDismiss();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar la review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setError("");
  };

  const handleDismiss = () => {
    onDismiss();
  };

  const renderStarRating = () => {
    return (
      <View style={styles.starRatingContainer}>
        <Text style={styles.ratingLabel}> Tu calificación:</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <IconButton
              key={star}
              icon={star <= rating ? "star" : "star-outline"}
              size={36}
              iconColor={star <= rating ? "#FFC107" : "#E0E0E0"}
              onPress={() => setRating(star)}
              style={styles.starButton}
            />
          ))}
        </View>
        {rating > 0 && <Text style={styles.ratingValue}>{rating} de 5</Text>}
      </View>
    );
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title>
          {isEditing ? "Editar tu review" : "Dejar una review"}
        </Dialog.Title>
        <Dialog.Content>
          <ScrollView style={styles.scrollContent}>
            {renderStarRating()}

            <HelperText type="info" style={styles.helperText}>
              Toca las estrellas para calificar
            </HelperText>

            <TextInput
              label="Comentario (opcional)"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              mode="outlined"
              placeholder="Cuéntanos tu experiencia en este parqueo..."
              style={styles.commentInput}
            />

            {error ? (
              <HelperText type="error" visible={true}>
                {error}
              </HelperText>
            ) : null}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={isSubmitting || rating === 0}
            loading={isSubmitting}
          >
            {isEditing ? "Actualizar" : "Publicar"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    maxHeight: 400,
  },
  starRatingContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#d4cacaff",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  starButton: {
    margin: 0,
  },
  ratingValue: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  helperText: {
    textAlign: "center",
    marginBottom: 16,
  },
  commentInput: {
    marginBottom: 8,
  },
});
