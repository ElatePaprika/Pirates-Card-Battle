import { create } from 'zustand';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface Card {
  id: string;
  name: string;
  character_name: string;
  rarity: string;
  damage: number;
  health: number;
  cost: number;
  ability: string;
  ability_description: string;
  attack_speed: number;
  move_speed: number;
  range: number;
  level?: number;
  count?: number;
}

interface Tower {
  health: number;
  max_health: number;
  position: { x: number; y: number };
}

interface Player {
  nickname: string;
  energy: number;
  deck: string[];
  towers: {
    left: Tower;
    right: Tower;
    main: Tower;
  };
}

interface Unit {
  id: string;
  card_id: string;
  owner: string;
  position: { x: number; y: number };
  health: number;
  max_health: number;
  damage: number;
}

interface GameState {
  id: string;
  player1: Player;
  player2: Player;
  units: Unit[];
  time_remaining: number;
  status: string;
}

interface GameStore {
  allCards: Card[];
  userCards: Card[];
  deck: string[];
  gameState: GameState | null;
  isSearching: boolean;
  isInGame: boolean;
  playerRole: 'player1' | 'player2' | null;
  fetchAllCards: (token: string) => Promise<void>;
  fetchUserCards: (token: string) => Promise<void>;
  updateDeck: (token: string, cardIds: string[]) => Promise<void>;
  setGameState: (state: GameState | null) => void;
  setSearching: (searching: boolean) => void;
  setInGame: (inGame: boolean) => void;
  setPlayerRole: (role: 'player1' | 'player2' | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  allCards: [],
  userCards: [],
  deck: [],
  gameState: null,
  isSearching: false,
  isInGame: false,
  playerRole: null,

  fetchAllCards: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const cards = await response.json();
        set({ allCards: cards });
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  },

  fetchUserCards: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/cards/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        set({ userCards: data.cards, deck: data.deck });
      }
    } catch (error) {
      console.error('Error fetching user cards:', error);
    }
  },

  updateDeck: async (token: string, cardIds: string[]) => {
    try {
      const response = await fetch(`${API_URL}/api/cards/deck`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ card_ids: cardIds }),
      });
      if (response.ok) {
        set({ deck: cardIds });
      }
    } catch (error) {
      console.error('Error updating deck:', error);
    }
  },

  setGameState: (state) => set({ gameState: state }),
  setSearching: (searching) => set({ isSearching: searching }),
  setInGame: (inGame) => set({ isInGame: inGame }),
  setPlayerRole: (role) => set({ playerRole: role }),
  
  resetGame: () => set({
    gameState: null,
    isSearching: false,
    isInGame: false,
    playerRole: null,
  }),
}));
