import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RANKS } from '../types';

export interface StoreUser {
  id: string;
  username: string;
  avatar: string;
  points: number;
}

export interface GameRecord {
  id: string;
  place: 1 | 2 | 3 | 4;
  pts: number;
  playedAt: number;
  rivals: string[];
  mode: 'local' | 'online';
}

export interface UserStats {
  handsPlayed: number;
  handsWon: number;
  localGames: number;
  localWins: number;
  onlineGames: number;
  onlineWins: number;
}

interface UserState {
  user: StoreUser;
  token: string | null;
  onboardingCompleted: boolean;
  history: GameRecord[];
  stats: UserStats;
  milestoneDates: Record<string, number>;
  setUser: (user: StoreUser) => void;
  setToken: (token: string | null) => void;
  completeOnboarding: () => void;
  updateProfile: (username: string, avatar: string) => void;
  addPoints: (pts: number) => void;
  recordHand: (won: boolean) => void;
  recordGame: (rec: Omit<GameRecord, 'id' | 'playedAt'>) => void;
  logout: () => void;
}

const DEFAULT_USER: StoreUser = {
  id: 'local-user',
  username: 'Tú',
  avatar: 'TU',
  points: 0,
};

const DEFAULT_STATS: UserStats = {
  handsPlayed: 0,
  handsWon: 0,
  localGames: 0,
  localWins: 0,
  onlineGames: 0,
  onlineWins: 0,
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Aplica nuevos puntos y registra la fecha en que se alcanza cada rango. */
function applyPoints(s: UserState, pts: number): Pick<UserState, 'user' | 'milestoneDates'> {
  const newPoints = Math.max(0, s.user.points + pts);
  const milestoneDates = { ...s.milestoneDates };
  for (const r of RANKS) {
    if (newPoints >= r.min && !milestoneDates[r.roman]) {
      milestoneDates[r.roman] = Date.now();
    }
  }
  return { user: { ...s.user, points: newPoints }, milestoneDates };
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: DEFAULT_USER,
      token: null,
      onboardingCompleted: false,
      history: [],
      stats: DEFAULT_STATS,
      milestoneDates: {},
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      updateProfile: (username, avatar) =>
        set((s) => ({ user: { ...s.user, username, avatar } })),
      addPoints: (pts) => set((s) => applyPoints(s, pts)),
      recordHand: (won) =>
        set((s) => ({
          stats: {
            ...s.stats,
            handsPlayed: s.stats.handsPlayed + 1,
            handsWon: s.stats.handsWon + (won ? 1 : 0),
          },
        })),
      recordGame: (rec) =>
        set((s) => ({
          ...applyPoints(s, rec.pts),
          history: [
            { ...rec, id: makeId(), playedAt: Date.now() },
            ...s.history,
          ].slice(0, 30),
          stats: {
            ...s.stats,
            localGames: s.stats.localGames + (rec.mode === 'local' ? 1 : 0),
            localWins: s.stats.localWins + (rec.mode === 'local' && rec.place === 1 ? 1 : 0),
            onlineGames: s.stats.onlineGames + (rec.mode === 'online' ? 1 : 0),
            onlineWins: s.stats.onlineWins + (rec.mode === 'online' && rec.place === 1 ? 1 : 0),
          },
        })),
      logout: () =>
        set({
          user: DEFAULT_USER,
          token: null,
          history: [],
          stats: DEFAULT_STATS,
          milestoneDates: {},
        }),
    }),
    { name: 'just-poker-storage' }
  )
);

/** Puntos ganados según posición final en una partida. */
export const POINTS_BY_PLACE: Record<number, number> = { 1: 40, 2: 20, 3: 5, 4: 0 };
