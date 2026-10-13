import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../../components/Button';
import ChipIcon from '../../../components/ChipIcon';
import Modal from '../../../components/Modal';
import SegmentedControl from '../../../components/SegmentedControl';
import { motionT } from '../../../animations/motion';
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
  const clampedQuick = Math.min(raiseAmount, maxRaise);
  const activeQuick = quickAmounts.reduce<number[]>((acc, qa, i) => {
    if (Math.min(qa.value, maxRaise) === clampedQuick) acc.push(i);
    return acc;
  }, []);

  const gapCls = fill ? 'gap-6' : 'gap-2.5';

  return (
    <div data-tour="raise-panel" className={`flex w-full flex-col ${gapCls}`}>
      <div data-tour="raise-amount" className={`flex w-full flex-col ${gapCls}`}>
        <div data-tour="raise-quick">
          <SegmentedControl
            columns={hideAllIn ? 3 : 4}
            variant="subtle"
            size={fill ? 'md' : 'sm'}
            ariaLabel={t('game.quickRaise')}
            value={activeQuick}
            onChange={(i) => onRaiseChange(Math.min(quickAmounts[i].value, maxRaise))}
            options={quickAmounts.map((qa, i) => ({ value: i, label: qa.label }))}
          />
        </div>

        <div data-tour="raise-slider" className="flex w-full items-center gap-2">
          <span className="font-display font-bold text-fs-300">{minRaise}</span>
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            value={raiseAmount}
            onChange={(e) => onRaiseChange(Number(e.target.value))}
            className="flex-1 cursor-pointer"
          />
          <span className="font-display font-bold text-fs-300">{playerChips}</span>
        </div>
      </div>

      <Button data-tour="raise-confirm" variant="primary" size="sm" block className="text-fs-300!" onClick={onRaise} disabled={confirmDisabled}>
        <span className="inline-flex items-center gap-1.5">
          <span className='leading-none'>{raiseAmount >= allInAmount ? t('game.quickAllIn') : t('game.raise')}</span>
          <span className="inline-flex items-center gap-0.5">
            <ChipIcon className="size-4.5" />
            <span className="font-display font-bold tabular-nums">{raiseAmount >= allInAmount ? playerChips : raiseAmount}</span>
          </span>
        </span>
      </Button>
    </div>
  );
};

const RaisePanel: React.FC<RaisePanelProps> = (props) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={motionT(0.2)}
    className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 min-w-[20rem] max-w-96 origin-bottom-right rounded-[14px] border border-bone/[0.18] bg-ink p-4 shadow-lg"
  >
    <RaiseControls {...props} />
  </motion.div>
);

const RaiseSheet: React.FC<RaisePanelProps & { open: boolean; onClose: () => void }> = ({ open, onClose, ...props }) => {
  return (
    <Modal open={open} onClose={onClose} variant="sheet">
      <div className="h-1 w-9 self-center rounded-sm bg-bone/20" />
      <RaiseControls {...props} fill />
    </Modal>
  );
};

export { RaisePanel, RaiseSheet };
