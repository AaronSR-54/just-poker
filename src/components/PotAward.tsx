import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import ChipIcon from './ChipIcon';
import { t } from '../animations/motion';

export interface PotAwardWinner {
  id: number;
  /** Fichas que se lleva el ganador (puede diferir entre ganadores por side pots). */
  amount: number;
}

export interface PotAwardData {
  handNumber: number;
  /** Bote total repartido. */
  pot: number;
  /** Ciega grande: se usa para decidir cuántas fichas vuelan. */
  unit: number;
  winners: PotAwardWinner[];
}

interface PotAwardProps {
  data: PotAwardData;
  /** Se dispara cuando una ficha aterriza en el montón del ganador. */
  onLanded: (winnerId: number, value: number) => void;
  onDone: () => void;
}

interface ChipSpec {
  key: string;
  winnerId: number;
  value: number;
  fromX: number;
  fromY: number;
  /** Card del ganador: al entrar en ella la ficha se invierte a negro. */
  seatEl: Element | null;
  /** Elemento exacto del montón del ganador (se remide en cada frame). */
  targetEl: Element | null;
  lift: number;
  delay: number;
  duration: number;
  size: string;
  lightColor: string;
}

const CHIP_STYLES = [
  { size: 'size-4', light: 'text-bone' },
  { size: 'size-5', light: 'text-bone/85' },
  { size: 'size-[18px]', light: 'text-bone' },
];

/**
 * Tiempo (s) que el bote permanece quieto antes de empezar a repartirse.
 * Lo comparte el desvanecido del bote para que ambos vayan sincronizados.
 */
export const POT_AWARD_HOLD = 0.45;
/** Duración base del vuelo de cada ficha. */
const FLIGHT = 0.42;
/** Separación entre fichas consecutivas. */
const STAGGER = 0.13;
const MAX_CHIPS = 14;

const seatSelector = (id: number): string =>
  id === 0 ? '[data-tour="human-seat"]' : `[data-tour="rival-${id}"]`;

const centerOf = (el: Element): { x: number; y: number } => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Reparte `amount` en `count` enteros que suman exactamente `amount`. */
const splitAmount = (amount: number, count: number): number[] => {
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
};

const easeOutCubic = (p: number): number => 1 - Math.pow(1 - p, 3);
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

const scaleFor = (p: number): number => {
  if (p < 0.15) return lerp(0.5, 1.08, p / 0.15);
  if (p < 0.8) return lerp(1.08, 1, (p - 0.15) / 0.65);
  return lerp(1, 0.85, (p - 0.8) / 0.2);
};

const opacityFor = (p: number): number => {
  if (p < 0.12) return p / 0.12;
  if (p > 0.9) return Math.max(0, 1 - (p - 0.9) / 0.1);
  return 1;
};

/** Margen con el que la ficha se considera "dentro" de la card del ganador. */
const CARD_MARGIN = 12;

/**
 * Fracción del vuelo en la que la ficha se da por "aterrizada" (avisa a
 * `onLanded`: contador + sonido). Menor que 1 para que el golpe coincida con
 * el momento en que la ficha entra en el montón y empieza a desvanecerse.
 */
const LAND_AT = 0.85;

interface FlyingChipProps {
  winnerId: number;
  value: number;
  startX: number;
  startY: number;
  seatEl: Element | null;
  targetEl: Element | null;
  lift: number;
  delay: number;
  duration: number;
  size: string;
  lightColor: string;
  onLanded: (winnerId: number, value: number) => void;
}

/**
 * Ficha individual. Vuelve a medir el montón del ganador en cada frame, de modo
 * que aterriza exactamente aunque el contador crezca y desplace su ficha. Al
 * entrar en la card del ganador (fondo claro) se invierte a negro.
 */
const FlyingChip: React.FC<FlyingChipProps> = ({
  winnerId,
  value,
  startX,
  startY,
  seatEl,
  targetEl,
  lift,
  delay,
  duration,
  size,
  lightColor,
  onLanded,
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(0.5);
  const opacity = useMotionValue(0);
  const landedRef = useRef(false);
  const invertedRef = useRef(false);
  const [inverted, setInverted] = useState(false);
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;

  useEffect(() => {
    let raf = 0;
    let startedAt: number | null = null;

    const step = (now: number) => {
      if (startedAt === null) startedAt = now;
      const elapsed = (now - startedAt) / 1000 - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(step);
        return;
      }

      const p = Math.min(1, elapsed / duration);
      const e = easeOutCubic(p);

      // Destino actual del montón (puede haberse movido durante el vuelo).
      const rect = targetEl?.getBoundingClientRect();
      const tx = rect ? rect.left + rect.width / 2 : startX;
      const ty = rect ? rect.top + rect.height / 2 : startY;

      // Arco cuadrático cuyo punto final es siempre el destino medido.
      const cx = (startX + tx) / 2;
      const cy = (startY + ty) / 2 - lift;
      const mt = 1 - e;
      const bx = mt * mt * startX + 2 * mt * e * cx + e * e * tx;
      const by = mt * mt * startY + 2 * mt * e * cy + e * e * ty;

      x.set(bx - startX);
      y.set(by - startY);
      scale.set(scaleFor(p));
      opacity.set(opacityFor(p));

      // Al entrar en la card del ganador, la ficha se invierte a negro.
      if (!invertedRef.current && seatEl) {
        const sr = seatEl.getBoundingClientRect();
        if (
          bx >= sr.left - CARD_MARGIN &&
          bx <= sr.right + CARD_MARGIN &&
          by >= sr.top - CARD_MARGIN &&
          by <= sr.bottom + CARD_MARGIN
        ) {
          invertedRef.current = true;
          setInverted(true);
        }
      }

      if (!landedRef.current && p >= LAND_AT) {
        landedRef.current = true;
        onLandedRef.current(winnerId, value);
      }

      if (p >= 1) return;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [startX, startY, seatEl, targetEl, lift, delay, duration, winnerId, value, x, y, scale, opacity]);

  return (
    <div className="fixed -translate-x-1/2 -translate-y-1/2" style={{ left: startX, top: startY }}>
      <motion.div style={{ x, y, scale, opacity }}>
        <ChipIcon
          className={`${size} ${inverted ? 'text-ink' : lightColor} drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)] transition-colors duration-150 ease-brand`}
        />
      </motion.div>
    </div>
  );
};

/**
 * Anima el bote volando desde su ficha central hasta el montón de fichas de
 * cada ganador, en tres fases legibles: el bote se ve quieto, las fichas salen
 * en hilera y se funden en el montón. Cada ficha lleva un valor y avisa al
 * aterrizar para que el contador del ganador crezca en tiempo real.
 */
const PotAward: React.FC<PotAwardProps> = ({ data, onLanded, onDone }) => {
  const [chips, setChips] = useState<ChipSpec[]>([]);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  }, []);

  useLayoutEffect(() => {
    const potEl = document.querySelector('[data-tour="pot"]');
    const winners = data.winners.filter((w) => w.amount > 0);
    if (!potEl || winners.length === 0) {
      finish();
      return;
    }

    // Las fichas nacen en la ficha del bote, no en el centro del texto.
    const origin = centerOf(potEl.querySelector('[data-chips]') ?? potEl);
    const total = winners.reduce((sum, w) => sum + w.amount, 0);

    // Cada ganador recibe pocas fichas; el total crece con el tamaño del bote.
    const perWinnerMin = winners.length >= 4 ? 1 : 2;
    const desired = Math.min(
      MAX_CHIPS,
      Math.max(perWinnerMin * winners.length, Math.round(total / Math.max(1, data.unit)))
    );
    const extra = Math.max(0, desired - perWinnerMin * winners.length);
    const counts = winners.map((w) => perWinnerMin + Math.round(extra * (w.amount / total)));

    // Valor de cada ficha para que la suma de todas cuadre con lo ganado.
    const valueQueues = winners.map((w, i) => splitAmount(w.amount, counts[i]));
    const valueCursor = winners.map(() => 0);
    // Card y montón exactos de cada ganador (el montón se remide en cada frame).
    const seats = winners.map((w) => {
      const seatEl = document.querySelector(seatSelector(w.id));
      const chipEl = seatEl?.querySelector('[data-chips]') ?? seatEl;
      return { seatEl, chipEl };
    });

    // Salida intercalada: las fichas de todos los ganadores se reparten en
    // "rondas" para que el bote parezca abrirse en abanico hacia cada montón.
    const order: number[] = [];
    const maxCount = Math.max(...counts);
    for (let round = 0; round < maxCount; round++) {
      for (let i = 0; i < winners.length; i++) {
        if (round < counts[i]) order.push(i);
      }
    }

    let maxEnd = 0;
    const nextChips: ChipSpec[] = order.map((winnerIdx, i) => {
      const winner = winners[winnerIdx];
      const { seatEl, chipEl } = seats[winnerIdx];

      // Pequeña dispersión en espiral para que no arranquen todas apiladas.
      const angle = i * 2.399963;
      const radius = i === 0 ? 0 : 3 + (i % 4) * 2;
      const fromX = origin.x + Math.cos(angle) * radius;
      const fromY = origin.y + Math.sin(angle) * radius * 0.6;

      const distance = chipEl ? Math.hypot(centerOf(chipEl).x - fromX, centerOf(chipEl).y - fromY) : 0;
      const delay = t(FLIGHT, POT_AWARD_HOLD + i * STAGGER).delay as number;
      const duration = t(FLIGHT).duration as number;
      maxEnd = Math.max(maxEnd, delay + duration);

      const value = valueQueues[winnerIdx][valueCursor[winnerIdx]++];
      const style = CHIP_STYLES[i % CHIP_STYLES.length];

      return {
        key: `${winner.id}-${i}`,
        winnerId: winner.id,
        value,
        fromX,
        fromY,
        seatEl,
        targetEl: chipEl,
        lift: Math.min(90, Math.max(18, distance * 0.28)),
        delay,
        duration,
        size: style.size,
        lightColor: style.light,
      };
    });

    setChips(nextChips);

    const finishTimer = window.setTimeout(finish, maxEnd * 1000 + 140);
    return () => window.clearTimeout(finishTimer);
  }, [data, finish]);

  if (chips.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-100" aria-hidden="true">
      {chips.map((chip) => (
        <FlyingChip
          key={chip.key}
          winnerId={chip.winnerId}
          value={chip.value}
          startX={chip.fromX}
          startY={chip.fromY}
          seatEl={chip.seatEl}
          targetEl={chip.targetEl}
          lift={chip.lift}
          delay={chip.delay}
          duration={chip.duration}
          size={chip.size}
          lightColor={chip.lightColor}
          onLanded={onLanded}
        />
      ))}
    </div>
  );
};

export default PotAward;
