import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { useGameStore, Card } from '../../src/stores/gameStore';
import { Colors } from '../../src/constants/colors';
import { CardItem } from '../../src/components/CardItem';

export default function CardsScreen() {
  const { token } = useAuthStore();
  const { userCards, deck, fetchUserCards, updateDeck, allCards, fetchAllCards } = useGameStore();
  const [selectedDeck, setSelectedDeck] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAllCards(token);
      fetchUserCards(token);
    }
  }, [token]);

  useEffect(() => {
    setSelectedDeck(deck);
  }, [deck]);

  const handleCardPress = (card: Card) => {
    if (!editMode) return;

    if (selectedDeck.includes(card.id)) {
      setSelectedDeck(selectedDeck.filter((id) => id !== card.id));
    } else {
      if (selectedDeck.length >= 8) {
        Alert.alert('Máximo alcanzado', 'El deck solo puede tener 8 cartas');
        return;
      }
      setSelectedDeck([...selectedDeck, card.id]);
    }
  };

  const handleSaveDeck = async () => {
    if (selectedDeck.length < 1) {
      Alert.alert('Error', 'Debes tener al menos 1 carta en tu deck');
      return;
    }

    await updateDeck(token!, selectedDeck);
    setEditMode(false);
    Alert.alert('Éxito', 'Deck guardado correctamente');
  };

  const deckCards = userCards.filter((c) => selectedDeck.includes(c.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TU COLECCIÓN</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (editMode ? handleSaveDeck() : setEditMode(true))}
        >
          <Ionicons
            name={editMode ? 'checkmark' : 'pencil'}
            size={20}
            color="#FFF"
          />
          <Text style={styles.editButtonText}>
            {editMode ? 'Guardar' : 'Editar Deck'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Deck */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Deck Actual ({selectedDeck.length}/8)
          </Text>
          <View style={styles.deckContainer}>
            {deckCards.length > 0 ? (
              <View style={styles.cardsGrid}>
                {deckCards.map((card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    selected={editMode}
                    onPress={() => handleCardPress(card)}
                    size="small"
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No hay cartas en tu deck</Text>
            )}
          </View>
        </View>

        {/* All Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Todas tus Cartas</Text>
          <View style={styles.cardsGrid}>
            {userCards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                selected={editMode && selectedDeck.includes(card.id)}
                onPress={() => handleCardPress(card)}
                size="medium"
              />
            ))}
          </View>
        </View>

        {editMode && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSelectedDeck(deck);
              setEditMode(false);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  deckContainer: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.danger,
    fontWeight: '600',
  },
});
