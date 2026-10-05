import React from 'react';

interface SettingSliderProps {
  label: string;
  /** Valor entre 0 y 1. */
  value: number;
  onChange: (value: number) => void;
  /** Texto a mostrar a la derecha; por defecto, el porcentaje. */
  valueLabel?: string;
  disabled?: boolean;
}

const SettingSlider: React.FC<SettingSliderProps> = ({ label, value, onChange, valueLabel, disabled = false }) => (
  <label className={`flex flex-col gap-1.5 ${disabled ? 'opacity-40' : ''}`}>
    <span className="flex items-center justify-between gap-3">
      <span className="font-display font-bold text-fs-200 text-bone">{label}</span>
      <span className="font-display font-bold text-fs-100 tracking-[0.08em] uppercase opacity-60">
        {valueLabel ?? `${Math.round(value * 100)}%`}
      </span>
    </span>
    <input
      type="range"
      min={0}
      max={1}
      step={0.05}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full cursor-pointer disabled:cursor-not-allowed"
    />
  </label>
);

export default SettingSlider;
