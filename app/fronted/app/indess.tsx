import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useGameStore } from '../../src/stores/gameStore';
import { Colors } from '../../src/constants/colors';
import { CardItem } from '../../src/components/CardItem';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const { user, token } = useAuthStore();
  const { userCards, deck, fetchUserCards, fetchAllCards } = useGameStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    if (!token) return;
    await fetchAllCards(token);
    await fetchUserCards(token);
    await fetchLeaderboard();
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const deckCards = userCards.filter((c) => deck.includes(c.id));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Ahoy, {user?.nickname}!</Text>
            <Text style={styles.subtitle}>Rey de los Piratas</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="trophy" size={16} color={Colors.secondary} />
              <Text style={styles.statText}>{user?.trophies || 0}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="cash" size={16} color={Colors.secondary} />
              <Text style={styles.statText}>{user?.coins || 0}</Text>
            </View>
          </View>
        </View>

        {/* Quick Battle Button */}
        <TouchableOpacity
          style={styles.battleButton}
          onPress={() => router.push('/(tabs)/battle')}
        >
          <Ionicons name="flash" size={32} color="#FFF" />
          <View>
            <Text style={styles.battleButtonText}>BATALLA RÁPIDA</Text>
            <Text style={styles.battleButtonSubtext}>Encuentra un oponente</Text>
          </View>
        </TouchableOpacity>

        {/* Current Deck */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tu Deck Actual</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/cards')}>
              <Text style={styles.seeAllText}>Editar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.deckRow}>
              {deckCards.map((card) => (
                <CardItem key={card.id} card={card} size="small" showStats={false} />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Piratas</Text>
          <View style={styles.leaderboardContainer}>
            {leaderboard.map((player, index) => (
              <View key={index} style={styles.leaderboardItem}>
                <View style={styles.leaderboardRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Text style={styles.leaderboardName}>{player.nickname}</Text>
                <View style={styles.leaderboardTrophies}>
                  <Ionicons name="trophy" size={14} color={Colors.secondary} />
                  <Text style={styles.leaderboardTrophyText}>{player.trophies}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statText: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  battleButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  battleButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  battleButtonSubtext: {
    color: '#FFF',
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seeAllText: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  deckRow: {
    flexDirection: 'row',
    gap: 8,
  },
  leaderboardContainer: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  leaderboardRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  leaderboardName: {
    flex: 1,
    color: Colors.text,
    fontWeight: '500',
  },
  leaderboardTrophies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leaderboardTrophyText: {
    color: Colors.secondary,
    fontWeight: 'bold',
  },
});
