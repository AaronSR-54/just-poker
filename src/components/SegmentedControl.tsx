import React from 'react';

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T> {
  options: readonly SegmentedOption<T>[];
  /** Valor activo, o lista de valores activos si varias opciones comparten selección. */
  value: T | readonly T[];
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3 | 4;
  /** Reparte las filas para ocupar todo el alto del contenedor (sin scroll). */
  fill?: boolean;
  /** Aspecto de la opción activa: relleno sólido o resaltado sutil. */
  variant?: 'solid' | 'subtle';
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

const COLUMNS: Record<1 | 2 | 3 | 4, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const SIZES = { sm: 'py-1', md: 'py-2' } as const;

const VARIANTS = {
  solid: { active: 'border-bone bg-bone text-ink', idle: 'border-bone/40 text-bone' },
  subtle: { active: 'border-bone bg-bone/12 text-bone', idle: 'border-bone/[0.18] text-bone' },
} as const;

function SegmentedControl<T extends string | number | boolean>({
  options,
  value,
  onChange,
  columns = 2,
  fill = false,
  variant = 'solid',
  size = 'md',
  ariaLabel,
}: SegmentedControlProps<T>): React.ReactElement {
  const styles = VARIANTS[variant];
  const isActive = (v: T) => (Array.isArray(value) ? value.includes(v) : v === value);
  return (
    <div className={`grid gap-2 ${COLUMNS[columns]} ${fill ? 'h-full auto-rows-fr' : ''}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = isActive(option.value);
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex cursor-pointer items-center justify-center rounded-full border-[1.5px] font-display font-bold text-fs-200 transition-[transform,border-color,background-color,color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:border-bone active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${SIZES[size]} ${
              active ? styles.active : styles.idle
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
