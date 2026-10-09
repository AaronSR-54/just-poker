import React from 'react';
import Button from '../../../components/Button';
import { RaisePanel } from './RaiseControls';
import { useI18n } from '../../../i18n';
import type { ButtonSize } from '../../../types';

export interface ActionButtonsProps {
  size: ButtonSize;
  /** En móvil los tres botones ocupan el ancho completo. */
  fill?: boolean;
  /** En tablet el botón de subir se apila sobre pasar/igualar. */
  stack?: boolean;
  handOver: boolean;
  gameOver: boolean;
  activePlayer: number;
  streetPending: boolean;
  canCheck: boolean;
  canRaise: boolean;
  callAmount: number;
  playerChips: number;
  minRaise: number;
  maxRaise: number;
  pot: number;
  isTutorial: boolean;
  expectedAction: 'call' | 'check' | 'raise' | null;
  showRaise: boolean;
  raiseAmount: number;
  raiseTouched: boolean;
  onToggleRaise: () => void;
  onRaiseChange: (v: number) => void;
  onRaise: () => void;
  onAction: (action: 'fold' | 'check' | 'call' | 'raise') => void;
  onNewHand: () => void;
  /** En online, solo el anfitrión puede repartir la siguiente mano. */
  newHandEnabled?: boolean;
}

/** Botones de acción del turno humano (móvil, tablet y desktop). */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  size,
  fill = false,
  stack = false,
  handOver,
  gameOver,
  activePlayer,
  streetPending,
  canCheck,
  canRaise,
  callAmount,
  playerChips,
  minRaise,
  maxRaise,
  pot,
  isTutorial,
  expectedAction,
  showRaise,
  raiseAmount,
  raiseTouched,
  onToggleRaise,
  onRaiseChange,
  onRaise,
  onAction,
  onNewHand,
  newHandEnabled = true,
}) => {
  const { t } = useI18n();

  if (handOver) {
    return (
      <div className={`flex flex-col items-center gap-2 ${fill ? 'w-full' : ''}`}>
        {!gameOver && newHandEnabled && (
          <Button variant="primary" size={size} block={fill} className={fill ? 'min-h-11 px-1.5! py-1! tracking-[0.04em]!' : ''} onClick={onNewHand}>
            {t('game.newHand')}
          </Button>
        )}
        {!gameOver && !newHandEnabled && (
          <span className="font-body text-fs-100 tracking-[0.04em] opacity-70">{t('game.waitingHost')}</span>
        )}
      </div>
    );
  }

  const raiseButtonInner = (
    <Button
      data-tour="btn-raise"
      variant="primary"
      size={size}
      block={fill}
      className={fill ? 'w-auto! flex-auto min-h-11 px-2! py-1! tracking-[0.02em]!' : ''}
      onClick={onToggleRaise}
      disabled={activePlayer !== 0 || streetPending || !canRaise || (isTutorial && expectedAction !== 'raise')}
    >
      {t('game.raise')}
    </Button>
  );

  // En móvil el botón va suelto (sin wrapper) para que flex-auto mida por su texto.
  const raiseButton = fill ? raiseButtonInner : (
    <div className="relative">
      {raiseButtonInner}
      {showRaise && activePlayer === 0 && (
        <RaisePanel
          raiseAmount={raiseAmount}
          onRaiseChange={onRaiseChange}
          onRaise={onRaise}
          minRaise={minRaise}
          maxRaise={Math.max(minRaise, maxRaise)}
          potSize={pot}
          playerChips={playerChips}
          callAmount={callAmount}
          confirmDisabled={isTutorial && !raiseTouched}
          hideAllIn={isTutorial}
        />
      )}
    </div>
  );

  const passButton = (
    <Button
      data-tour="btn-pass"
      variant="outline"
      size={size}
      block={fill}
      className={fill ? 'w-auto! flex-auto min-h-11 px-2! py-1! tracking-[0.02em]!' : ''}
      onClick={() => onAction(canCheck ? 'check' : 'fold')}
      disabled={activePlayer !== 0 || streetPending || (isTutorial && (expectedAction !== 'check' || !canCheck))}
    >
      {canCheck ? t('game.check') : t('game.fold')}
    </Button>
  );

  const callButton = (
    <Button
      data-tour="btn-call"
      variant="outline"
      size={size}
      block={fill}
      className={fill ? 'w-auto! flex-auto min-h-11 px-2! py-1! tracking-[0.02em]!' : ''}
      onClick={() => onAction('call')}
      disabled={activePlayer !== 0 || streetPending || callAmount === 0 || (isTutorial && expectedAction !== 'call')}
    >
      {callAmount > 0
        ? callAmount >= playerChips
          ? t('game.allInAmount', { amount: playerChips })
          : t('game.callAmount', { amount: callAmount })
        : t('game.call')}
    </Button>
  );

  // Móvil: los tres botones en fila, con la acción más frecuente
  // (Pasar/Retirarse) a la derecha, lo más cerca posible del pulgar.
  if (fill) {
    return (
      <div className="flex w-full gap-1.5">
        {raiseButton}
        {callButton}
        {passButton}
      </div>
    );
  }

  // Tablet: el botón de subir va arriba, con pasar e igualar debajo.
  if (stack) {
    return (
      <div className="flex w-full flex-col items-end gap-2">
        {raiseButton}
        <div className="flex gap-2">
          {passButton}
          {callButton}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {passButton}
      {callButton}
      {raiseButton}
    </div>
  );
};

export default ActionButtons;
