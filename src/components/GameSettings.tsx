import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import SettingSlider from './SettingSlider';
import { GAME_SPEEDS, useSettingsStore, type GameSpeed } from '../store/settingsStore';
import { playSfx } from '../audio/sfx';
import { t as motionT } from '../animations/motion';
import { crtSupported } from '../utils/crtSupport';
import { LOCALES, LOCALE_LABELS, useI18n } from '../i18n';

interface GameSettingsProps {
  onClose: () => void;
  onTutorial?: () => void;
  onHandsGuide?: () => void;
  onLeave?: () => void;
  context?: 'game' | 'home';
}

/** Fila de acción con etiqueta y flecha. */
const LinkRow: React.FC<{ label: string; hint: string; onClick: () => void }> = ({ label, hint, onClick }) => (
  <Button variant="outline" block className="justify-between! gap-3! rounded-[0.875rem]! whitespace-normal! text-left" onClick={onClick}>
    <span className="flex min-w-0 flex-col items-start gap-0.5">
      <span>{label}</span>
      <span className="font-body text-fs-100 leading-[1.35] tracking-[0.04em] normal-case opacity-60">{hint}</span>
    </span>
    <span className="shrink-0 font-display font-bold leading-none text-fs-500">→</span>
  </Button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="flex flex-col gap-3 border-b border-bone/10 pb-5 last:border-b-0 last:pb-0">
    <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">{title}</div>
    {children}
  </section>
);

const GameSettings: React.FC<GameSettingsProps> = ({ onClose, onTutorial, onHandsGuide, onLeave, context = 'game' }) => {
  const { t, locale, setLocale } = useI18n();
  const inGame = context === 'game';
  const speedLabel = (speed: GameSpeed) => `×${new Intl.NumberFormat(locale).format(speed)}`;
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const crtAmount = useSettingsStore((s) => s.crtAmount);
  const gameSpeed = useSettingsStore((s) => s.gameSpeed);
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume);
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume);
  const setCrtAmount = useSettingsStore((s) => s.setCrtAmount);
  const setGameSpeed = useSettingsStore((s) => s.setGameSpeed);

  // Preview del volumen de efectos mientras se arrastra, con límite de frecuencia.
  const lastPreview = useRef(0);
  const handleSfxVolume = (v: number) => {
    setSfxVolume(v);
    const now = Date.now();
    if (now - lastPreview.current < 140) return;
    lastPreview.current = now;
    playSfx('chips_bet');
  };

  return (
    <motion.div
      className="fixed inset-0 z-[420] flex items-end justify-center bg-ink-900/85 sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={motionT(0.2)}
      onClick={onClose}
    >
      <motion.div
        className="flex max-h-[92dvh] w-full max-w-[30rem] flex-col gap-5 overflow-y-auto rounded-t-[14px] border border-bone/[0.18] bg-ink px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:rounded-[14px] sm:px-7 sm:py-7"
        initial={{ y: '6%', scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: '4%', scale: 0.98, opacity: 0 }}
        transition={motionT(0.3)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">{inGame ? t('settings.paused') : 'Just Poker'}</div>
            <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">{t('settings.title')}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={inGame ? t('settings.resume') : t('settings.close')}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-bone/[0.18] bg-bone/[0.06] text-fs-400 text-bone transition-[transform,background-color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:bg-bone/12 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone"
          >
            ✕
          </button>
        </div>

        <Section title={t('settings.title')}>
          <SettingSlider label={t('settings.music')} value={musicVolume} onChange={setMusicVolume} />
          <SettingSlider label={t('settings.sfx')} value={sfxVolume} onChange={handleSfxVolume} />
          {crtSupported && <SettingSlider label={t('settings.crt')} value={crtAmount} onChange={setCrtAmount} />}
          <div className="flex flex-col gap-2">
            <span className="font-display font-bold text-fs-200 text-bone">{t('settings.speed')}</span>
            <div className="grid grid-cols-4 gap-2">
              {GAME_SPEEDS.map((speed: GameSpeed) => {
                const active = speed === gameSpeed;
                return (
                  <button
                    key={speed}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setGameSpeed(speed)}
                    className={`cursor-pointer rounded-full border-[1.5px] py-2 font-display font-bold text-fs-200 transition-[transform,border-color,background-color,color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:border-bone active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
                      active ? 'border-bone bg-bone text-ink' : 'border-bone/40 text-bone'
                    }`}
                  >
                    {speedLabel(speed)}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        <Section title={t('settings.language')}>
          <div className="grid grid-cols-2 gap-2">
            {LOCALES.map((code) => {
              const active = code === locale;
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setLocale(code)}
                  className={`cursor-pointer rounded-full border-[1.5px] py-2 font-display font-bold text-fs-200 transition-[transform,border-color,background-color,color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:border-bone active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
                    active ? 'border-bone bg-bone text-ink' : 'border-bone/40 text-bone'
                  }`}
                >
                  {LOCALE_LABELS[code]}
                </button>
              );
            })}
          </div>
        </Section>

        {(onHandsGuide || onTutorial) && (
          <Section title={t('settings.learn')}>
            {onHandsGuide && <LinkRow label={t('settings.handsGuide')} hint={t('settings.handsGuideHint')} onClick={onHandsGuide} />}
            {onTutorial && <LinkRow label={t('settings.tutorial')} hint={t('settings.tutorialHint')} onClick={onTutorial} />}
          </Section>
        )}

        <Section title={t('settings.support')}>
          <div className="flex flex-col gap-3 rounded-[14px] border border-blind-bb/40 bg-blind-bb/[0.08] p-4">
            <div className="flex flex-col gap-1">
              <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase text-blind-bb">{t('settings.buyMeCoffee')}</div>
              <div className="font-display font-bold leading-none text-fs-500">{t('settings.support')}</div>
            </div>
            <p className="font-body text-fs-200 leading-[1.45] opacity-70">
              {t('settings.supportText')}
            </p>
            <Button
              as="a"
              href="https://buymeacoffee.com/sanz_aar"
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              block
              className="border-blind-bb/40! text-blind-bb!"
            >
              {t('settings.supportCta')}
            </Button>
          </div>
        </Section>

        <div className="flex flex-col gap-2 pt-1">
          <Button variant="primary" block onClick={onClose}>{inGame ? t('settings.resume') : t('settings.back')}</Button>
          {onLeave && (
            <Button
              variant="ghost"
              size="sm"
              block
              onClick={onLeave}
              className="text-danger! hover:opacity-80"
            >
              {t('settings.leave')}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameSettings;
