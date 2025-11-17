// src/components/PovSlider.tsx
import React from 'react';

interface PovSliderProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  displayValue?: string | number; // NEW: Value to show in the label
  unitLabel?: string;             // NEW: The symbol (e.g., ° or %)
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  orientation: 'horizontal' | 'vertical';
}

const PovSlider: React.FC<PovSliderProps> = ({ 
  label, 
  icon, 
  value,
  displayValue,
  unitLabel = '°', // Default to degrees
  onChange, 
  min, 
  max, 
  step = 1, 
  orientation 
}) => {
  const isVertical = orientation === 'vertical';

  // UPDATED:
  // If vertical, be horizontal by default, then vertical on 'md' screens
  // If horizontal, just be horizontal
  const sliderClasses = isVertical
    ? "w-full h-2 accent-indigo-600 md:w-2 md:h-48 md:[writing-mode:vertical-lr] md:dir-rtl"
    : "w-full h-2 accent-indigo-600";
  
  // UPDATED:
  // If vertical, be a standard (full-width) container on mobile,
  // then switch to 'h-full' on desktop to fill its parent
  const containerClasses = isVertical
    ? "flex flex-col items-center justify-start w-full md:h-full"
    : "w-full flex flex-col items-center";

  // Use the displayValue if provided, otherwise default to the actual value
  const valueToShow = displayValue !== undefined ? displayValue : value;

  return (
    <div className={containerClasses}>
      <label htmlFor={label} className="block text-sm font-medium text-slate-700 mb-2">
        <span className="flex flex-col items-center gap-1">
          {icon}
          <span>{label}</span>
          {/* UPDATED: Use valueToShow and unitLabel */}
          <span className="text-slate-500">{valueToShow}{unitLabel}</span>
        </span>
      </label>
      <input
        type="range"
        id={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={sliderClasses}
      />
    </div>
  );
};

export default PovSlider;