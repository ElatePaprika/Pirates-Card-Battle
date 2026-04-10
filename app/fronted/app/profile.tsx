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
import { Colors } from '../../src/constants/colors';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface BattleRecord {
  id: string;
  player1_nickname: string;
  player2_nickname: string;
  winner_id: string;
  player1_id: string;
  timestamp: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [battleHistory, setBattleHistory] = useState<BattleRecord[]>([]);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchBattleHistory();
  }, []);

  const fetchBattleHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/battles/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBattleHistory(data);
      }
    } catch (error) {
      console.error('Error fetching battle history:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getXpProgress = () => {
    const xpPerLevel = 500;
    const currentLevelXp = (user?.xp || 0) % xpPerLevel;
    return (currentLevelXp / xpPerLevel) * 100;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="skull" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.nickname}>{user?.nickname}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          {/* Level Progress */}
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Nivel {user?.level || 1}</Text>
            <View style={styles.xpBarContainer}>
              <View style={[styles.xpBar, { width: `${getXpProgress()}%` }]} />
            </View>
            <Text style={styles.xpText}>{user?.xp || 0} XP</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={32} color={Colors.secondary} />
            <Text style={styles.statValue}>{user?.trophies || 0}</Text>
            <Text style={styles.statLabel}>Trofeos</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash" size={32} color={Colors.secondary} />
            <Text style={styles.statValue}>{user?.coins || 0}</Text>
            <Text style={styles.statLabel}>Monedas</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="diamond" size={32} color={Colors.energy} />
            <Text style={styles.statValue}>{user?.gems || 0}</Text>
            <Text style={styles.statLabel}>Gemas</Text>
          </View>
        </View>

        {/* Battle History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Batallas</Text>
          {battleHistory.length > 0 ? (
            battleHistory.map((battle, index) => (
              <View key={battle.id || index} style={styles.battleItem}>
                <View style={styles.battleInfo}>
                  <Text style={styles.battleOpponent}>
                    {battle.player1_nickname} vs {battle.player2_nickname}
                  </Text>
                  <Text style={styles.battleDate}>
                    {new Date(battle.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.battleResult,
                    battle.winner_id === user?.id
                      ? styles.battleWin
                      : styles.battleLoss,
                  ]}
                >
                  <Text style={styles.battleResultText}>
                    {battle.winner_id === user?.id ? 'Victoria' : 'Derrota'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noHistoryText}>
              Aún no has participado en batallas
            </Text>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  email: {
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  levelContainer: {
    width: '100%',
    alignItems: 'center',
  },
  levelText: {
    color: Colors.secondary,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  xpBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: Colors.secondary,
  },
  xpText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
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
  battleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  battleInfo: {
    flex: 1,
  },
  battleOpponent: {
    color: Colors.text,
    fontWeight: '500',
  },
  battleDate: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  battleResult: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  battleWin: {
    backgroundColor: Colors.success + '30',
  },
  battleLoss: {
    backgroundColor: Colors.danger + '30',
  },
  battleResultText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: Colors.text,
  },
  noHistoryText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 12,
  },
  logoutText: {
    color: Colors.danger,
    fontWeight: '600',
  },
});