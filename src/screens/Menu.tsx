import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { loadSavedGame } from '../game/saveGame';
import SettingsButton from '../components/SettingsButton';
import GameSettings from '../components/GameSettings';
import Hero from '../components/Hero';
import CtaCard from '../components/CtaCard';
import { container } from '../animations/motion';
import { useI18n } from '../i18n';
import { ONLINE_ENABLED } from '../config/features';
import { getActiveOnlineSession } from '../net/onlineSession';

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { t } = useI18n();
  const [saved] = useState(() => loadSavedGame());
  const [onlineSession] = useState(() => getActiveOnlineSession());
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const cards = (
    <>
      <CtaCard
        stacked={isMobile}
        fill={!isMobile}
        dataTour="play-local"
        onClick={() => navigate(saved ? `/game/${saved.gameId}?continue=1` : '/local')}
        label={saved ? t('menu.continue') : t('menu.newGame')}
        hint={t('menu.localHint')}
        status={saved ? t('menu.continueGame') : undefined}
        context={
          saved
            ? t('menu.localResume', { difficulty: t(`difficulty.${saved.difficulty}`), hand: saved.state.handNumber })
            : undefined
        }
        onNewGame={saved ? () => navigate('/local') : undefined}
        newGameLabel={t('menu.newGame')}
      >
        {t('menu.localTitle')} <em className="font-light italic tracking-normal">{t('menu.localTitleEm')}</em>
      </CtaCard>

      {ONLINE_ENABLED && (
        <CtaCard
          stacked={isMobile}
          fill={!isMobile}
          dataTour="play-friends"
          onClick={() => navigate(onlineSession ? `/game/online-${onlineSession.roomId}` : '/online')}
          label={onlineSession ? t('menu.continue') : t('menu.newGame')}
          hint={t('menu.friendsHint')}
          status={onlineSession ? t('menu.continueGame') : undefined}
          context={
            onlineSession
              ? t('online.roomContext', { code: onlineSession.code, count: onlineSession.seats.length })
              : undefined
          }
          onNewGame={onlineSession ? () => navigate('/online', { state: { newGame: true } }) : undefined}
          newGameLabel={t('menu.newGame')}
        >
          {t('menu.friendsTitle')} <em className="font-light italic tracking-normal">{t('menu.friendsTitleEm')}</em>
        </CtaCard>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <SettingsButton onClick={() => setSettingsOpen(true)} />
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-5 overflow-y-auto px-[1.375rem] pb-7 pt-8">
          <Hero size="mobile" />
          <motion.div
            variants={container(0.1, 0.35)}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {cards}
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
          <Hero size="desktop" />
          <motion.div
            variants={container(0.1, 0.35)}
            initial="hidden"
            animate="visible"
            className="flex flex-[45] flex-col justify-center gap-3 [contain:size]"
          >
            {cards}
          </motion.div>
        </div>
      </div>
      {settingsOverlay}
    </div>
  );
};

export default Menu;
