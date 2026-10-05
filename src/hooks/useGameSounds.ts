import { useEffect, useRef } from 'react';
import type { PokerState } from '../game/poker';
import { playSfx, playSfxSequence } from '../audio/sfx';
import { useSettingsStore } from '../store/settingsStore';

interface Snapshot {
  handNumber: number;
  actions: number;
  community: number;
  currentPlayer: number;
}

/** Reproduce efectos según los cambios de estado de la partida. */
export function useGameSounds(state: PokerState | null): void {
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const initialized = useRef(false);
  const prev = useRef<Snapshot>({
    handNumber: 0,
    actions: 0,
    community: 0,
    currentPlayer: -1,
  });

  useEffect(() => {
    if (!state) return;
    const p = prev.current;

    const openingDeal = () => {
      playSfxSequence('card_deal', 3, 90);
      playSfx('chips_bet', { delay: 0.42 });
    };

    if (!initialized.current) {
      initialized.current = true;
      if (sfxVolume > 0 && !state.handOver && state.actions.length === 0 && state.handNumber > 0) {
        openingDeal();
      }
    } else if (state.handNumber !== p.handNumber) {
      if (!state.handOver && state.actions.length === 0) openingDeal();
    } else if (state.actions.length > p.actions) {
      const last = state.actions[state.actions.length - 1];
      if (last?.type === 'fold') playSfx('fold');
      else if (last?.type === 'check') playSfx('check');
      else if (last?.type === 'call') playSfx('chips_bet');
      else if (last?.type === 'raise') playSfx('chips_raise');
      else if (last?.type === 'blind') playSfx('chips_bet');
    }

    if (state.community.length > p.community) {
      playSfxSequence('card_flip', state.community.length - p.community, 110);
    }

    if (state.currentPlayer === 0 && p.currentPlayer !== 0 && !state.handOver && !state.streetPending) {
      playSfx('turn_tick');
    }

    p.handNumber = state.handNumber;
    p.actions = state.actions.length;
    p.community = state.community.length;
    p.currentPlayer = state.currentPlayer;
  }, [state, sfxVolume]);
}
