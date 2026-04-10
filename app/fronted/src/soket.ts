import { io, Socket } from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(API_URL!, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.socket?.emit('authenticate', { token });
      });

      this.socket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data);
        resolve();
      });

      this.socket.on('auth_error', (error) => {
        console.error('Socket auth error:', error);
        reject(error);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // Forward all events to registered listeners
      const events = [
        'searching', 'match_found', 'search_cancelled', 'already_searching',
        'game_start', 'game_update', 'game_over', 'opponent_disconnected',
        'joined_room', 'error'
      ];

      events.forEach(event => {
        this.socket?.on(event, (data) => {
          const handlers = this.listeners.get(event) || [];
          handlers.forEach(handler => handler(data));
        });
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  off(event: string, handler?: Function) {
    if (handler) {
      const handlers = this.listeners.get(event) || [];
      this.listeners.set(event, handlers.filter(h => h !== handler));
    } else {
      this.listeners.delete(event);
    }
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  findMatch() {
    this.emit('find_match', {});
  }

  cancelSearch() {
    this.emit('cancel_search', {});
  }

  deployCard(gameId: string, cardId: string, position: { x: number; y: number }) {
    this.emit('deploy_card', { game_id: gameId, card_id: cardId, position });
  }

  gameTick(gameId: string) {
    this.emit('game_tick', { game_id: gameId });
  }

  joinGameRoom(roomCode: string) {
    this.emit('join_game_room', { room_code: roomCode });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
