import type { TableDifficulty } from '../types';
import type { PokerSaveData } from './poker';

const STORAGE_KEY = 'just-poker-active-game';
const VERSION = 1;

export interface SavedGame {
  version: number;
  gameId: string;
  difficulty: TableDifficulty;
  savedAt: number;
  state: PokerSaveData;
}

export function saveGame(saved: Omit<SavedGame, 'version' | 'savedAt'>): void {
  try {
    const payload: SavedGame = { version: VERSION, savedAt: Date.now(), ...saved };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // almacenamiento no disponible (modo privado, cuota, etc.)
  }
}

export function loadSavedGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedGame;
    if (data.version !== VERSION || !data.state || !data.gameId) return null;
    const s = data.state;
    const validShape =
      Array.isArray(s.players) &&
      Array.isArray(s.community) &&
      Array.isArray(s.deck) &&
      Array.isArray(s.acted) &&
      Array.isArray(s.committed) &&
      Array.isArray(s.actions) &&
      Array.isArray(s.winAmounts) &&
      typeof s.currentPlayer === 'number';
    if (!validShape) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
