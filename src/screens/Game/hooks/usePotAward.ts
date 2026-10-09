import { useCallback, useEffect, useRef, useState } from 'react';
import { playSfx } from '../../../audio/sfx';
import type { PotAwardData } from '../../../components/PotAward';
import type { PokerState } from '../../../game/poker';

/**
 * Animación de reparto del bote: lanza las fichas hacia cada ganador una vez por
 * mano y va restando el bote conforme aterrizan.
 */
export function usePotAward(gameState: PokerState | null) {
  const [potAward, setPotAward] = useState<PotAwardData | null>(null);
  const [awardProgress, setAwardProgress] = useState<Record<number, number>>({});
  /** Bote que queda por repartir: se resta conforme aterrizan las fichas. */
  const [potRemaining, setPotRemaining] = useState<number | null>(null);
  const awardedHandRef = useRef<number | null>(null);

  // Al terminar la mano, lanza las fichas del bote hacia cada ganador. Solo una
  // vez por mano (los ganadores pueden ser varios por side pots o botes divididos).
  useEffect(() => {
    if (!gameState) return;
    const { handOver, winner, handNumber, pot, bigBlind, winAmounts } = gameState;
    if (!handOver || !winner || winner.length === 0 || pot <= 0) return;
    if (awardedHandRef.current === handNumber) return;
    awardedHandRef.current = handNumber;
    setAwardProgress({});
    setPotRemaining(pot);
    setPotAward({
      handNumber,
      pot,
      unit: bigBlind,
      winners: winner.map(id => ({ id, amount: winAmounts[id] ?? 0 })),
    });
  }, [gameState]);

  const handlePotAwardLanded = useCallback((winnerId: number, value: number) => {
    setAwardProgress(prev => ({ ...prev, [winnerId]: (prev[winnerId] ?? 0) + value }));
    setPotRemaining(prev => (prev === null ? null : Math.max(0, prev - value)));
    playSfx('chips_stack');
  }, []);

  const finishPotAward = useCallback(() => {
    setAwardProgress(prev => {
      const next = { ...prev };
      for (const w of potAward?.winners ?? []) next[w.id] = w.amount;
      return next;
    });
    setPotRemaining(0);
    setPotAward(null);
  }, [potAward]);

  const resetPotAward = useCallback(() => {
    setPotAward(null);
    setAwardProgress({});
  }, []);

  return {
    potAward,
    awardProgress,
    potRemaining,
    setPotRemaining,
    handlePotAwardLanded,
    finishPotAward,
    resetPotAward,
  };
}
