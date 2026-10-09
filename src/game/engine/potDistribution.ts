import { compareHands, type HandResult } from '../hands';

/**
 * Reparte el bote entre los ganadores aplicando side pots por niveles de
 * contribución. Función pura (sin estado) para poder testear el reparto.
 *
 * @param committed contribución total de cada jugador en la mano
 * @param contenders índices que llegan al reparto (no retirados)
 * @param byShowdown si es showdown (se comparan manos) o victoria por retirada
 * @param results manos evaluadas por jugador (obligatorio en showdown)
 * @param dealer índice del dealer, para repartir el resto (odd chip) por orden
 * @returns pagos por jugador y conjunto de ganadores
 */
export function distributePots(
  committed: number[],
  contenders: number[],
  byShowdown: boolean,
  results: Map<number, HandResult> | undefined,
  dealer: number
): { payouts: number[]; winners: number[] } {
  const n = committed.length;
  const payouts = committed.map(() => 0);
  const winSet = new Set<number>();

  if (!byShowdown) {
    // Victoria por retirada: se lo lleva todo el único superviviente
    const total = committed.reduce((a, b) => a + b, 0);
    if (contenders.length > 0) {
      payouts[contenders[0]] = total;
      winSet.add(contenders[0]);
    }
    return { payouts, winners: [...winSet] };
  }

  // Side pots por niveles de contribución
  const levels = [...new Set(committed.filter(c => c > 0))].sort((a, b) => a - b);
  let prev = 0;
  for (const level of levels) {
    let sidePot = 0;
    const contributions: Array<{ index: number; amount: number }> = [];
    for (let i = 0; i < n; i++) {
      const contrib = Math.min(committed[i], level) - Math.min(committed[i], prev);
      if (contrib > 0) {
        sidePot += contrib;
        contributions.push({ index: i, amount: contrib });
      }
    }
    const eligible = contributions
      .map(c => c.index)
      .filter(i => contenders.includes(i));
    if (sidePot > 0 && eligible.length > 0) {
      // Mejor mano entre los elegibles
      let best: HandResult | null = null;
      for (const i of eligible) {
        const r = results!.get(i)!;
        if (!best || compareHands(r, best) > 0) best = r;
      }
      const winnersHere = eligible.filter(i => compareHands(results!.get(i)!, best!) === 0);
      const share = Math.floor(sidePot / winnersHere.length);
      let remainder = sidePot - share * winnersHere.length;
      // El resto va al primer ganador tras el dealer
      const ordered = [...winnersHere].sort((a, b) => {
        const da = (a - dealer + n) % n;
        const db = (b - dealer + n) % n;
        return da - db;
      });
      for (const w of ordered) {
        payouts[w] += share + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        winSet.add(w);
      }
    } else if (sidePot > 0) {
      // Apuesta no igualada por ningún contendiente: se devuelve a quien la puso
      for (const c of contributions) {
        payouts[c.index] += c.amount;
      }
    }
    prev = level;
  }

  return { payouts, winners: [...winSet] };
}
