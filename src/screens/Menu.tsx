import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { loadSavedGame } from '../game/saveGame';
import SettingsButton from '../components/SettingsButton';
import GameSettings from '../components/GameSettings';
import { container, fadeUp } from '../animations/motion';
import { useI18n } from '../i18n';

interface CtaCardProps {
  solid?: boolean;
  stacked?: boolean;
  fill?: boolean;
  half?: boolean;
  dataTour?: string;
  onClick: () => void;
  children: React.ReactNode;
}

const CtaCard: React.FC<CtaCardProps> = ({ solid = false, stacked = false, fill = false, half = false, dataTour, onClick, children }) => {
  const cls = [
    'flex w-full flex-col justify-between text-left cursor-pointer',
    'border-[1.5px] transition-[translate,border-color,background-color,color,filter] duration-[240ms] ease-brand',
    'hover:border-bone hover:translate-x-2 active:translate-x-0',
    'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone',
    stacked
      ? 'min-h-32 rounded-[0.875rem] px-7 py-6'
      : 'h-full rounded-[clamp(0.75rem,3cqw,1rem)] px-[7.6cqw] py-[6.8cqw]',
    solid
      ? 'bg-bone text-ink border-bone hover:brightness-[1.06]'
      : 'border-bone/40 bg-ink text-bone',
  ].join(' ');

  const wrapper = [
    '@container w-full',
    fill ? 'flex-1 min-h-0' : '',
    half ? 'h-[calc((100%-0.75rem)/2)]' : '',
  ].join(' ');

  return (
    <motion.div variants={fadeUp} className={wrapper}>
      <button className={cls} onClick={onClick} data-tour={dataTour}>
        {children}
      </button>
    </motion.div>
  );
};

const CtaTitle: React.FC<{ fixed?: boolean; children: React.ReactNode }> = ({ fixed = false, children }) => (
  <div className={`font-display font-bold leading-[0.96] tracking-[-0.015em] ${fixed ? 'text-[1.5rem]' : 'text-[clamp(1.75rem,10.5cqw,3.75rem)]'}`}>
    {children}
  </div>
);

const CtaFoot: React.FC<{ fixed?: boolean; children: React.ReactNode }> = ({ fixed = false, children }) => (
  <div className="flex items-end justify-between">
    {children}
    <span className={`font-display font-bold leading-none ${fixed ? 'text-[1.5rem]' : 'text-[clamp(1.75rem,7.2cqw,2.5rem)]'}`}>→</span>
  </div>
);

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { t } = useI18n();
  const [saved] = useState(() => loadSavedGame());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const paragraph = t('menu.paragraph');
  const continueHint = (difficulty: string, hand: number) =>
    t('menu.continueHint', { difficulty: t(`difficulty.${difficulty}`), hand });

  const settingsOverlay = (
    <AnimatePresence>
      {settingsOpen && (
        <GameSettings
          context="home"
          onClose={() => setSettingsOpen(false)}
          onTutorial={() => navigate('/game/guide')}
          onHandsGuide={() => navigate('/hands')}
        />
      )}
    </AnimatePresence>
  );

  if (isMobile) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <SettingsButton onClick={() => setSettingsOpen(true)} />
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-5 overflow-y-auto px-[1.375rem] pb-7 pt-8">
          <motion.div
            variants={container(0.09, 0.05)}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            <motion.div
              variants={fadeUp}
              className="flex flex-col font-display font-bold uppercase text-[clamp(2.5rem,min(30vw,14vh),12rem)] leading-[0.86] tracking-[-0.015em]"
            >
              <div className="pl-[0.4rem] text-[0.85em]">Just</div>
              <div className="text-[0.9em]"><em className="font-light italic tracking-normal">Poker</em></div>
            </motion.div>
            <motion.p variants={fadeUp} className="font-body leading-[1.45] mb-0 mt-1.5 text-left opacity-70">{paragraph}</motion.p>
            <motion.div variants={fadeUp} className="font-body leading-[1.45]">{t('menu.tagline')}</motion.div>
          </motion.div>
          <motion.div
            variants={container(0.1, 0.35)}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {saved && (
              <CtaCard solid stacked onClick={() => navigate(`/game/${saved.gameId}?continue=1`)}>
                <CtaTitle fixed>{t('menu.continue')} <em className="font-light italic tracking-normal">{t('menu.continueEm')}</em></CtaTitle>
                <CtaFoot fixed>
                  <div className="font-body leading-[1.45] text-fs-300 opacity-75">
                    {continueHint(saved.difficulty, saved.state.handNumber)}
                  </div>
                </CtaFoot>
              </CtaCard>
            )}
            <CtaCard solid={!saved} stacked dataTour="new-game" onClick={() => navigate('/local')}>
              <CtaTitle fixed>{t('menu.new')} <em className="font-light italic tracking-normal">{t('menu.newEm')}</em></CtaTitle>
              <CtaFoot fixed>
                <div className="font-body leading-[1.45] text-fs-300 opacity-75">
                  {t('menu.newHint')}
                </div>
              </CtaFoot>
            </CtaCard>
          </motion.div>
        </div>
        {settingsOverlay}
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <SettingsButton onClick={() => setSettingsOpen(true)} />
      <div className="mx-auto flex w-full max-w-[87.5rem] flex-1 items-center justify-center px-10 pb-[4.375rem] pt-15 lg:px-20">
        <div className="flex w-full items-stretch justify-center gap-12 lg:gap-32">
          <motion.div
            variants={container(0.09, 0.05)}
            initial="hidden"
            animate="visible"
            className="flex flex-[55] flex-col justify-center gap-3"
          >
            <motion.div
              variants={fadeUp}
              className="flex flex-col font-display font-bold uppercase text-[clamp(6rem,18vw,15rem)] leading-[0.825] tracking-[-0.015em]"
            >
              <div className="pl-[0.4rem] text-[0.85em]">Just</div>
              <div className="text-[0.9em]"><em className="font-light italic tracking-normal">Poker</em></div>
            </motion.div>
            <motion.p variants={fadeUp} className="font-body leading-[1.45] mb-0 mt-1.5 w-0 min-w-full text-left opacity-70">{paragraph}</motion.p>
            <motion.div variants={fadeUp} className="font-body leading-[1.45]">{t('menu.tagline')}</motion.div>
          </motion.div>
          <motion.div
            variants={container(0.1, 0.35)}
            initial="hidden"
            animate="visible"
            className="flex flex-[45] flex-col justify-center gap-3 [contain:size]"
          >
            {saved && (
              <CtaCard solid fill onClick={() => navigate(`/game/${saved.gameId}?continue=1`)}>
                <CtaTitle>{t('menu.continue')} <em className="font-light italic tracking-normal">{t('menu.continueEm')}</em></CtaTitle>
                <CtaFoot>
                  <div className="font-body leading-[1.45] max-w-[65cqw] text-[clamp(0.8125rem,3.3cqw,1rem)] opacity-75">
                    {continueHint(saved.difficulty, saved.state.handNumber)}
                  </div>
                </CtaFoot>
              </CtaCard>
            )}
            <CtaCard solid={!saved} fill={!!saved} half={!saved} dataTour="new-game" onClick={() => navigate('/local')}>
              <CtaTitle>{t('menu.new')} <em className="font-light italic tracking-normal">{t('menu.newEm')}</em></CtaTitle>
              <CtaFoot>
                <div className="font-body leading-[1.45] max-w-[65cqw] text-[clamp(0.8125rem,3.3cqw,1rem)] opacity-75">
                  {t('menu.newHint')}
                </div>
              </CtaFoot>
            </CtaCard>
          </motion.div>
        </div>
      </div>
      {settingsOverlay}
    </div>
  );
};

export default Menu;
