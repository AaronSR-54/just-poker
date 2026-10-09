import type { Choice } from './personalityTypes';

export function decidePreflop(
  pEff: number,
  facingRaise: boolean,
  pos: number,
  canCheck: boolean,
  canRaise: boolean,
  effAggro: number,
  effTight: number,
  effBluff: number,
  discipline: number,
): Choice {
  const aggressive = discipline >= 0.5 ? effAggro : effAggro * 0.6;

  if (facingRaise) {
    const premium = 0.88 - aggressive * 0.06 + (1 - pos) * 0.03;
    const callRange = Math.max(0.32, Math.min(0.95, 0.6 + effTight * 0.22 - pos * 0.1));
    if (canRaise && pEff >= premium && Math.random() < 0.55 + aggressive * 0.35) {
      return { kind: 'raise', isBluff: false, reason: 'preflop:3bet-valor' };
    }
    if (pEff >= callRange) {
      if (canRaise && pEff >= 0.8 && Math.random() < aggressive * 0.35) {
        return { kind: 'raise', isBluff: false, reason: 'preflop:3bet-valor' };
      }
      return { kind: 'call', isBluff: false, reason: 'preflop:call-subida' };
    }
    if (canRaise && pos > 0.55 && Math.random() < effBluff * 0.25 * discipline) {
      return { kind: 'raise', isBluff: true, reason: 'preflop:3bet-farol' };
    }
    return { kind: 'fold', isBluff: false, reason: 'preflop:fold-ante-subida' };
  }

  const openThresh = Math.max(0.08, Math.min(0.97, 0.55 + effTight * 0.32 - pos * 0.26));
  if (pEff >= openThresh) {
    if (canRaise && Math.random() < 0.32 + aggressive * 0.5) {
      return { kind: 'raise', isBluff: false, reason: 'preflop:abrir-subiendo' };
    }
    return { kind: canCheck ? 'check' : 'call', isBluff: false, reason: canCheck ? 'preflop:check-bb' : 'preflop:limpar' };
  }
  if (pEff >= openThresh - 0.14) {
    if (canCheck) return { kind: 'check', isBluff: false, reason: 'preflop:check-bb' };
    // Limpar (call barato) solo tiene sentido en posiciones tardías.
    if (pos > 0.45 && Math.random() < 0.3 + effBluff * 0.3) {
      return { kind: 'call', isBluff: false, reason: 'preflop:limpar-marginal' };
    }
    return { kind: 'fold', isBluff: false, reason: 'preflop:fold-marginal' };
  }
  if (canRaise && pos > 0.5 && Math.random() < effBluff * 0.4 * discipline) {
    return { kind: 'raise', isBluff: true, reason: 'preflop:robo-farol' };
  }
  return { kind: canCheck ? 'check' : 'fold', isBluff: false, reason: canCheck ? 'preflop:check-bb' : 'preflop:fold-basura' };
}
