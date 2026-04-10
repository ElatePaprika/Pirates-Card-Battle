import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../src/stores/authStore';
import { useGameStore } from '../../src/stores/gameStore';
import { socketService } from '../../src/services/socket';
import { Colors } from '../../src/constants/colors';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function BattleScreen() {
  const { token, user } = useAuthStore();
  const { isSearching, setSearching, setGameState, setPlayerRole, setInGame, fetchUserCards } = useGameStore();
  const router = useRouter();
  
  const [connected, setConnected] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [waitingInRoom, setWaitingInRoom] = useState(false);

  useEffect(() => {
    if (token) {
      connectSocket();
      fetchUserCards(token);
    }
    return () => {
      socketService.off('searching');
      socketService.off('match_found');
      socketService.off('search_cancelled');
      socketService.off('game_start');
      socketService.off('error');
    };
  }, [token]);

  const connectSocket = async () => {
    try {
      await socketService.connect(token!);
      setConnected(true);
      setupSocketListeners();
    } catch (error) {
      console.error('Socket connection error:', error);
      Alert.alert('Error', 'No se pudo conectar al servidor de juego');
    }
  };

  const setupSocketListeners = useCallback(() => {
    socketService.on('searching', () => {
      setSearching(true);
    });

    socketService.on('match_found', (data: any) => {
      setSearching(false);
      setPlayerRole(data.you_are);
      Alert.alert(
        '¡Oponente encontrado!',
        `Te enfrentarás a ${data.opponent.nickname} (${data.opponent.trophies} trofeos)`,
        [
          {
            text: '¡A LUCHAR!',
            onPress: () => {
              setInGame(true);
              router.push({
                pathname: '/game',
                params: { gameId: data.game_id, role: data.you_are },
              });
            },
          },
        ]
      );
    });

    socketService.on('search_cancelled', () => {
      setSearching(false);
    });

    socketService.on('game_start', (data: any) => {
      setGameState(data.game_state);
      setInGame(true);
      setWaitingInRoom(false);
      router.push({
        pathname: '/game',
        params: { gameId: data.game_id },
      });
    });

    socketService.on('error', (data: any) => {
      Alert.alert('Error', data.message);
    });
  }, []);

  const handleFindMatch = () => {
    if (!connected) {
      Alert.alert('Error', 'No estás conectado al servidor');
      return;
    }
    socketService.findMatch();
  };

  const handleCancelSearch = () => {
    socketService.cancelSearch();
    setSearching(false);
  };

  const handleCreateRoom = async () => {
    try {
      const response = await fetch(`${API_URL}/api/room/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreatedRoomCode(data.room_code);
        setWaitingInRoom(true);
        socketService.joinGameRoom(data.room_code);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la sala');
    }
  };

  const handleJoinRoom = async () => {
    if (roomCode.length < 6) {
      Alert.alert('Error', 'Código de sala inválido');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/room/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ room_code: roomCode }),
      });

      if (response.ok) {
        socketService.joinGameRoom(roomCode);
        setShowRoomModal(false);
        setRoomCode('');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo unir a la sala');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ARENA DE BATALLA</Text>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, connected ? styles.connected : styles.disconnected]} />
          <Text style={styles.statusText}>
            {connected ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>

        {/* Random Match */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.mainButton, isSearching && styles.cancelButton]}
            onPress={isSearching ? handleCancelSearch : handleFindMatch}
            disabled={!connected}
          >
            {isSearching ? (
              <>
                <ActivityIndicator color="#FFF" size="large" />
                <Text style={styles.buttonText}>BUSCANDO...</Text>
                <Text style={styles.buttonSubtext}>Toca para cancelar</Text>
              </>
            ) : (
              <>
                <Ionicons name="flash" size={48} color="#FFF" />
                <Text style={styles.buttonText}>BATALLA ALEATORIA</Text>
                <Text style={styles.buttonSubtext}>Encuentra un oponente al azar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Private Room */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jugar con Amigos</Text>
          
          {waitingInRoom ? (
            <View style={styles.waitingRoom}>
              <Text style={styles.roomCodeLabel}>Código de sala:</Text>
              <Text style={styles.roomCodeText}>{createdRoomCode}</Text>
              <Text style={styles.waitingText}>Esperando oponente...</Text>
              <ActivityIndicator color={Colors.primary} />
              <TouchableOpacity
                style={styles.cancelRoomButton}
                onPress={() => setWaitingInRoom(false)}
              >
                <Text style={styles.cancelRoomText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.roomButtons}>
              <TouchableOpacity
                style={styles.roomButton}
                onPress={handleCreateRoom}
              >
                <Ionicons name="add-circle" size={24} color={Colors.secondary} />
                <Text style={styles.roomButtonText}>Crear Sala</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.roomButton}
                onPress={() => setShowRoomModal(true)}
              >
                <Ionicons name="enter" size={24} color={Colors.secondary} />
                <Text style={styles.roomButtonText}>Unirse</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Join Room Modal */}
      <Modal
        visible={showRoomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Unirse a Sala</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Código de sala"
              placeholderTextColor={Colors.textSecondary}
              value={roomCode}
              onChangeText={setRoomCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowRoomModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalJoinButton}
                onPress={handleJoinRoom}
              >
                <Text style={styles.modalJoinText}>Unirse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  connected: {
    backgroundColor: Colors.success,
  },
  disconnected: {
    backgroundColor: Colors.danger,
  },
  statusText: {
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  mainButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: Colors.danger,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonSubtext: {
    color: '#FFF',
    opacity: 0.8,
  },
  roomButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roomButton: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  roomButtonText: {
    color: Colors.text,
    fontWeight: '600',
  },
  waitingRoom: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  roomCodeLabel: {
    color: Colors.textSecondary,
  },
  roomCodeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.secondary,
    letterSpacing: 4,
  },
  waitingText: {
    color: Colors.text,
  },
  cancelRoomButton: {
    marginTop: 8,
  },
  cancelRoomText: {
    color: Colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    color: Colors.text,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.textSecondary,
  },
  modalJoinButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalJoinText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
