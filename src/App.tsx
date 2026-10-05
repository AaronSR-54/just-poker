import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import Menu from './screens/Menu';
import Local from './screens/Local';
import Game from './screens/Game';
import HandsGuide from './screens/HandsGuide';
import OnboardingCoach from './components/OnboardingCoach';
import Background from './components/Background';
import CrtOverlay from './components/CrtOverlay';
import { page } from './animations/motion';
import { playSfx, preloadSounds } from './audio/sfx';
import { initMusic } from './audio/music';
import { useSettingsStore } from './store/settingsStore';
import { crtSupported } from './utils/crtSupport';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';

function AnimatedRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  useAndroidBackButton(navigate, location.pathname);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={page}
        initial="initial"
        animate="animate"
        exit="exit"
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Menu />} />
          <Route path="/local" element={<Local />} />
          <Route path="/hands" element={<HandsGuide />} />
          <Route path="/game/:gameId" element={<Game />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const crtAmount = useSettingsStore((s) => s.crtAmount);
  const crtOn = crtSupported && crtAmount > 0;

  useEffect(() => {
    preloadSounds();
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const button = target?.closest('button, [role="button"]');
      if (!button || (button as HTMLButtonElement).disabled) return;
      if (button.closest('[data-tour="actions"], [data-tour="raise-panel"]')) return;
      playSfx('ui_click');
    };
    document.addEventListener('click', onClick);
    const disposeMusic = initMusic();
    return () => {
      document.removeEventListener('click', onClick);
      disposeMusic();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <div className="relative h-dvh w-full overflow-hidden bg-ink">
          <div
            className="relative h-full w-full"
            style={
              crtOn
                ? { filter: `url(#jp-crt) brightness(${1 + 0.05 * crtAmount}) contrast(${1 + 0.025 * crtAmount})` }
                : undefined
            }
          >
            <Background />
            <div className="relative z-10 h-full">
              <AnimatedRoutes />
              <OnboardingCoach />
            </div>
          </div>
        </div>
        {crtOn && <CrtOverlay />}
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
