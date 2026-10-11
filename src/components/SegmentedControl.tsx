import React from 'react';

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
  ariaLabel?: string;
}

const COLUMNS: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

function SegmentedControl<T extends string | number | boolean>({
  options,
  value,
  onChange,
  columns = 2,
  ariaLabel,
}: SegmentedControlProps<T>): React.ReactElement {
  return (
    <div className={`grid gap-2 ${COLUMNS[columns]}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer rounded-full border-[1.5px] py-2 font-display font-bold text-fs-200 transition-[transform,border-color,background-color,color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:border-bone active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
              active ? 'border-bone bg-bone text-ink' : 'border-bone/40 text-bone'
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
