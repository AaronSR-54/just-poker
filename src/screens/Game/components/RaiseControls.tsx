import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../../components/Button';
import { t as motionT } from '../../../animations/motion';
import { useI18n } from '../../../i18n';

interface RaisePanelProps {
  raiseAmount: number;
  onRaiseChange: (v: number) => void;
  onRaise: () => void;
  minRaise: number;
  maxRaise: number;
  potSize: number;
  playerChips: number;
  callAmount: number;
  /** Bloquea el botón de confirmar (usado en la guía hasta elegir importe). */
  confirmDisabled?: boolean;
  /** En el tutorial se oculta el atajo de all-in. */
  hideAllIn?: boolean;
  /** En móvil los atajos ocupan todo el ancho y son más altos. */
  fill?: boolean;
}

const RaiseControls: React.FC<RaisePanelProps> = ({
  raiseAmount, onRaiseChange, onRaise, minRaise, maxRaise, potSize, playerChips, callAmount, confirmDisabled, hideAllIn = false, fill = false,
}) => {
  const { t } = useI18n();
  const halfPot = Math.floor(potSize / 2);
  const allInAmount = Math.max(minRaise, playerChips - callAmount);
  const quickAmounts = [
    { label: t('game.quickMin'), value: minRaise },
    { label: t('game.quickHalf'), value: Math.max(minRaise, halfPot) },
    { label: t('game.quickPot'), value: Math.max(minRaise, potSize) },
    ...(hideAllIn ? [] : [{ label: t('game.quickAllIn'), value: allInAmount }]),
  ];

  return (
    <div data-tour="raise-panel" className="flex w-full flex-col gap-2.5">
      <div data-tour="raise-amount" className="flex w-full flex-col gap-2.5">
        <div
          data-tour="raise-quick"
          className={fill ? 'grid w-full grid-cols-4 gap-2' : 'flex flex-wrap justify-center gap-1'}
        >
          {quickAmounts.map((qa) => {
            const val = Math.min(qa.value, maxRaise);
            return (
              <button
                key={qa.label}
                onClick={() => onRaiseChange(val)}
                className={`flex cursor-pointer items-center justify-center rounded-full border bg-transparent font-display font-bold text-bone transition-[transform,border-color,background-color] duration-[160ms] ease-brand hover:-translate-y-0.5 hover:border-bone active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
                  fill ? 'py-2 text-fs-200' : 'px-2.5 py-1 text-fs-200'
                } ${
                  raiseAmount === val ? 'border-bone bg-bone/12' : 'border-bone/[0.18]'
                }`}
              >
                {qa.label}
              </button>
            );
          })}
        </div>

        <div data-tour="raise-slider" className="flex w-full items-center gap-2">
          <span className="font-body tracking-[0.04em] opacity-70 min-w-6 text-fs-100">{minRaise}</span>
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            value={raiseAmount}
            onChange={(e) => onRaiseChange(Number(e.target.value))}
            className="flex-1 cursor-pointer"
          />
          <span className="min-w-[1.875rem] text-center font-display font-bold text-fs-300">{playerChips}</span>
        </div>
      </div>

      <Button data-tour="raise-confirm" variant="primary" size="sm" block onClick={onRaise} disabled={confirmDisabled}>
        {raiseAmount >= allInAmount ? t('game.allInAmount', { amount: playerChips }) : t('game.raiseAmount', { amount: raiseAmount })}
      </Button>
    </div>
  );
};

const RaisePanel: React.FC<RaisePanelProps> = (props) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={motionT(0.2)}
    className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 min-w-[12.5rem] max-w-72 origin-bottom-right rounded-[14px] border border-bone/[0.18] bg-ink p-4 shadow-[0_0.25rem_1rem_rgba(0,0,0,0.25)]"
  >
    <RaiseControls {...props} />
  </motion.div>
);

const RaiseSheet: React.FC<RaisePanelProps & { onClose: () => void }> = ({ onClose, ...props }) => {
  return (
    <motion.div
      className="fixed inset-0 z-200 flex items-end justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={motionT(0.2)}
      onClick={onClose}
    >
      <motion.div
        className="flex w-full max-w-[25rem] flex-col gap-4 rounded-t-[14px] border border-b-[0] border-bone/[0.18] bg-ink px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={motionT(0.32)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-9 self-center rounded-sm bg-bone/20" />
        <RaiseControls {...props} fill />
      </motion.div>
    </motion.div>
  );
};

export { RaisePanel, RaiseSheet };
