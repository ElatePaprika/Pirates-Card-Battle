import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';
import { useGameStore, Card } from '../src/stores/gameStore';
import { socketService } from '../src/services/socket';
import { Colors } from '../src/constants/colors';
import { CardItem } from '../src/components/CardItem';
import { EnergyBar } from '../src/components/EnergyBar';
import { Tower } from '../src/components/Tower';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARENA_WIDTH = SCREEN_WIDTH - 32;
const ARENA_HEIGHT = ARENA_WIDTH * 1.3;

interface Unit {
  id: string;
  card_id: string;
  owner: string;
  position: { x: number; y: number };
  health: number;
  max_health: number;
}

export default function GameScreen() {
  const params = useLocalSearchParams();
  const gameId = params.gameId as string;
  const role = (params.role as 'player1' | 'player2') || 'player1';
  
  const router = useRouter();
  const { user } = useAuthStore();
  const { allCards, userCards, deck, gameState, setGameState, resetGame } = useGameStore();
  
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [localEnergy, setLocalEnergy] = useState(5);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const tickInterval = useRef<NodeJS.Timeout | null>(null);
  const energyInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setupSocketListeners();
    startEnergyRegeneration();
    startGameTick();

    return () => {
      cleanupGame();
    };
  }, []);

  const setupSocketListeners = useCallback(() => {
    socketService.on('game_update', (state: any) => {
      setGameState(state);
      setTimeRemaining(state.time_remaining);
      const myEnergy = role === 'player1' ? state.player1.energy : state.player2.energy;
      setLocalEnergy(myEnergy);
    });

    socketService.on('game_over', (data: any) => {
      cleanupGame();
      Alert.alert(
        data.you_won ? '¡VICTORIA!' : 'DERROTA',
        data.you_won
          ? `¡Has derrotado a ${data.result.loser}! +${data.result.rewards.winner.trophies} trofeos`
          : `${data.result.winner} te ha derrotado. ${data.result.rewards.loser.trophies} trofeos`,
        [
          {
            text: 'Volver',
            onPress: () => {
              resetGame();
              router.back();
            },
          },
        ]
      );
    });

    socketService.on('opponent_disconnected', () => {
      cleanupGame();
      Alert.alert('Oponente desconectado', 'Tu oponente ha abandonado la batalla', [
        {
          text: 'Volver',
          onPress: () => {
            resetGame();
            router.back();
          },
        },
      ]);
    });
  }, [role]);

  const startGameTick = () => {
    tickInterval.current = setInterval(() => {
      if (gameId) {
        socketService.gameTick(gameId);
      }
    }, 100);
  };

  const startEnergyRegeneration = () => {
    energyInterval.current = setInterval(() => {
      setLocalEnergy((prev) => Math.min(10, prev + 0.1));
    }, 300);
  };

  const cleanupGame = () => {
    if (tickInterval.current) {
      clearInterval(tickInterval.current);
    }
    if (energyInterval.current) {
      clearInterval(energyInterval.current);
    }
    socketService.off('game_update');
    socketService.off('game_over');
    socketService.off('opponent_disconnected');
  };

  const handleArenaPress = (event: any) => {
    if (!selectedCard) return;

    const card = allCards.find((c) => c.id === selectedCard);
    if (!card) return;

    if (localEnergy < card.cost) {
      Alert.alert('Sin energía', 'No tienes suficiente energía');
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const gridX = Math.floor((locationX / ARENA_WIDTH) * 8);
    const gridY = Math.floor((locationY / ARENA_HEIGHT) * 12);

    // Validate position - player can only deploy on their side
    const validY = role === 'player1' ? gridY <= 5 : gridY >= 6;
    if (!validY) {
      Alert.alert('Posición inválida', 'Solo puedes desplegar en tu lado del campo');
      return;
    }

    socketService.deployCard(gameId, selectedCard, { x: gridX, y: gridY });
    setLocalEnergy((prev) => prev - card.cost);
    setSelectedCard(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUnitIcon = (cardId: string): keyof typeof Ionicons.glyphMap => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      luffy: 'flame',
      zoro: 'cut',
      nami: 'thunderstorm',
      sanji: 'flame',
      chopper: 'medkit',
      robin: 'hand-left',
      franky: 'hardware-chip',
      brook: 'musical-notes',
      jinbe: 'water',
      usopp: 'locate',
      ace: 'bonfire',
      law: 'medical',
      marine_soldier: 'shield',
      pirate_mob: 'people',
      kaido: 'planet',
      shanks: 'flash',
    };
    return icons[cardId] || 'person';
  };

  const deckCards = userCards.filter((c) => deck.includes(c.id));
  const player1 = gameState?.player1;
  const player2 = gameState?.player2;
  const units = gameState?.units || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
      </View>

      {/* Enemy Info */}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>
          {role === 'player1' ? player2?.nickname : player1?.nickname} (Enemigo)
        </Text>
      </View>

      {/* Arena */}
      <TouchableOpacity
        style={styles.arena}
        onPress={handleArenaPress}
        activeOpacity={1}
      >
        {/* Enemy Towers */}
        <View style={styles.towerRow}>
          {player2 && (
            <>
              <Tower
                health={role === 'player1' ? player2.towers.left.health : player1?.towers.left.health || 0}
                maxHealth={1500}
                isEnemy={role === 'player1'}
              />
              <Tower
                health={role === 'player1' ? player2.towers.main.health : player1?.towers.main.health || 0}
                maxHealth={3000}
                isMain
                isEnemy={role === 'player1'}
              />
              <Tower
                health={role === 'player1' ? player2.towers.right.health : player1?.towers.right.health || 0}
                maxHealth={1500}
                isEnemy={role === 'player1'}
              />
            </>
          )}
        </View>

        {/* Battlefield */}
        <View style={styles.battlefield}>
          {/* Units */}
          {units.map((unit: Unit) => (
            <View
              key={unit.id}
              style={[
                styles.unit,
                {
                  left: (unit.position.x / 8) * ARENA_WIDTH - 15,
                  top: (unit.position.y / 12) * (ARENA_HEIGHT - 160) + 80 - 15,
                },
                unit.owner === role ? styles.friendlyUnit : styles.enemyUnit,
              ]}
            >
              <Ionicons
                name={getUnitIcon(unit.card_id)}
                size={20}
                color={unit.owner === role ? Colors.primary : Colors.danger}
              />
              <View style={styles.unitHealthBar}>
                <View
                  style={[
                    styles.unitHealth,
                    { width: `${(unit.health / unit.max_health) * 100}%` },
                  ]}
                />
              </View>
            </View>
          ))}

          {/* Center Line */}
          <View style={styles.centerLine} />
        </View>

        {/* Player Towers */}
        <View style={styles.towerRow}>
          {player1 && (
            <>
              <Tower
                health={role === 'player1' ? player1.towers.left.health : player2?.towers.left.health || 0}
                maxHealth={1500}
              />
              <Tower
                health={role === 'player1' ? player1.towers.main.health : player2?.towers.main.health || 0}
                maxHealth={3000}
                isMain
              />
              <Tower
                health={role === 'player1' ? player1.towers.right.health : player2?.towers.right.health || 0}
                maxHealth={1500}
              />
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Player Info */}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{user?.nickname} (Tú)</Text>
      </View>

      {/* Energy Bar */}
      <View style={styles.energyContainer}>
        <EnergyBar energy={localEnergy} />
      </View>

      {/* Card Hand */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cardHand}
        contentContainerStyle={styles.cardHandContent}
      >
        {deckCards.map((card) => {
          const canAfford = localEnergy >= card.cost;
          return (
            <TouchableOpacity
              key={card.id}
              onPress={() => canAfford && setSelectedCard(card.id === selectedCard ? null : card.id)}
              style={[!canAfford && styles.cardDisabled]}
            >
              <CardItem
                card={card}
                selected={selectedCard === card.id}
                size="small"
                showStats={false}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  playerInfo: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  playerName: {
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  arena: {
    width: ARENA_WIDTH,
    height: ARENA_HEIGHT,
    backgroundColor: Colors.battlefield,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.backgroundLight,
  },
  towerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: Colors.backgroundLight,
  },
  battlefield: {
    flex: 1,
    position: 'relative',
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.secondary,
    opacity: 0.3,
  },
  unit: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendlyUnit: {
    backgroundColor: Colors.primary + '50',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  enemyUnit: {
    backgroundColor: Colors.danger + '50',
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  unitHealthBar: {
    position: 'absolute',
    bottom: -4,
    width: 24,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  unitHealth: {
    height: '100%',
    backgroundColor: Colors.healthBar,
    borderRadius: 2,
  },
  energyContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cardHand: {
    maxHeight: 100,
  },
  cardHandContent: {
    paddingHorizontal: 8,
    gap: 4,
  },
  cardDisabled: {
    opacity: 0.5,
  },
});
