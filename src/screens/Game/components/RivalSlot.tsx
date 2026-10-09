import React from 'react';
import { motion } from 'framer-motion';
import Avatar from '../../../components/Avatar';
import ChipIcon from '../../../components/ChipIcon';
import PositionChip from '../../../components/PositionChip';
import TimerBar from './TimerBar';
import DeltaLine from './DeltaLine';
import { rivalAvatar, rivalAliasKey } from '../../../game/rivals';
import { t as motionT } from '../../../animations/motion';
import { useI18n } from '../../../i18n';

interface RivalSlotProps {
  name: string;
  folded?: boolean;
  eliminated?: boolean;
  isActive?: boolean;
  isWinner?: boolean;
  chips?: number;
  /** Fichas ganadas (+) o gastadas (−) en la mano. */
  delta?: number;
  isAllIn?: boolean;
  handOver?: boolean;
  blindRole?: 'dealer' | 'sb' | 'bb' | null;
  compact?: boolean;
  /** Tinte del avatar según la dificultad (mismo que en la pantalla local). */
  avatarTone?: string;
  avatarImgClassName?: string;
  /** Anillo del avatar según la dificultad. */
  avatarRing?: string;
  /** Duración (ms) del turno activo; si se define, se muestra la barra. */
  timerDuration?: number;
  /** Cambia por turno para reiniciar la animación de la barra. */
  timerKey?: string;
  /** Retardo de entrada para escalonar los slots de la mesa. */
  enterDelay?: number;
  /** Valor de `data-tour` para que el coach del tutorial pueda señalar el asiento. */
  dataTour?: string;
}

/**
 * Tarjeta de jugador con altura fija: todos los elementos ocupan su lugar
 * siempre, y los estados se expresan con color/opacidad, nunca apareciendo
 * o desapareciendo elementos que muevan el layout.
 */
const RivalSlot: React.FC<RivalSlotProps> = ({
  name,
  folded = false,
  eliminated = false,
  isActive = false,
  isWinner = false,
  chips = 0,
  delta = 0,
  isAllIn = false,
  handOver = false,
  blindRole = null,
  compact = false,
  avatarTone,
  avatarImgClassName,
  avatarRing,
  timerDuration,
  timerKey,
  enterDelay = 0,
  dataTour,
}) => {
  const { t } = useI18n();
  const aliasKey = rivalAliasKey(name);
  const filled = isWinner;
  const dimmed = eliminated || folded;
  // En all-in se muestra la etiqueta en lugar del total, que quedaría a 0.
  const showAllIn = isAllIn && !handOver;

  return (
    <motion.div
      data-tour={dataTour}
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: dimmed ? 0.32 : 1, y: 0, scale: isWinner ? 1.03 : 1 }}
      transition={motionT(0.35, enterDelay)}
      className={[
        'relative flex flex-col items-center rounded-slot border text-center',
        compact ? 'w-[min(104px,28vw)] gap-1 rounded-[10px] px-3 py-3' : 'w-[150px] gap-2 px-6 py-5',
        filled
          ? 'border-bone bg-bone text-ink'
          : isActive && !handOver
            ? 'border-bone bg-ink animate-turn-pulse'
            : 'border-bone/[0.18] bg-ink',
      ].join(' ')}
    >
      {isActive && !handOver && timerDuration !== undefined && (
        <TimerBar key={timerKey} duration={timerDuration} className="absolute -bottom-2 inset-x-4" />
      )}

      <span className={`inline-flex shrink-0 rounded-full ring-1 ${avatarRing ?? 'ring-bone/20'}`}>
        <Avatar name={name} src={rivalAvatar(name)} size={compact ? 48 : 64} tone={avatarTone} imgClassName={avatarImgClassName} />
      </span>

      <div className="flex w-full flex-col items-center">
        <div className="flex w-full min-w-0 items-baseline justify-center gap-1.5">
          <div className="min-w-0 truncate font-display font-bold leading-4.5 text-fs-200">{name}</div>
          {blindRole && (
            <span
              className="shrink-0"
              data-tour={blindRole === 'sb' ? 'small-blind' : blindRole === 'bb' ? 'big-blind' : undefined}
            >
              <PositionChip role={blindRole} filled={filled} />
            </span>
          )}
        </div>
        <div className="max-w-full truncate font-body text-fs-100 italic opacity-70 leading-3 sm:leading-2 md:leading-4">{aliasKey ? `“${t(aliasKey)}”` : ''}</div>
      </div>

      <div className="relative flex w-full items-center justify-center gap-0.5 py-2">
        <span data-chips className="inline-flex">
          <ChipIcon className={`size-5 ${filled ? 'text-ink' : 'text-bone'}`} />
        </span>
        <div className="relative flex flex-col items-center">
          {showAllIn ? (
            <span className={`flex h-5 items-center font-display font-bold text-fs-200 ${filled ? 'text-danger-bone' : 'text-danger'}`}>ALL-IN</span>
          ) : (
            <span className={`flex items-center whitespace-nowrap font-display font-bold leading-none tabular-nums text-fs-200 ${chips < 100 && !filled ? 'text-danger' : ''}`}>{chips}</span>
          )}
          <div className="absolute left-3 md:left-4 top-full -translate-x-1/2">
            <DeltaLine amount={showAllIn ? 0 : delta} filled={filled} className="whitespace-nowrap" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RivalSlot;
