import React, { useId } from 'react';
import { MAX_PLAYER_NAME_LENGTH } from '../config/online';

interface NameFieldProps {
  /** Etiqueta del campo, ya traducida. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Nombre genérico que se muestra como placeholder (si el humano no escribe). */
  placeholder: string;
  maxLength?: number;
  /** Versión compacta (móvil bajo o layout denso). */
  compact?: boolean;
}

/**
 * Campo de nombre del jugador. El nombre genérico se muestra como placeholder y
 * se usa si el humano no escribe otro. Sin modal ni acción de regenerar.
 */
const NameField: React.FC<NameFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength = MAX_PLAYER_NAME_LENGTH,
  compact = false,
}) => {
  const inputId = useId();
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65"
      >
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={[
          'rounded-[14px] border-[1.5px] border-bone/40 bg-ink px-4 font-body text-fs-500 text-bone outline-none placeholder:opacity-40 focus-visible:border-bone',
          compact ? 'min-h-12' : 'min-h-14',
        ].join(' ')}
      />
    </div>
  );
};

export default NameField;
