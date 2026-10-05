import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import SettingSlider from './SettingSlider';
import { GAME_SPEEDS, SPEED_LABELS, useSettingsStore, type GameSpeed } from '../store/settingsStore';
import { playSfx } from '../audio/sfx';
import { t } from '../animations/motion';
import { crtSupported } from '../utils/crtSupport';

interface GameSettingsProps {
  onClose: () => void;
  onTutorial?: () => void;
  onHandsGuide?: () => void;
  onLeave?: () => void;
  context?: 'game' | 'home';
}

/** Fila de acción con etiqueta y flecha. */
const LinkRow: React.FC<{ label: string; hint: string; onClick: () => void }> = ({ label, hint, onClick }) => (
  <Button variant="outline" block className="justify-between! rounded-[0.875rem]! text-left" onClick={onClick}>
    <span className="flex flex-col items-start gap-0.5">
      <span>{label}</span>
      <span className="font-body text-fs-100 tracking-[0.04em] normal-case opacity-60">{hint}</span>
    </span>
    <span className="font-display font-bold leading-none text-fs-500">→</span>
  </Button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="flex flex-col gap-3 border-b border-bone/10 pb-5 last:border-b-0 last:pb-0">
    <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">{title}</div>
    {children}
  </section>
);

const GameSettings: React.FC<GameSettingsProps> = ({ onClose, onTutorial, onHandsGuide, onLeave, context = 'game' }) => {
  const inGame = context === 'game';
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
      transition={t(0.2)}
      onClick={onClose}
    >
      <motion.div
        className="flex max-h-[92dvh] w-full max-w-[30rem] flex-col gap-5 overflow-y-auto rounded-t-[14px] border border-bone/[0.18] bg-ink px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:rounded-[14px] sm:px-7 sm:py-7"
        initial={{ y: '6%', scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: '4%', scale: 0.98, opacity: 0 }}
        transition={t(0.3)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Ajustes"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">{inGame ? 'Partida en pausa' : 'Just Poker'}</div>
            <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">Ajustes</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={inGame ? 'Reanudar partida' : 'Cerrar ajustes'}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-bone/[0.18] bg-bone/[0.06] text-fs-400 text-bone transition-[transform,background-color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:bg-bone/12 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone"
          >
            ✕
          </button>
        </div>

        <Section title="Ajustes">
          <SettingSlider label="Música" value={musicVolume} onChange={setMusicVolume} />
          <SettingSlider label="Efectos de sonido" value={sfxVolume} onChange={handleSfxVolume} />
          {crtSupported && <SettingSlider label="Imagen (CRT)" value={crtAmount} onChange={setCrtAmount} />}
          <div className="flex flex-col gap-2">
            <span className="font-display font-bold text-fs-200 text-bone">Velocidad de juego</span>
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
                    {SPEED_LABELS[speed]}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {(onHandsGuide || onTutorial) && (
          <Section title="Aprende">
            {onHandsGuide && <LinkRow label="Guía de manos" hint="Repasa las diez combinaciones y practica." onClick={onHandsGuide} />}
            {onTutorial && <LinkRow label="Ver tutorial" hint="Juega una mano guiada paso a paso." onClick={onTutorial} />}
          </Section>
        )}

        <Section title="Apoya el proyecto">
          <div className="flex flex-col gap-3 rounded-[14px] border border-blind-bb/40 bg-blind-bb/[0.08] p-4">
            <div className="flex flex-col gap-1">
              <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase text-blind-bb">Buy me a coffee</div>
              <div className="font-display font-bold leading-none text-fs-500">Apoya el proyecto</div>
            </div>
            <p className="font-body text-fs-200 leading-[1.45] opacity-70">
              Just Poker es gratis y sin anuncios. Si te gusta, puedes apoyarme para seguir mejorando la aplicación.
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
              Invítame a un café
            </Button>
          </div>
        </Section>

        <div className="flex flex-col gap-2 pt-1">
          <Button variant="primary" block onClick={onClose}>{inGame ? 'Reanudar partida' : 'Volver'}</Button>
          {onLeave && (
            <Button
              variant="ghost"
              size="sm"
              block
              onClick={onLeave}
              className="text-danger! hover:opacity-80"
            >
              Salir de la partida
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameSettings;
