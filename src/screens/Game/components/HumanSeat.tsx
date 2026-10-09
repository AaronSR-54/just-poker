import React from 'react';
import ChipIcon from '../../../components/ChipIcon';
import PositionChip from '../../../components/PositionChip';
import DeltaLine from './DeltaLine';
import { useI18n } from '../../../i18n';

export interface HumanSeatProps {
  name: string;
  isMobile: boolean;
  role: 'dealer' | 'sb' | 'bb' | null;
  isWinner: boolean;
  folded: boolean;
  allIn: boolean;
  /** Total de fichas mostrado (ya restado el reparto en curso). */
  chips: number;
  /** Ganancia neta en la mano (para el delta del ganador). */
  net: number;
  bet: number;
  handOver: boolean;
}

/** Asiento del jugador humano, con fichas, ciegas y delta de la mano. */
const HumanSeat: React.FC<HumanSeatProps> = ({
  name,
  isMobile,
  role,
  isWinner,
  folded,
  allIn,
  chips,
  net,
  bet,
  handOver,
}) => {
  const { t } = useI18n();

  return (
    <div
      data-tour="human-seat"
      className={[
        'flex flex-col items-start gap-1 rounded-slot border px-4 py-3',
        'transition-[border-color,background-color,color,opacity] duration-300 ease-brand',
        isMobile ? 'justify-center' : 'min-w-[140px]',
        isWinner
          ? 'border-bone bg-bone text-ink'
          : folded
            ? 'border-bone/[0.18] bg-ink opacity-[0.32]'
            : 'border-bone/[0.18] bg-ink',
      ].join(' ')}
    >
      <div className="flex items-center gap-1.5">
        <span className={isMobile ? 'font-display font-bold text-fs-300 tracking-normal normal-case' : 'font-display font-bold leading-none text-fs-400'}>{name === 'Tú' ? t('common.you') : name}</span>
        {role && (
          <span className="shrink-0" data-tour={role === 'dealer' ? 'dealer' : undefined}>
            <PositionChip role={role} filled={isWinner} />
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        <span data-chips className="inline-flex">
          <ChipIcon className={`size-5 ${isWinner ? 'text-ink' : 'text-bone'}`} />
        </span>
        {allIn ? (
          <span className={`font-display font-bold text-fs-300 ${isWinner ? 'text-danger-bone' : 'text-danger'}`}>ALL-IN</span>
        ) : (
          <span className={`font-display font-bold tabular-nums text-fs-300 ${chips < 100 && !isWinner ? 'text-danger' : ''}`}>{chips}</span>
        )}
        <DeltaLine amount={allIn ? 0 : handOver ? (isWinner ? net : 0) : -bet} filled={isWinner} className="ml-1" />
      </div>
    </div>
  );
};

export default HumanSeat;
