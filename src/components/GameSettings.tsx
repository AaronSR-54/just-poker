import React, { useRef } from 'react';
import Button from './Button';
import Modal from './Modal';
import Wordmark from './Wordmark';
import SettingSlider from './SettingSlider';
import SegmentedControl from './SegmentedControl';
import { GAME_SPEEDS, useSettingsStore, type GameSpeed } from '../store/settingsStore';
import { useCapabilityStore } from '../store/capabilityStore';
import { playSfx } from '../audio/sfx';
import { crtSupported } from '../utils/crtSupport';
import { LOCALES, LOCALE_LABELS, useI18n } from '../i18n';

interface GameSettingsProps {
  open?: boolean;
  onClose: () => void;
  onTutorial?: () => void;
  onHandsGuide?: () => void;
  onLeave?: () => void;
  context?: 'game' | 'home' | 'online';
}

/** Fila de acción con etiqueta y flecha. */
const LinkRow: React.FC<{ label: string; hint: string; onClick: () => void }> = ({ label, hint, onClick }) => (
  <Button variant="outline" block className="justify-between! gap-3! rounded-[0.875rem]! whitespace-normal! text-left" onClick={onClick}>
    <span className="flex min-w-0 flex-col items-start gap-0.5">
      <span>{label}</span>
      <span className="font-body text-fs-100 leading-[1.35] tracking-[0.04em] normal-case opacity-60">{hint}</span>
    </span>
    <span className="shrink-0 font-body font-bold leading-none text-fs-500">→</span>
  </Button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="flex flex-col gap-3 border-b border-bone/10 pb-5 last:border-b-0 last:pb-0">
    <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">{title}</div>
    {children}
  </section>
);

const GameSettings: React.FC<GameSettingsProps> = ({ open = true, onClose, onTutorial, onHandsGuide, onLeave, context = 'game' }) => {
  const { t, locale, setLocale } = useI18n();
  const inGame = context !== 'home';
  const showSpeed = context !== 'online';
  const speedLabel = (speed: GameSpeed) => `×${new Intl.NumberFormat(locale).format(speed)}`;
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const crtAmount = useSettingsStore((s) => s.crtAmount);
  const gameSpeed = useSettingsStore((s) => s.gameSpeed);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const musicSupported = useCapabilityStore((s) => s.music);
  const sfxSupported = useCapabilityStore((s) => s.sfx);
  const hapticsSupported = useCapabilityStore((s) => s.haptics);
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume);
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume);
  const setCrtAmount = useSettingsStore((s) => s.setCrtAmount);
  const setGameSpeed = useSettingsStore((s) => s.setGameSpeed);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);

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
    <Modal
      open={open}
      onClose={onClose}
      labelId="settings-title"
      panelClassName="max-h-[92dvh]! max-w-[30rem]! gap-5! overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">
            {inGame ? t('settings.paused') : <Wordmark className="text-fs-100 tracking-[0.14em]" />}
          </div>
          <div id="settings-title" className="font-display font-bold tracking-[-0.01em] text-fs-700">{t('settings.title')}</div>
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
        {musicSupported && <SettingSlider label={t('settings.music')} value={musicVolume} onChange={setMusicVolume} />}
        {sfxSupported && <SettingSlider label={t('settings.sfx')} value={sfxVolume} onChange={handleSfxVolume} />}
        {crtSupported && <SettingSlider label={t('settings.crt')} value={crtAmount} onChange={setCrtAmount} />}
        {showSpeed && (
          <div className="flex flex-col gap-2">
            <span className="font-display font-bold text-fs-200 text-bone">{t('settings.speed')}</span>
            <SegmentedControl
              columns={4}
              ariaLabel={t('settings.speed')}
              value={gameSpeed}
              onChange={setGameSpeed}
              options={GAME_SPEEDS.map((speed: GameSpeed) => ({ value: speed, label: speedLabel(speed) }))}
            />
          </div>
        )}
      </Section>

      {hapticsSupported && (
        <Section title={t('settings.haptics')}>
          <SegmentedControl
            columns={2}
            ariaLabel={t('settings.haptics')}
            value={hapticsEnabled}
            onChange={setHapticsEnabled}
            options={[
              { value: true, label: t('settings.hapticsOn') },
              { value: false, label: t('settings.hapticsOff') },
            ]}
          />
        </Section>
      )}

      <Section title={t('settings.language')}>
        <SegmentedControl
          columns={2}
          ariaLabel={t('settings.language')}
          value={locale}
          onChange={setLocale}
          options={LOCALES.map((code) => ({ value: code, label: LOCALE_LABELS[code] }))}
        />
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
            <div className="font-display font-bold text-fs-500">{t('settings.support')}</div>
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
    </Modal>
  );
};

export default GameSettings;
