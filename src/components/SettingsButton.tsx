import React from 'react';
import { useI18n } from '../i18n';

interface SettingsButtonProps {
  onClick: () => void;
  inline?: boolean;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick, inline = false }) => {
  const { t } = useI18n();
  return (
  <button
    type="button"
    className={`z-100 flex size-9 cursor-pointer items-center justify-center rounded-full border border-bone/[0.18] bg-ink-600 text-bone transition-[transform,background-color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:bg-ink-400 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
      inline ? '' : 'fixed right-4 top-[max(0.75rem,env(safe-area-inset-top))]'
    }`}
    aria-label={t('settings.open')}
    onClick={onClick}
  >
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  </button>
  );
};

export default SettingsButton;
