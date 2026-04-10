import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { useGameStore, Card } from '../../src/stores/gameStore';
import { Colors } from '../../src/constants/colors';
import { CardItem } from '../../src/components/CardItem';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ShopCard extends Card {
  price: number;
}

export default function ShopScreen() {
  const { token, user, updateUser } = useAuthStore();
  const { fetchUserCards } = useGameStore();
  const [shopCards, setShopCards] = useState<ShopCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchShopCards();
  }, []);

  const fetchShopCards = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shop/cards`);
      if (response.ok) {
        const data = await response.json();
        setShopCards(data);
      }
    } catch (error) {
      console.error('Error fetching shop cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShopCards();
    setRefreshing(false);
  };

  const handleBuyCard = async (card: ShopCard) => {
    if (!user || user.coins < card.price) {
      Alert.alert('Error', 'No tienes suficientes monedas');
      return;
    }

    Alert.alert(
      'Comprar Carta',
      `¿Quieres comprar ${card.name} por ${card.price} monedas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprar',
          onPress: async () => {
            setPurchasing(card.id);
            try {
              const response = await fetch(`${API_URL}/api/shop/buy/${card.id}`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                updateUser({ coins: data.coins_left });
                await fetchUserCards(token!);
                Alert.alert('¡Compra exitosa!', `Has obtenido ${card.name}`);
              } else {
                const error = await response.json();
                Alert.alert('Error', error.detail);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo completar la compra');
            } finally {
              setPurchasing(null);
            }
          },
        },
      ]
    );
  };

  const getRarityLabel = (rarity: string) => {
    const labels: { [key: string]: string } = {
      common: 'Común',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Legendario',
    };
    return labels[rarity] || rarity;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TIENDA</Text>
        <View style={styles.coinsContainer}>
          <Ionicons name="cash" size={20} color={Colors.secondary} />
          <Text style={styles.coinsText}>{user?.coins || 0}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Cartas Destacadas</Text>
            <Text style={styles.refreshHint}>Desliza hacia abajo para nuevas ofertas</Text>
            
            <View style={styles.cardsContainer}>
              {shopCards.map((card) => (
                <View key={card.id} style={styles.shopCard}>
                  <CardItem card={card} size="large" />
                  <View style={styles.cardInfo}>
                    <Text style={[styles.rarityText, { color: getRarityColor(card.rarity) }]}>
                      {getRarityLabel(card.rarity)}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.buyButton,
                        (user?.coins || 0) < card.price && styles.buyButtonDisabled,
                      ]}
                      onPress={() => handleBuyCard(card)}
                      disabled={purchasing === card.id || (user?.coins || 0) < card.price}
                    >
                      {purchasing === card.id ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="cash" size={16} color="#FFF" />
                          <Text style={styles.buyButtonText}>{card.price}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return Colors.legendary;
    case 'epic':
      return Colors.epic;
    case 'rare':
      return Colors.rare;
    default:
      return Colors.common;
  }
};

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
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  coinsText: {
    color: Colors.secondary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  scrollContent: {
    padding: 16,
  },
  loader: {
    marginTop: 48,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  refreshHint: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  shopCard: {
    width: '48%',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardInfo: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  rarityText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
